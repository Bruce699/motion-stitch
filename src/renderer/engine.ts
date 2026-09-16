import * as THREE from "three";
import { clamp, lerp, ease, segment } from "../core/motion";
import { values, type SceneDocument } from "../core/schema";
import type { SceneFactory, SceneInstance } from "../core/runtime";

export class SceneEngine {
  renderer: THREE.WebGLRenderer;
  world = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  textures: Record<string, THREE.Texture> = {};
  private lastImages: Record<string, string> = {};
  private instance?: SceneInstance;
  private disposed = false;
  private serial: Promise<unknown> = Promise.resolve();
  constructor(
    public document: SceneDocument,
    private source: (time: number) => Promise<Record<string, string>>,
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
    for (const s of document.sources) {
      const t = new THREE.Texture();
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      this.textures[s.id] = t;
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
      surfaces: this.textures,
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
  ) {
    const task = this.serial.then(async () => {
      if (this.disposed) return;
      const images = await this.source(time);
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
      await this.instance!.sample({
        time,
        frame: Math.round(time * document.fps),
        parameters: values(document),
        document,
      });
      if (this.disposed || !present()) return;
      this.renderer.render(this.world, this.camera);
    });
    this.serial = task.catch(() => {});
    return task;
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
    this.renderer.forceContextLoss();
  }
}
