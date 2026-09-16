import * as THREE from "three";
import {
  placement,
  layerTextureKey,
  type LayerFrame,
  type LayerLayout,
} from "../core/layers";
import type { SourceSpec } from "../core/schema";
import type { LayerNode } from "../core/runtime";

/** Browser layout and authored transforms are separate, so resampling never overwrites animation. */
export class LayeredSource {
  group = new THREE.Group();
  base: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private nodes = new Map<string, LayerNode>();
  private anchors = new Map<string, THREE.Group>();
  private pixelsToUnits: number;
  constructor(
    public source: SourceSpec,
    textures: Record<string, THREE.Texture>,
    options: { width: number },
  ) {
    if (!Number.isFinite(options.width) || options.width <= 0)
      throw new Error("Layered source width must be positive");
    if (!source.layers?.length)
      throw new Error(`Source ${source.id} has no declared layers`);
    this.pixelsToUnits = options.width / source.width;
    this.group.name = source.id;
    const mesh = (key: string, order: number) => {
      const material = new THREE.MeshBasicMaterial({
        map: textures[key],
        transparent: true,
        side: THREE.DoubleSide,
        alphaTest: 0.001,
        toneMapped: false,
        polygonOffset: true,
        polygonOffsetFactor: -order,
        polygonOffsetUnits: -order,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
      mesh.renderOrder = order;
      mesh.visible = false;
      return mesh;
    };
    this.base = mesh(layerTextureKey(source.id, "base"), 0);
    this.base.scale.set(options.width, source.height * this.pixelsToUnits, 1);
    this.group.add(this.base);
    source.layers.forEach((spec, i) => {
      const anchor = new THREE.Group(),
        object = new THREE.Group();
      object.name = `${source.id}:${spec.id}`;
      const plane = mesh(layerTextureKey(source.id, spec.id), i + 1);
      object.add(plane);
      anchor.add(object);
      this.group.add(anchor);
      this.anchors.set(spec.id, anchor);
      this.nodes.set(spec.id, {
        id: spec.id,
        object,
        mesh: plane,
        layout: null,
      });
    });
  }
  get(id: string) {
    const node = this.nodes.get(id);
    if (!node) throw new Error(`Unknown layer ${this.source.id}:${id}`);
    return node;
  }
  get ids() {
    return [...this.nodes.keys()];
  }
  update(frame: LayerFrame) {
    if (frame.sourceId !== this.source.id)
      throw new Error("Layer source mismatch");
    this.base.visible = true;
    const byId = new Map(frame.regions.map((r) => [r.id, r]));
    const full = { x: 0, y: 0, width: frame.width, height: frame.height };
    for (const node of this.nodes.values()) {
      const layout = byId.get(node.id);
      if (!layout) throw new Error(`Missing layout for ${node.id}`);
      node.layout = layout;
      const anchor = this.anchors.get(node.id)!;
      const parent = layout.parentId ? this.get(layout.parentId) : null;
      const parentObject = parent?.object || this.group;
      if (anchor.parent !== parentObject) parentObject.add(anchor);
      const parentBounds = layout.parentId
        ? byId.get(layout.parentId)!.bounds
        : full;
      const origin = placement(layout.bounds, parentBounds, this.pixelsToUnits);
      anchor.position.set(origin.x, origin.y, 0);
      const crop = placement(layout.crop, layout.bounds, this.pixelsToUnits);
      node.mesh.position.set(crop.x, crop.y, 0);
      node.mesh.scale.set(
        layout.crop.width * this.pixelsToUnits,
        layout.crop.height * this.pixelsToUnits,
        1,
      );
      node.mesh.visible = layout.visible;
    }
  }
  describe() {
    return [...this.nodes.values()].map((n) => ({
      sourceId: this.source.id,
      id: n.id,
      parentId: n.layout?.parentId || null,
      visible: n.layout?.visible || false,
      bounds: n.layout?.bounds || null,
      position: n.object.position.toArray(),
      rotation: [n.object.rotation.x, n.object.rotation.y, n.object.rotation.z],
      scale: n.object.scale.toArray(),
    }));
  }
}
