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
  frame: number;
  parameters: ParameterValues;
  controls: ParameterReader;
  document: SceneDocument;
};
export type SceneContext = {
  THREE: typeof THREE;
  world: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** Register the UI plane for exact orthographic angles; layered sources register automatically. */
  registerCameraFrame: (sourceId: string, object: THREE.Object3D) => void;
  surfaces: Record<string, THREE.Texture>;
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
