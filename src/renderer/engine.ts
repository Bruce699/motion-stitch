import { SourcePreview } from "./source-preview";
import { fitPreviewSize, type PixelSize } from "../core/preview-size";
import {
  clipDocument,
  sourceTime,
  type CompositionGraph,
} from "../core/compositions";
import type { ParameterValues } from "../core/parameters";
import * as THREE from "three";
import { SurfaceResources } from "./surface-resources";
import type { SourceStatus } from "../core/source-status";
import {
  DEFAULT_SURFACE_BUDGET_MB,
  type RenderMetrics,
} from "../core/render-metrics";
import { staticFrameKey } from "../core/static-frame";
import { SurfaceDepthOfField } from "./surface-depth-of-field";
import { DepthOfField, focusDistance } from "./depth-of-field";
import { alignInspectionFront, applyIsometricCamera } from "./camera";
import { clamp, lerp, ease, segment } from "../core/motion";
import { values, type SceneDocument } from "../core/schema";
import type { SceneFactory, SceneInstance } from "../core/runtime";
import { defaultInspection } from "../core/context";
import {
  layerTextureKey,
  type CapturedFrame,
  type LayerFrame,
} from "../core/layers";
import { LayeredSource } from "./layered-source";
import { parameterReader } from "../core/parameters";
import {
  MAX_CANVAS_EDGE,
  MAX_CANVAS_PIXELS,
  type SourceQuality,
} from "../core/quality";

