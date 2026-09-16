import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as THREE from "three";
import { SceneSchema } from "../src/core/schema";
import { LayeredSource } from "../src/renderer/layered-source";
import type { LayerFrame } from "../src/core/layers";
const seed = JSON.parse(
  await fs.readFile(
    new URL("../scenes/interface/scene.json", import.meta.url),
    "utf8",
  ),
);
test("layer IDs are unique and base is reserved", () => {
  for (const layers of [
    [{ id: "base", selector: ".nav" }],
    [
      { id: "nav", selector: ".nav" },
      { id: "nav", selector: ".other" },
    ],
  ])
    assert.equal(
      SceneSchema.safeParse({
        ...seed,
        sources: [{ ...seed.sources[0], layers }],
      }).success,
      false,
    );
});
test("source layout aligns cropped layers and preserves authored transforms through nesting and resize", () => {
  const source = SceneSchema.parse({
    ...seed,
    sources: [
      {
        ...seed.sources[0],
        width: 1000,
        height: 600,
        layers: [
          { id: "nav", selector: ".nav" },
          { id: "item", selector: ".item" },
        ],
      },
    ],
  }).sources[0];
  const textures = Object.fromEntries(
    ["ui/base", "ui/nav", "ui/item"].map((id) => [id, new THREE.Texture()]),
  );
  const surface = new LayeredSource(source, textures, { width: 10 });
  const frame: LayerFrame = {
    sourceId: "ui",
    width: 1000,
    height: 600,
    baseTexture: "ui/base",
    warnings: [],
    regions: [
      {
        id: "nav",
        parentId: null,
        bounds: { x: 0, y: 0, width: 200, height: 600 },
        crop: { x: 0, y: 0, width: 210, height: 600 },
        visible: true,
        texture: "ui/nav",
      },
      {
        id: "item",
        parentId: "nav",
        bounds: { x: 20, y: 40, width: 150, height: 30 },
        crop: { x: 12, y: 32, width: 166, height: 46 },
        visible: true,
        texture: "ui/item",
      },
    ],
  };
  surface.update(frame);
  surface.get("nav").object.position.z = 2;
  surface.get("item").object.position.z = 0.3;
  surface.group.updateMatrixWorld(true);
  const p = surface.get("item").object.getWorldPosition(new THREE.Vector3());
  assert.ok(Math.abs(p.z - 2.3) < 1e-9);
  assert.ok(Math.abs(p.x - -4.05) < 1e-9);
  assert.ok(Math.abs(p.y - 2.45) < 1e-9);
  frame.regions[1].bounds.x = 30;
  surface.update(frame);
  assert.equal(surface.get("nav").object.position.z, 2);
  assert.equal(surface.get("item").object.position.z, 0.3);
  assert.equal(surface.get("nav").mesh.scale.x, 2.1);
  frame.regions[1].visible = false;
  surface.update(frame);
  assert.equal(surface.get("item").mesh.visible, false);
});
