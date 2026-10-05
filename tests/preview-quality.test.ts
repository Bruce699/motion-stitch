import { test } from "node:test";
import assert from "node:assert/strict";
import { fitPreviewSize } from "../src/core/preview-size";
import { SurfaceResources } from "../src/renderer/surface-resources";
import { pngSurface } from "../src/core/frame-wire";
import { surfaceResidentBytes } from "../src/core/render-metrics";

test("compact previews fit either orientation without changing authored dimensions", () => {
  const landscape = { width: 3840, height: 2160 };
  assert.deepEqual(fitPreviewSize(landscape), landscape);
  assert.deepEqual(fitPreviewSize(landscape, { width: 480, height: 300 }), {
    width: 480,
    height: 270,
  });
  assert.deepEqual(
    fitPreviewSize({ width: 2160, height: 3840 }, { width: 480, height: 300 }),
    { width: 169, height: 300 },
  );
  assert.deepEqual(
    fitPreviewSize({ width: 64, height: 64 }, { width: 480, height: 300 }),
    { width: 64, height: 64 },
  );
  assert.deepEqual(landscape, { width: 3840, height: 2160 });
});

test("preview surface bounds reduce allocations while retaining capture metadata and versions", async () => {
  // Only metadata is decoded here; the injected decoder records its requested size.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==",
    "base64",
  );
  png.writeUInt32BE(4096, 16);
  png.writeUInt32BE(2048, 20);
  const surface = pngSurface(png);
  let decodes = 0;
  const owner = new SurfaceResources(
    ["ui"],
    2048,
    8,
    async (encoded, size) => {
      decodes++;
      assert.equal(encoded.width, 4096);
      assert.deepEqual(size, { width: 768, height: 384 });
      return size as HTMLImageElement;
    },
    { width: 768, height: 768 },
  );
  const frame = {
    images: {},
    surfaces: { ui: surface },
    imageVersions: { ui: "original-version" },
  };
  await owner.accept(frame);
  assert.equal(
    owner.memory.residentSurfaceBytes,
    surfaceResidentBytes(768, 384),
  );
  assert.deepEqual(owner.knownImages(), { ui: "original-version" });
  assert.equal(surface.width, 4096);
  await owner.accept({ images: {}, imageVersions: frame.imageVersions });
  assert.equal(decodes, 1);
  owner.dispose();
  assert.equal(owner.memory.residentManagedBytes, 0);
});