export type CompositionFrameSource = (
  sceneId: string,
  time: number,
  revision?: string,
  zoom?: number,
  knownImages?: Record<string, string>,
  overrides?: ParameterValues,
) => Promise<CapturedFrame>;
type CompositionBudget = { limit: number; nodes: Set<SceneEngine> };
export class SceneEngine {
  private previews = new Map<string, SourcePreview>();
  private domPresented = false;
  private rasterOnly = false;
  mountSourcePreviews(stage: HTMLElement, urls: Record<string,string> = {}) {
    for (const spec of this.document.sources) {
      if (!urls[spec.id]) continue;
      const preview = new SourcePreview(spec, urls[spec.id]);
      this.previews.set(spec.id, preview);
      stage.append(preview.element);
    }
  }
  private selectedPreview() {
    return this.mode === "source" && !this.rasterOnly
      ? this.previews.get(this.sourceId || this.document.sources[0]?.id)
      : undefined;
  }
  async captureFrame(time: number, document: SceneDocument, revision?: string) {
    this.rasterOnly = true;
    try { await this.sample(time, document, () => true, revision); return this.canvas.toDataURL("image/png"); }
    finally { this.rasterOnly = false; }
  }
  private budget: CompositionBudget;
  cameraId?: string;
  private graph?: CompositionGraph;
  private frameSource?: CompositionFrameSource;
  private clipMeshes: Record<
    string,
    THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  > = {};
  private children = new Map<
    string,
    { engine: SceneEngine; target: THREE.WebGLRenderTarget }
  >();
  private parameterOverrides?: ParameterValues;
  renderer: THREE.WebGLRenderer;
  world = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  mode: "source" | "camera" = "camera";
  sourceId: string | null = null;
  sourceRoutes: { id: string; route: string }[] = [];
  quality: SourceQuality[] = [];
  private previewViewport?: { width: number; height: number; dpr: number };
  layerFrames: LayerFrame[] = [];
  private layeredSources: LayeredSource[] = [];
  private cameraFrames = new Map<string, THREE.Object3D>();
  private isometricCamera = new THREE.OrthographicCamera();
  private referenceFrame = new THREE.Object3D();
  private presentedLayers: ReturnType<LayeredSource["describe"]> = [];
  inspection = defaultInspection();
  private flatWorld = new THREE.Scene();
  private flatCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  private flatPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ transparent: true }),
  );
  textures: Record<string, THREE.Texture> = {};
  private resources: SurfaceResources;
  private outputSamples: number;
  metrics?: RenderMetrics;
  sourceStatus: SourceStatus[] = [];
  private instance?: SceneInstance;
  private disposed = false;
  // Decoded textures and arbitrary scene code can change while a sample awaits.
  // Inspection must never expose those incomplete changes on the last good canvas.
  private frameBlocked = true;
  private depthOfField?: DepthOfField;
  private surfaceDepthOfField?: SurfaceDepthOfField;
  private focusPoint = new THREE.Vector3();
  private reviewCamera?: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private serial: Promise<unknown> = Promise.resolve();
  private staticFrame?: CapturedFrame;
  private staticKey: string | null = null;
  private preparedSource?: {
    time: number;
    contract: string;
    frame: CapturedFrame;
  };
  constructor(
    public document: SceneDocument,
    private source: (
      time: number,
      revision?: string,
      captureZoom?: number,
      knownImages?: Record<string, string>,
      overrides?: ParameterValues,
    ) => Promise<CapturedFrame>,
    private shared?: {
      renderer: THREE.WebGLRenderer;
      target: THREE.WebGLRenderTarget;
      budget?: CompositionBudget;
    },
    private previewOptions?: { maxSize: PixelSize; maxSurfaceSize?: PixelSize },
  ) {
    this.budget = shared?.budget ?? {
      limit:
        (document.capture?.memoryBudgetMB ?? DEFAULT_SURFACE_BUDGET_MB) *
        1024 *
        1024,
      nodes: new Set(),
    };
    this.budget.nodes.add(this);
    this.renderer =
      shared?.renderer ??
      new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      });
    if (!shared) this.renderer.setPixelRatio(1);
    const gl = this.renderer.getContext();
    this.outputSamples = Math.max(1, Number(gl.getParameter(gl.SAMPLES)) || 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.debug.onShaderError = (gl, _program, vertex, fragment) => {
      throw new Error(
        "Shader failed: " +
          [gl.getShaderInfoLog(vertex), gl.getShaderInfoLog(fragment)]
            .filter(Boolean)
            .join("\n"),
      );
    };
    this.renderer.setClearColor(document.background);
    this.camera.aspect = document.size.width / document.size.height;
    this.camera.position.z = 7;
    this.camera.updateProjectionMatrix();
    this.flatCamera.position.z = 2;
    this.flatWorld.add(this.flatPlane);
    const keys = document.sources.flatMap((s) => [
      s.id,
      ...(s.layers?.length
        ? ["base", ...s.layers.map((l) => l.id)].map((id) =>
            layerTextureKey(s.id, id),
          )
        : []),
    ]);
    this.resources = new SurfaceResources(
      keys,
      this.renderer.capabilities.maxTextureSize,
      this.renderer.capabilities.getMaxAnisotropy(),
      undefined,
      previewOptions?.maxSurfaceSize,
    );
    this.resources.budgetBytes = this.remainingBudget();
    try {
      const size = fitPreviewSize(document.size, previewOptions?.maxSize);
      this.resources.reserveRenderTargets(this.outputMemory(size.width, size.height));
      if (!shared)
        this.renderer.setSize(size.width, size.height, false);
    } catch (error) {
      this.dispose();
      throw error;
    }
    this.textures = this.resources.textures;
  }
  get canvas() {
    return this.renderer.domElement;
  }
  setPreviewViewport(width: number, height: number, dpr: number) {
    this.previewViewport = { width, height, dpr };
    if (!this.frameBlocked || this.shared) return this.resize();
    return false;
  }
  private outputMemory(
    width = this.shared?.target.width ?? this.canvas.width,
    height = this.shared?.target.height ?? this.canvas.height,
  ) {
    // Color+depth multisample storage and resolved/preserved RGBA output.
    return (
      width *
      height *
      (this.shared
        ? 12 * Math.max(1, this.shared.target.samples) + 12
        : 8 * this.outputSamples + 8)
    );
  }
  private effectMemory() {
    return (
      (this.depthOfField?.residentBytes ?? 0) +
      (this.surfaceDepthOfField?.residentBytes ?? 0)
    );
  }
  private resize() {
    let resized = false;
    const { width, height } = this.document.size;
    const v = this.previewViewport;
    const requested = v
      ? Math.max(1, (v.width * v.dpr) / width, (v.height * v.dpr) / height)
      : 1;
    const scale = Math.min(
      requested,
      MAX_CANVAS_EDGE / Math.max(width, height),
      Math.sqrt(MAX_CANVAS_PIXELS / (width * height)),
    );
    const size = fitPreviewSize(
      { width: Math.round(width * scale), height: Math.round(height * scale) },
      this.previewOptions?.maxSize,
    );
    const w = size.width, h = size.height;
    if (this.shared) {
      if (this.shared.target.width !== w || this.shared.target.height !== h) {
        this.resources.budgetBytes = this.remainingBudget();
        this.resources.reserveRenderTargets(
          this.outputMemory(w, h) + this.effectMemory(),
          this.outputMemory(w, h) + this.outputMemory() + this.effectMemory(),
        );
        this.shared.target.setSize(w, h);
        resized = true;
      }
    } else if (this.canvas.width !== w || this.canvas.height !== h) {
      this.resources.reserveRenderTargets(
        this.outputMemory(w, h) + this.effectMemory(),
        this.outputMemory(w, h) + this.outputMemory() + this.effectMemory(),
      );
      this.renderer.setSize(w, h, false);
      resized = true;
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    return resized;
  }
  async init(
    url: string,
    graph?: CompositionGraph,
    frameSource?: CompositionFrameSource,
  ) {
    this.graph = graph;
    this.frameSource = frameSource;
    for (const clip of this.document.clips ?? []) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      mesh.visible = false;
      this.clipMeshes[clip.id] = mesh;
      this.world.add(mesh);
    }

    const module = await import(/* @vite-ignore */ url);
    if (typeof module.default !== "function")
      throw new Error("scene.ts must default-export a scene factory");
    this.instance = await (module.default as SceneFactory)({
      THREE,
      world: this.world,
      camera: this.camera,
      registerCameraFrame: (id, object) => {
        if (id === null) {
          this.referenceFrame = object;
          return;
        }
        if (!this.document.sources.some((source) => source.id === id))
          throw new Error(`Unknown camera source ${id}`);
        this.cameraFrames.set(id, object);
      },
      surfaces: this.textures,
      clips: this.clipMeshes,
      createLayeredSource: (id, options) => {
        const source = this.document.sources.find((s) => s.id === id);
        if (!source) throw new Error(`Unknown source ${id}`);
        const result = new LayeredSource(source, this.textures, options);
        this.layeredSources.push(result);
        this.cameraFrames.set(id, result.group);
        return result;
      },
      document: this.document,
      motion: { clamp, lerp, ease, segment },
    });
    if (typeof this.instance?.sample !== "function")
      throw new Error("Scene factory must return sample(frame)");
  }
  sample(
    time: number,
    document = this.document,
    present: () => boolean = () => true,
    revision?: string,
  ) {
    return this.sampleFrame(time, document, present, revision, false);
  }
  /** A paused camera edit can reuse the already prepared browser state at that
   * exact time. Authored scene code still receives every draft document, so it
   * may react to camera settings just as it does during a regular sample.
   */
  sampleCamera(
    time: number,
    document = this.document,
    present: () => boolean = () => true,
    revision?: string,
  ) {
    return this.sampleFrame(time, document, present, revision, true);
  }
  private sampleFrame(
    time: number,
    document: SceneDocument,
    present: () => boolean,
    revision: string | undefined,
    reusePreparedSource: boolean,
  ) {
    const requestedAt = performance.now();
    const task = this.serial.then(async () => {
      if (this.disposed) return;
      const started = performance.now();
      const preview = this.selectedPreview();
      if (preview) {
        const route = await preview.sample(time, values(document));
        if (this.disposed || !present()) return;
        this.document = document;
        this.domPresented = true;
        this.frameBlocked = false;
        this.preparedSource = undefined;
        this.sourceRoutes = [{id:preview.spec.id, route}];
        this.sourceStatus = [{sourceId:preview.spec.id,phase:"ready",adapter:{ready:true,sample:true},reused:false,requestedTime:time,preparedTime:time,captures:0,capturedBytes:0,timings:{adapterMs:performance.now()-started,totalMs:performance.now()-started}}];
        this.layerFrames = [];
        this.presentedLayers = [];
        this.renderView();
        this.metrics = {time,revision,presentation:"dom",queueMs:started-requestedAt,sourceMs:performance.now()-started,decodeMs:0,sceneMs:0,renderSubmitMs:0,totalMs:performance.now()-requestedAt,decodedImages:0,reusedImages:0,transferredBytes:0,...this.resources.memory};
        return;
      }
      this.domPresented = false;
      if (!this.shared)
        this.budget.limit =
          (document.capture?.memoryBudgetMB ?? DEFAULT_SURFACE_BUDGET_MB) *
          1024 *
          1024;
      this.resources.budgetBytes = this.remainingBudget();
      const previewScale = this.previewViewport
        ? Math.max(
            1,
            (this.previewViewport.width * this.previewViewport.dpr) /
              document.size.width,
            (this.previewViewport.height * this.previewViewport.dpr) /
              document.size.height,
          )
        : 1;
      const zoom = Math.min(
        12,
        previewScale *
          this.inspection.zoom *
          (this.mode === "camera" ? (document.camera?.zoom ?? 1) : 1),
      );
      const contract = JSON.stringify([
        document.entry,
        document.sources,
        document.size,
        document.capture,
        zoom,
      ]);
      const prepared =
        reusePreparedSource &&
        !this.frameBlocked &&
        this.preparedSource?.time === time &&
        this.preparedSource.contract === contract
          ? this.preparedSource.frame
          : undefined;
      // Any failed or explicitly invalidated preparation must reacquire source
      // state before the camera shortcut can become eligible again.
      this.preparedSource = undefined;
      this.frameBlocked = true;
      const key = staticFrameKey(document, zoom);
      const frame =
        prepared ??
        (key !== null && key === this.staticKey && this.staticFrame
          ? this.staticFrame
          : await this.source(
              time,
              revision,
              zoom,
              this.resources.knownImages(),
              this.parameterOverrides,
            ));
      const sourceMs = performance.now() - started;
      // Static reuse intentionally retains pixels while its absolute scene time advances.
      const reusedStatic = frame === this.staticFrame;
      const reusedSource = Boolean(prepared) || reusedStatic;
      if (
        !reusedSource &&
        frame.sample &&
        (frame.sample.time !== time ||
          (revision &&
            frame.sample.revision &&
            frame.sample.revision !== revision))
      )
        throw new Error(
          "Source frame does not match the requested time and revision",
        );
      const { routes, layers, quality } = frame;
      this.resources.setSourceMemory(frame.sourceMemoryBytes ?? 0);
      this.resources.reserveRenderTargets(
        this.outputMemory() + this.effectMemory(),
      );
      const resources = await this.resources.accept(frame);
      if (this.disposed) return;
      const sceneStarted = performance.now();
      this.document = document;
      for (const source of this.layeredSources) {
        const frame = layers?.find((f) => f.sourceId === source.source.id);
        if (!frame)
          throw new Error(
            `Source ${source.source.id} did not provide layer frames`,
          );
        source.update(frame);
      }
      this.staticKey = key;
      // Keep metadata/acknowledgements, never an extra copy of encoded static pixels.
      this.staticFrame =
        key === null
          ? undefined
          : { ...frame, images: {}, surfaces: undefined };
      await this.sampleClips(time, document);
      await this.instance!.sample({
        time,
        cameraId: this.cameraId ?? document.defaultCameraId ?? "main",
        frame: Math.round(time * document.fps),
        parameters: values(document),
        controls: parameterReader(document.parameters),
        document,
        raster: {
          ...fitPreviewSize(document.size, this.previewOptions?.maxSize),
          ...(this.previewOptions?.maxSurfaceSize
            ? { maxSurfaceSize: this.previewOptions.maxSurfaceSize }
            : {}),
        },
      });
      if (this.disposed || !present()) return;
      this.resources.budgetBytes = this.remainingBudget();
      this.resize();
      this.renderer.setClearColor(document.background);
      const sceneMs = performance.now() - sceneStarted;
      if (routes) this.sourceRoutes = routes;
      this.sourceStatus = (frame.sourceStatus ?? []).map((source) =>
        reusedSource
          ? {
              ...source,
              requestedTime: time,
              preparedTime: time,
              reused: true,
              captures: 0,
              capturedBytes: 0,
              timings: {
                ...source.timings,
                adapterMs: 0,
                paintMs: 0,
                captureMs: 0,
                totalMs: 0,
              },
            }
          : source,
      );
      this.quality = [
        ...(quality || []),
        ...[...this.children].flatMap(([id, child]) =>
          child.engine.quality.map((quality) => ({
            ...quality,
            sourceId: id + "/" + quality.sourceId,
          })),
        ),
      ];
      this.layerFrames = layers || [];
      const renderStarted = performance.now();
      this.frameBlocked = false;
      this.renderView();
      this.metrics = {
        presentation: "raster",
        time,
        revision,
        queueMs: started - requestedAt,
        sourceMs,
        ...resources,
        ...this.resources.memory,
        ...(!this.shared
          ? {
              residentSurfaceBytes: [...this.budget.nodes].reduce(
                (sum, node) => sum + node.resources.memory.residentSurfaceBytes,
                0,
              ),
              sourceCaptureBytes: [...this.budget.nodes].reduce(
                (sum, node) => sum + node.resources.memory.sourceCaptureBytes,
                0,
              ),
              renderTargetBytes: [...this.budget.nodes].reduce(
                (sum, node) => sum + node.resources.memory.renderTargetBytes,
                0,
              ),
              residentManagedBytes: [...this.budget.nodes].reduce(
                (sum, node) => sum + node.resources.memory.residentManagedBytes,
                0,
              ),
              surfaceBudgetBytes: this.budget.limit,
            }
          : {}),
        sceneMs,
        renderSubmitMs: performance.now() - renderStarted,
        totalMs: performance.now() - requestedAt,
      };
      this.presentedLayers = this.layeredSources.flatMap((s) => s.describe());
      this.preparedSource = {
        time,
        contract,
        // SurfaceResources owns decoded pixels. Keep only layout, routes,
        // versions and diagnostics; never retain another encoded image copy.
        frame: { ...frame, images: {}, surfaces: undefined },
      };
    });
    const guarded = task.catch((error) => {
      this.frameBlocked = true;
      throw error;
    });
    this.serial = guarded.catch(() => {});
    return guarded;
  }
  private remainingBudget() {
    return Math.max(
      0,
      this.budget.limit -
        [...this.budget.nodes]
          .filter((node) => node !== this)
          .reduce(
            (sum, node) =>
              sum + (node.resources?.memory.residentManagedBytes ?? 0),
            0,
          ),
    );
  }
  private async sampleClips(time: number, document: SceneDocument) {
    for (const [index, clip] of (document.clips ?? []).entries()) {
      const mesh = this.clipMeshes[clip.id];
      if (!mesh)
        throw new Error("Composition structure changed; reload required");
      // End-exclusive intervals make a cut choose exactly one side.
      mesh.visible = time >= clip.start && time < clip.end;
      if (!mesh.visible) {
        const child = this.children.get(clip.id);
        if (child) {
          child.engine.dispose();
          child.target.dispose();
          this.children.delete(clip.id);
          mesh.material.map = null;
        }
        continue;
      }
      const prepared = this.graph?.[clip.compositionId];
      if (!prepared || !this.frameSource)
        throw new Error("Missing prepared composition: " + clip.compositionId);
      const doc = clipDocument(prepared.scene, clip, document);
      let child = this.children.get(clip.id);
      if (!child) {
        const size = fitPreviewSize(doc.size, this.previewOptions?.maxSize);
        const target = new THREE.WebGLRenderTarget(
          size.width,
          size.height,
          {
            type: THREE.HalfFloatType,
            samples: Math.min(4, this.renderer.capabilities.maxSamples),
          },
        );
        const engine = new SceneEngine(
          doc,
          (t, revision, zoom, known, overrides) =>
            this.frameSource!(
              clip.compositionId,
              t,
              revision,
              zoom,
              known,
              overrides,
            ),
          { renderer: this.renderer, target, budget: this.budget },
          this.previewOptions,
        );
        child = { engine, target };
        try {
          await engine.init(prepared.url, this.graph, this.frameSource);
        } catch (error) {
          engine.dispose();
          target.dispose();
          throw error;
        }
        this.children.set(clip.id, child);
      }
      const outputWidth = this.shared?.target.width ?? this.canvas.width;
      const outputHeight = this.shared?.target.height ?? this.canvas.height;
      child.engine.setPreviewViewport(outputWidth, outputHeight, 1);
      child.engine.cameraId =
        clip.cameraId ?? prepared.scene.defaultCameraId ?? "main";
      child.engine.parameterOverrides = Object.fromEntries(
        (prepared.scene.exposedParameters ?? []).map((key) => [
          key,
          doc.parameters[key].value,
        ]),
      );
      await child.engine.sample(
        sourceTime(clip, time),
        doc,
        () => !this.disposed,
        prepared.revision,
      );
      mesh.material.map = child.target.texture;
      mesh.material.opacity = clip.opacity;
      mesh.material.needsUpdate = true;
      const height = 2 * 7 * Math.tan(THREE.MathUtils.degToRad(35 / 2));
      const fit = Math.min(
        height / doc.size.height,
        (height * document.size.width) / document.size.height / doc.size.width,
      );
      mesh.scale.set(
        doc.size.width * fit * clip.scale,
        doc.size.height * fit * clip.scale,
        1,
      );
      mesh.position.fromArray(clip.position);
      mesh.renderOrder = index;
    }
  }
  renderView() {
    if (this.disposed || this.frameBlocked) return;
    const preview = this.domPresented ? this.selectedPreview() : undefined;
    for (const candidate of this.previews.values()) candidate.element.style.display = candidate === preview ? "block" : "none";
    if (preview) {
      preview.element.style.opacity="1";
      const width=this.previewViewport?.width ?? this.canvas.clientWidth;
      const height=this.previewViewport?.height ?? this.canvas.clientHeight;
      preview.layout(width,height,this.inspection);
      return;
    }
    const target = this.renderer.getRenderTarget();
    const color = this.renderer.getClearColor(new THREE.Color());
    const alpha = this.renderer.getClearAlpha();
    this.renderer.setRenderTarget(this.shared?.target ?? null);
    this.renderer.setClearColor(this.document.background);
    try {
      this.renderCurrentView();
    } finally {
      this.renderer.setRenderTarget(target);
      this.renderer.setClearColor(color, alpha);
    }
  }
  private renderCurrentView() {
    const document = this.document;
    const v =
      this.mode === "source"
        ? this.inspection
        : {
            ...this.inspection,
            zoom: this.inspection.zoom * (document.camera?.zoom ?? 1),
            panX: this.inspection.panX + (document.camera?.panX ?? 0),
            panY: this.inspection.panY + (document.camera?.panY ?? 0),
            orbitZ:
              this.inspection.orbitZ +
              ((document.camera?.roll ?? 0) * Math.PI) / 180,
          };
    if (this.mode === "source") {
      this.releaseDepthOfField();
      this.resources.reserveRenderTargets(this.outputMemory());
      const source =
        document.sources.find((s) => s.id === this.sourceId) ||
        document.sources[0];
      const aspect = document.size.width / document.size.height;
      this.flatCamera.left = -aspect;
      this.flatCamera.right = aspect;
      this.flatCamera.zoom = v.zoom;
      this.flatCamera.position.set(
        (-v.panX * 2 * aspect) / v.zoom,
        (v.panY * 2) / v.zoom,
        2,
      );
      this.flatCamera.updateProjectionMatrix();
      this.flatPlane.visible = Boolean(source);
      if (source) {
        const ratio = source.width / source.height;
        const height = Math.min(2, (2 * aspect) / ratio);
        this.flatPlane.scale.set(height * ratio, height, 1);
        this.flatPlane.material.map = this.textures[source.id];
        this.flatPlane.material.needsUpdate = true;
      }
      this.renderer.render(this.flatWorld, this.flatCamera);
    } else if (document.camera?.projection === "orthographic") {
      const sourceId = document.camera.sourceId;
      const frame = sourceId
        ? this.cameraFrames.get(sourceId)
        : this.cameraFrames.get(document.sources[0]?.id) || this.referenceFrame;
      if (!frame)
        throw new Error(
          `Register a camera frame for source ${sourceId} before using isometric projection`,
        );
      const camera = applyIsometricCamera(
        this.isometricCamera,
        this.camera,
        document.camera,
        frame,
        v,
      );
      this.renderCamera(camera);
    } else {
      const camera = this.camera.clone();
      // Explicit saved angles use the same source-relative pose in both projections.
      if (
        document.camera &&
        (document.camera.rotation !== undefined ||
          document.camera.elevation !== undefined)
      ) {
        const frame =
          this.cameraFrames.get(
            document.camera.sourceId || document.sources[0]?.id,
          ) || this.referenceFrame;
        const pose = applyIsometricCamera(
          this.isometricCamera,
          this.camera,
          document.camera,
          frame,
          defaultInspection(),
        );
        camera.position.copy(pose.position);
        camera.quaternion.copy(pose.quaternion);
      }
      const authoredDistance = Math.max(0.1, camera.position.length());
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
        camera.quaternion,
      );
      const frame =
        this.cameraFrames.get(
          document.camera?.sourceId || document.sources[0]?.id,
        ) || this.referenceFrame;
      const target =
        v.alignment === "front"
          ? alignInspectionFront(camera, frame)
          : camera.position.clone().addScaledVector(forward, authoredDistance);
      const distance = Math.max(0.1, camera.position.distanceTo(target));
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(
        camera.quaternion,
      );
      const rotation = new THREE.Quaternion()
        .setFromAxisAngle(up, v.orbitX)
        .multiply(new THREE.Quaternion().setFromAxisAngle(right, v.orbitY));
      const offset = camera.position
        .clone()
        .sub(target)
        .applyQuaternion(rotation)
        .divideScalar(v.zoom);
      camera.quaternion.premultiply(rotation);
      // Roll around the resulting view axis, without changing the orbit pivot.
      camera.rotateZ(v.orbitZ ?? 0);
      camera.position.copy(target).add(offset);
      const height =
        ((2 * distance) / v.zoom) *
        Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      camera.position.addScaledVector(
        new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion),
        -v.panX * height * camera.aspect,
      );
      camera.position.addScaledVector(
        new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion),
        v.panY * height,
      );
      this.renderCamera(camera);
    }
  }
  private renderCamera(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  ) {
    if (this.reviewCamera?.type === camera.type) this.reviewCamera.copy(camera as any);
    else this.reviewCamera = camera.clone();
    const settings = this.document.camera?.depthOfField;
    if (!settings?.enabled) {
      this.releaseDepthOfField();
      this.resources.reserveRenderTargets(this.outputMemory());
      this.renderer.render(this.world, camera);
      return;
    }
    if (settings.blur === 0) {
      // Zero is still the exact direct-render path. Keep a warmed cache while
      // enabled so crossing zero during a drag does not rebuild every pyramid.
      this.resources.reserveRenderTargets(
        this.outputMemory() + this.effectMemory(),
      );
      this.renderer.render(this.world, camera);
      return;
    }
    const frame =
      this.cameraFrames.get(
        this.document.camera?.sourceId || this.document.sources[0]?.id,
      ) || this.referenceFrame;
    frame.getWorldPosition(this.focusPoint);
    const distance = focusDistance(
      camera,
      this.focusPoint,
      settings.focusPlane,
    );
    this.surfaceDepthOfField ??= new SurfaceDepthOfField(this.renderer);
    if (this.surfaceDepthOfField.supports(this.world)) {
      this.depthOfField?.dispose();
      this.depthOfField = undefined;
      const memory = this.surfaceDepthOfField.estimateMemory();
      this.resources.reserveRenderTargets(
        this.outputMemory() + memory.nextResidentBytes,
        this.outputMemory() + memory.peakBytes,
      );
      this.surfaceDepthOfField.render(
        this.world,
        camera,
        distance,
        settings.blur,
      );
      return;
    }
    this.surfaceDepthOfField?.dispose();
    this.surfaceDepthOfField = undefined;
    this.depthOfField ??= new DepthOfField(this.renderer);
    const memory = this.depthOfField.estimateMemory();
    this.resources.reserveRenderTargets(
      this.outputMemory() + memory.nextResidentBytes,
      this.outputMemory() + memory.peakBytes,
    );
    this.depthOfField.render(this.world, camera, distance, settings.blur);
  }
  private releaseDepthOfField() {
    this.depthOfField?.dispose();
    this.depthOfField = undefined;
    this.surfaceDepthOfField?.dispose();
    this.surfaceDepthOfField = undefined;
  }
  describeLayers() {
    return this.presentedLayers;
  }
  /** Sampled output geometry, independent of editor/viewer inspection metadata. */
  reviewContext() {
    const camera = this.reviewCamera;
    if (!camera) throw new Error("No camera frame has been presented");
    camera.updateMatrixWorld(true);
    const w = this.canvas.width, h = this.canvas.height;
    const projected = this.layeredSources.flatMap(source => source.ids.map(id => {
      const node = source.get(id), mesh = node.mesh;
      mesh.updateWorldMatrix(true, false);
      mesh.geometry.computeBoundingBox();
      const box = mesh.geometry.boundingBox!;
      const points = [];
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) {
        points.push(new THREE.Vector3(x, y, 0).applyMatrix4(mesh.matrixWorld).project(camera));
      }
      const xs = points.map(p => (p.x + 1) * w / 2), ys = points.map(p => (1 - p.y) * h / 2);
      const rect = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
      const inFront = points.every(p => p.z >= -1 && p.z <= 1);
      let shown = mesh.material.opacity > 0;
      for (let parent: THREE.Object3D | null = mesh; parent; parent = parent.parent) shown &&= parent.visible;
      return { id: `${source.source.id}/${id}`, visible: shown && inFront,
        bounds: shown && inFront ? rect : null,
        clipped: shown && (!inFront || rect.x < 0 || rect.y < 0 || rect.x + rect.width > w || rect.y + rect.height > h) };
    }));
    const frame = this.cameraFrames.get(this.document.camera?.sourceId || this.document.sources[0]?.id) || this.referenceFrame;
    const focus = frame.getWorldPosition(new THREE.Vector3());
    return { camera: { projection: camera.type, position: camera.position.toArray(),
      direction: camera.getWorldDirection(new THREE.Vector3()).toArray(),
      quaternion: camera.quaternion.toArray(), zoom: camera.zoom,
      fov: camera instanceof THREE.PerspectiveCamera ? camera.fov : undefined,
      focusDistance: focusDistance(camera, focus, this.document.camera?.depthOfField?.focusPlane ?? 0),
      depthOfField: this.document.camera?.depthOfField },
      projected, layers: this.describeLayers(), sourceQuality: this.quality,
      warnings: this.layerFrames.flatMap(f => f.warnings), metrics: this.metrics,
      outputSize: { width: w, height: h } };
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const preview of this.previews.values()) preview.dispose();
    this.previews.clear();
    this.budget.nodes.delete(this);
    this.preparedSource = undefined;
    for (const child of this.children.values()) {
      child.engine.dispose();
      child.target.dispose();
    }
    this.children.clear();
    this.instance?.dispose?.();
    this.releaseDepthOfField();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const sourceTextures = new Set(Object.values(this.textures));
    const textures = new Set<THREE.Texture>();
    this.world.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) geometries.add(mesh.geometry);
      if (mesh.material) {
        for (const m of Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]) {
          materials.add(m);
          for (const v of Object.values(m))
            if (
              v instanceof THREE.Texture &&
              !sourceTextures.has(v) &&
              !v.isRenderTargetTexture
            )
              textures.add(v);
        }
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    this.resources.dispose();
    this.staticFrame = undefined;
    if (!this.shared) this.renderer.dispose();
    this.flatPlane.geometry.dispose();
    this.flatPlane.material.dispose();
    if (!this.shared) this.renderer.forceContextLoss();
  }
}
