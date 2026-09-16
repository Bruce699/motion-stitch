import type * as THREE from "three";
import type { SceneDocument } from "./schema";
export type FrameContext = {
  time: number;
  frame: number;
  parameters: Record<string, number>;
  document: SceneDocument;
};
export type SceneContext = {
  THREE: typeof THREE;
  world: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  surfaces: Record<string, THREE.Texture>;
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
