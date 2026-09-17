import { test } from "node:test";
import assert from "node:assert/strict";
import { SurfaceResources } from "../src/renderer/surface-resources";
import { pngSurface } from "../src/core/frame-wire";
import { surfaceResidentBytes } from "../src/core/render-metrics";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==",
  "base64",
);
const surface = pngSurface(png);
const frame = {
  images: {},
  surfaces: { ui: surface, "ui/nav": surface },
  imageVersions: { ui: "v1", "ui/nav": "v1" },
};
test("surface owner only acknowledges successful decoding and supports independent retry", async () => {
  let decodes = 0;
  const owner = new SurfaceResources(["ui", "ui/nav"], 8192, 8, async () => {
    if (++decodes === 2) throw new Error("decode failed");
    return { width: 1, height: 1 } as HTMLImageElement;
  });
  await assert.rejects(owner.accept(frame), /decode failed/);
  assert.deepEqual(owner.knownImages(), { ui: "v1" });
  const retry = await owner.accept(frame);
  assert.equal(retry.decodedImages, 1);
  assert.equal(retry.reusedImages, 1);
  assert.deepEqual(owner.knownImages(), frame.imageVersions);
  assert.equal(
    owner.memory.residentSurfaceBytes,
    surfaceResidentBytes(1, 1) * 2,
  );
  const delta = await owner.accept({
    images: {},
    imageVersions: frame.imageVersions,
  });
  assert.equal(delta.decodedImages, 0);
  await assert.rejects(
    owner.accept({ images: {}, imageVersions: { ui: "missing" } }),
    /omitted/,
  );
  owner.dispose();
  owner.dispose();
  assert.equal(owner.memory.residentSurfaceBytes, 0);
  assert.equal(owner.textures.ui.image, null);
  assert.deepEqual(owner.knownImages(), {});
});
test("memory and device limits fail before allocation without weakening image quality", async () => {
  let decodes = 0;
  const owner = new SurfaceResources(["ui"], 8192, 8, async () => {
    decodes++;
    return { width: 1, height: 1 } as HTMLImageElement;
  });
  owner.budgetBytes = 1;
  await assert.rejects(
    owner.accept({ images: {}, surfaces: { ui: surface } }),
    /surface budget/,
  );
  assert.equal(decodes, 0);
  assert.deepEqual(owner.knownImages(), {});
  assert.equal(owner.memory.residentSurfaceBytes, 0);
  owner.dispose();
});
test("disposing during decode does not publish or acknowledge a late image", async () => {
  let complete!: (image: HTMLImageElement) => void;
  const owner = new SurfaceResources(
    ["ui"],
    8192,
    8,
    () => new Promise((resolve) => (complete = resolve)),
  );
  const accepting = owner.accept({
    images: {},
    surfaces: { ui: surface },
    imageVersions: { ui: "v1" },
  });
  owner.dispose();
  complete({ width: 1, height: 1 } as HTMLImageElement);
  await assert.rejects(accepting, /disposed/);
  assert.deepEqual(owner.knownImages(), {});
  assert.equal(owner.memory.residentSurfaceBytes, 0);
});

test("one scene budget includes retained capture backing and compositor replacement peaks", async () => {
  const owner = new SurfaceResources(
    ["ui"],
    8192,
    8,
    async () => ({ width: 1, height: 1 }) as HTMLImageElement,
  );
  owner.budgetBytes = 200;
  owner.setSourceMemory(50);
  owner.reserveRenderTargets(50, 60);
  await owner.accept({
    images: {},
    surfaces: { ui: surface },
    imageVersions: { ui: "v1" },
  });
  assert.equal(
    owner.memory.residentManagedBytes,
    100 + surfaceResidentBytes(1, 1),
  );
  assert.throws(() => owner.reserveRenderTargets(70, 160), /budget exceeded/);
  assert.equal(
    owner.memory.renderTargetBytes,
    50,
    "failed reservation preserves the previous budget state",
  );
  assert.throws(() => owner.setSourceMemory(-1), /Invalid/);
  const cached = await owner.accept({
    images: {},
    imageVersions: { ui: "v1" },
  });
  assert.equal(cached.reusedImages, 1);
  assert.equal(cached.transferredBytes, 0);
  owner.dispose();
  assert.equal(owner.memory.residentManagedBytes, 0);
});
