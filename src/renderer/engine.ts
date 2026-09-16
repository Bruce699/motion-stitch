import * as THREE from "three";
import { applyIsometricCamera } from "./camera";
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

export class SceneEngine {
  renderer: THREE.WebGLRenderer;
  world = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  mode: "source" | "camera" = "camera";
  sourceId: string | null = null;
  sourceRoutes: { id: string; route: string }[] = [];
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
  private lastImages: Record<string, string> = {};
  private instance?: SceneInstance;
  private disposed = false;
  private serial: Promise<unknown> = Promise.resolve();
  constructor(
    public document: SceneDocument,
    private source: (time: number, revision?: string) => Promise<CapturedFrame>,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(document.size.width, document.size.height, false);
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
    for (const s of document.sources) {
      for (const key of [
        s.id,
        ...(s.layers?.length
          ? ["base", ...s.layers.map((l) => l.id)].map((id) =>
              layerTextureKey(s.id, id),
            )
          : []),
      ]) {
        const t = new THREE.Texture();
        t.colorSpace = THREE.SRGBColorSpace;
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.generateMipmaps = false;
        this.textures[key] = t;
      }
    }
  }
  get canvas() {
    return this.renderer.domElement;
  }
  async init(url: string) {
    const module = await import(/* @vite-ignore */ url);
    if (typeof module.default !== "function")
      throw new Error("scene.ts must default-export a scene factory");
    this.instance = await (module.default as SceneFactory)({
      THREE,
      world: this.world,
      camera: this.camera,
      registerCameraFrame: (id, object) => {
        if (!this.document.sources.some((source) => source.id === id))
          throw new Error(`Unknown camera source ${id}`);
        this.cameraFrames.set(id, object);
      },
      surfaces: this.textures,
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
    const task = this.serial.then(async () => {
      if (this.disposed) return;
      const { images, routes, layers } = await this.source(time, revision);
      for (const [id, data] of Object.entries(images)) {
        if (this.lastImages[id] === data) continue;
        const img = new Image();
        img.src = data;
        await img.decode();
        if (this.disposed) return;
        if (this.textures[id]) {
          this.textures[id].image = img;
          this.textures[id].needsUpdate = true;
          this.lastImages[id] = data;
        }
      }
      this.document = document;
      if (
        this.canvas.width !== document.size.width ||
        this.canvas.height !== document.size.height
      ) {
        this.renderer.setSize(document.size.width, document.size.height, false);
        this.camera.aspect = document.size.width / document.size.height;
        this.camera.updateProjectionMatrix();
      }
      this.renderer.setClearColor(document.background);
      for (const source of this.layeredSources) {
        const frame = layers?.find((f) => f.sourceId === source.source.id);
        if (!frame)
          throw new Error(
            `Source ${source.source.id} did not provide layer frames`,
          );
        source.update(frame);
      }
      await this.instance!.sample({
        time,
        frame: Math.round(time * document.fps),
        parameters: values(document),
        controls: parameterReader(document.parameters),
        document,
      });
      if (this.disposed || !present()) return;
      if (routes) this.sourceRoutes = routes;
      this.layerFrames = layers || [];
      this.renderView();
      this.presentedLayers = this.layeredSources.flatMap((s) => s.describe());
    });
    this.serial = task.catch(() => {});
    return task;
  }
  renderView() {
    if (this.disposed) return;
    const document = this.document;
    const v = this.inspection;
    if (this.mode === "source") {
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
      this.renderer.render(this.world, camera);
    } else {
      const camera = this.camera.clone();
      const distance = Math.max(0.1, camera.position.length());
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
        camera.quaternion,
      );
      const target = camera.position.clone().addScaledVector(forward, distance);
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
      this.renderer.render(this.world, camera);
    }
  }
  describeLayers() {
    return this.presentedLayers;
  }
  dispose() {
    this.disposed = true;
    this.instance?.dispose?.();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>(Object.values(this.textures));
    this.world.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) geometries.add(mesh.geometry);
      if (mesh.material) {
        for (const m of Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]) {
          materials.add(m);
          for (const v of Object.values(m))
            if (v instanceof THREE.Texture) textures.add(v);
        }
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    this.renderer.dispose();
    this.flatPlane.geometry.dispose();
    this.flatPlane.material.dispose();
    this.renderer.forceContextLoss();
  }
}
