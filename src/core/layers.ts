import type { SourceQuality } from "./quality";
import type { SourceStatus } from "./source-status";
/** All bounds use CSS pixels in the source viewport, independent of capture density. */
export type Bounds = { x: number; y: number; width: number; height: number };
export type LayerLayout = {
  id: string;
  parentId: string | null;
  bounds: Bounds;
  crop: Bounds;
  visible: boolean;
  texture: string;
};
export type LayerFrame = {
  sourceId: string;
  width: number;
  height: number;
  baseTexture: string;
  regions: LayerLayout[];
  warnings: string[];
};
export type CapturedFrame = {
  images: Record<string, string>;
  /** Binary encoded surfaces. Legacy data URLs remain accepted by scene clients. */
  surfaces?: Record<string, EncodedSurface>;
  /** Opaque identities for these captured pixels, scoped to each texture key. */
  imageVersions?: Record<string, string>;
  quality?: SourceQuality[];
  layers?: LayerFrame[];
  routes?: { id: string; route: string }[];
  sample?: { time: number; revision?: string };
  sourceStatus?: SourceStatus[];
  /** Conservative backing-surface + retained PNG estimate; excludes app JS/driver memory. */
  sourceMemoryBytes?: number;
};
export type EncodedSurface = {
  mimeType: "image/png";
  bytes: Uint8Array;
  width: number;
  height: number;
};
export const layerTextureKey = (sourceId: string, layerId: string) =>
  `${sourceId}/${layerId}`;

export function placement(
  bounds: Bounds,
  parent: Bounds,
  pixelsToUnits: number,
) {
  return {
    x:
      (bounds.x + bounds.width / 2 - parent.x - parent.width / 2) *
      pixelsToUnits,
    y:
      -(bounds.y + bounds.height / 2 - parent.y - parent.height / 2) *
      pixelsToUnits,
  };
}
