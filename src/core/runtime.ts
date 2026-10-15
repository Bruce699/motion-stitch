import type * as THREE from "three";
import type { SceneDocument } from "./schema";
import type { LayerLayout } from "./layers";
import type { ParameterValues, ParameterReader } from "./parameters";
export type LayerNode = {
  id: string;
  object: THREE.Group;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  layout: LayerLayout | null;
};
export type LayeredSurface = {
  group: THREE.Group;
  base: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  readonly ids: string[];
  get: (id: string) => LayerNode;
};
export type FrameContext = {
  time: number;
  /** Selected view of this composition; all cameras follow source time. */
  cameraId?: string;
  frame: number;
  parameters: ParameterValues;
  controls: ParameterReader;
  document: SceneDocument;
  /** Raster budget for native CanvasTexture artwork. Layout stays in document.size;
   * compact previews may bound raster size/surfaces without changing export quality.
   * Optional for scene adapters that construct their own sample frames.
   */
  raster?: {
    width: number;
    height: number;
    maxSurfaceSize?: { width: number; height: number };
  };
};
export type SceneContext = {
  THREE: typeof THREE;
  world: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** Register the camera plane/pivot. Use null for native composition geometry; layered sources register automatically. */
  registerCameraFrame: (sourceId: string | null, object: THREE.Object3D) => void;
  surfaces: Record<string, THREE.Texture>;
  /** Rendered nested compositions, already positioned and timed by the runtime. */
  clips?: Record<string, THREE.Mesh>;
  createLayeredSource: (
    sourceId: string,
    options: { width: number },
  ) => LayeredSurface;
  document: SceneDocument;
  motion: {
    clamp: (v: number, min?: number, max?: number) => number;
    lerp: (a: number, b: number, t: number) => number;
    ease: (t: number) => number;
    segment: (t: number, start: number, end: number) => number;
  };
};
export type SceneInstance = {
  sample: (frame: FrameContext) => void | Promise<void>;
  dispose?: () => void;
};
export type SceneFactory = (
  context: SceneContext,
) => SceneInstance | Promise<SceneInstance>;
