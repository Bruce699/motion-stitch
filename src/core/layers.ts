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
  layers?: LayerFrame[];
  routes?: { id: string; route: string }[];
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
