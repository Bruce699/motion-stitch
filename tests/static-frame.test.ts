import test from "node:test";
import assert from "node:assert/strict";
import { SceneSchema } from "../src/core/schema";
import { staticFrameKey } from "../src/core/static-frame";
import { LatestFrame } from "../src/core/motion";

const fixture = () =>
  SceneSchema.parse({
    version: 1,
    id: "static",
    name: "Static",
    entry: "scene.ts",
    duration: 8,
    fps: 60,
    size: { width: 1440, height: 900 },
    background: "#111111",
    sources: [
      {
        id: "ui",
        kind: "web",
        entry: "index.html",
        width: 1440,
        height: 1000,
        sampling: "static",
      },
    ],
    parameters: {},
    tracks: [],
  });
test("only explicitly static sources reuse a prepared frame; capture inputs invalidate it", () => {
  const doc = fixture(),
    key = staticFrameKey(doc, 1);
  assert.ok(key);
  assert.equal(
    staticFrameKey(
      {
        ...doc,
        camera: {
          projection: "orthographic",
          preset: "front",
          side: "right",
          depthOfField: { enabled: true, focusPlane: 1, blur: 0.5 },
        },
      },
      1,
    ),
    key,
  );
  assert.notEqual(staticFrameKey(doc, 2), key);
  assert.equal(
    staticFrameKey(doc, 4),
    staticFrameKey(doc, 8),
    "GPU capture limit avoids redundant requests",
  );
  assert.notEqual(staticFrameKey({ ...doc, capture: { density: 1 } }, 1), key);
  assert.notEqual(
    staticFrameKey({ ...doc, size: { width: 1920, height: 1080 } }, 1),
    key,
  );
  assert.notEqual(
    staticFrameKey(
      { ...doc, sources: [{ ...doc.sources[0], entry: "changed.html" }] },
      1,
    ),
    key,
  );
  assert.equal(
    staticFrameKey(
      { ...doc, sources: [{ ...doc.sources[0], sampling: "controlled" }] },
      1,
    ),
    null,
  );
  assert.equal(
    staticFrameKey(
      {
        ...doc,
        sources: [
          ...doc.sources,
          { ...doc.sources[0], id: "animated", sampling: "controlled" },
        ],
      },
      1,
    ),
    null,
  );
});

test("continuous seeks present completed work without a backlog; invalidation cancels it", async () => {
  const sampled: number[] = [],
    presented: number[] = [],
    complete: (() => void)[] = [];
  const queue = new LatestFrame<number>(
    async (n, valid) => {
      sampled.push(n);
      await new Promise<void>((resolve) => complete.push(resolve));
      if (valid()) presented.push(n);
    },
    (e) => {
      throw e;
    },
    true,
  );
  const settle = () => new Promise((resolve) => setImmediate(resolve));
  queue.request(1);
  queue.request(2);
  queue.request(3);
  complete.shift()!();
  await settle();
  assert.deepEqual(presented, [1]);
  assert.deepEqual(sampled, [1, 3]);
  queue.request(4);
  queue.request(5);
  complete.shift()!();
  await settle();
  assert.deepEqual(presented, [1, 3]);
  assert.deepEqual(sampled, [1, 3, 5]);
  queue.invalidate();
  queue.request(9);
  complete.shift()!();
  await settle();
  assert.deepEqual(presented, [1, 3]);
  complete.shift()!();
  await settle();
  assert.deepEqual(presented, [1, 3, 9]);
  assert.deepEqual(sampled, [1, 3, 5, 9]);
});
