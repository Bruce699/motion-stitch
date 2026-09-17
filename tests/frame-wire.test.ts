import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeFrame, encodeFrame, pngSurface } from "../src/core/frame-wire";
import { frameForReceiver } from "../src/core/frame-transfer";

// Real PNG fixture: metadata and encoded bytes must survive transport unchanged.
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==",
  "base64",
);
const frame = {
  images: { ui: "data:image/png;base64," + png.toString("base64") },
  imageVersions: { ui: "capture-1" },
  layers: [],
  quality: [],
  routes: [{ id: "ui", route: "/fixture" }],
  sample: { time: 1.5, revision: "r1" },
};
test("binary frame preserves exact PNG bytes, metadata and independent acknowledgements", () => {
  const encoded = encodeFrame(frame),
    decoded = decodeFrame(encoded);
  assert.deepEqual(Buffer.from(decoded.surfaces!.ui.bytes), png);
  assert.deepEqual(decoded.sample, frame.sample);
  assert.deepEqual(decoded.routes, frame.routes);
  assert.deepEqual(decoded.imageVersions, frame.imageVersions);
  assert.deepEqual(decoded.images, {});
  assert.deepEqual(frameForReceiver(decoded, { ui: "capture-1" }).surfaces, {});
  assert.equal(Object.keys(frameForReceiver(decoded, {}).surfaces!).length, 1);
  assert.deepEqual(
    Buffer.from(decodeFrame(encodeFrame(decoded)).surfaces!.ui.bytes),
    png,
  );
});
test("binary frame rejects truncation, ambiguous ranges, extra data and forged sizes", () => {
  const encoded = encodeFrame(frame);
  assert.throws(() => decodeFrame(encoded.subarray(1)));
  assert.throws(() => decodeFrame(encoded.subarray(0, 15)));
  assert.throws(() => decodeFrame(encoded.subarray(0, encoded.length - 1)));
  assert.throws(() => decodeFrame(new Uint8Array([...encoded, 0])));
  const changed = encoded.slice();
  const metadataLength = new DataView(changed.buffer).getUint32(8);
  new DataView(changed.buffer).setUint32(12 + metadataLength + 16, 9000);
  assert.throws(() => decodeFrame(changed), /dimensions/);
  assert.throws(() => pngSurface(new Uint8Array(40)), /PNG/);
  assert.throws(
    () =>
      encodeFrame({ ...frame, images: { ui: "https://unexpected/image.png" } }),
    /data URL/,
  );
});
test("empty deltas preserve metadata and opaque texture names cannot change object prototypes", () => {
  const empty = decodeFrame(
    encodeFrame(frameForReceiver(frame, frame.imageVersions)),
  );
  assert.equal(Object.keys(empty.surfaces!).length, 0);
  assert.deepEqual(empty.sample, frame.sample);
  const special = decodeFrame(
    encodeFrame({ images: {}, surfaces: { ["__proto__"]: pngSurface(png) } }),
  );
  assert.equal(Object.getPrototypeOf(special.surfaces), null);
  assert.equal(special.surfaces!["__proto__"].width, 1);
});
