import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  captureQuality,
  MAX_CAPTURE_EDGE,
  MAX_CAPTURE_PIXELS,
} from "../src/core/quality";
import { SceneSchema } from "../src/core/schema";
import { SceneStore } from "../src/main/store";

const source = { id: "ui", width: 1000, height: 640 };
test("auto density follows output and inspection while manual density is stable", () => {
  assert.equal(captureQuality({ width: 1440, height: 900 }, source).density, 3);
  const close = captureQuality(
    { width: 1440, height: 900 },
    source,
    undefined,
    2,
  );
  assert.equal(close.density, 6);
  assert.equal(
    captureQuality({ width: 3840, height: 2160 }, source).density,
    7,
  );
  assert.equal(
    captureQuality({ width: 3840, height: 2160 }, source, { density: 2 }, 12)
      .density,
    2,
  );
  assert.deepEqual(source, { id: "ui", width: 1000, height: 640 });
});
test("capture budgets are explicit across landscape, portrait and large sources", () => {
  for (const [width, height] of [
    [1000, 640],
    [640, 1000],
    [4096, 4096],
    [64, 64],
  ]) {
    const q = captureQuality(
      { width: 3840, height: 2160 },
      { id: "ui", width, height },
      { density: 8 },
    );
    assert.ok(q.width <= MAX_CAPTURE_EDGE && q.height <= MAX_CAPTURE_EDGE);
    assert.ok(q.width * q.height <= MAX_CAPTURE_PIXELS);
    assert.equal(q.width / width, q.height / height);
    assert.equal(q.limited, q.density < 8);
  }
});
test("canvas and density edits validate, persist, undo, redo and reopen", async () => {
  const seed = JSON.parse(
    await fs.readFile(
      new URL("../scenes/interface/scene.json", import.meta.url),
      "utf8",
    ),
  );
  for (const size of [
    { width: 3840, height: 2160 },
    { width: 2160, height: 3840 },
    { width: 4096, height: 2160 },
  ])
    assert.equal(SceneSchema.safeParse({ ...seed, size }).success, true);
  for (const size of [
    { width: 4096, height: 4096 },
    { width: 4098, height: 1080 },
    { width: 1921, height: 1080 },
  ])
    assert.equal(SceneSchema.safeParse({ ...seed, size }).success, false);
  for (const density of [0, 9, 1.5, "bogus"])
    assert.equal(
      SceneSchema.safeParse({ ...seed, capture: { density } }).success,
      false,
    );
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-quality-"));
  const dir = path.join(root, "scenes/interface");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "scene.json"), JSON.stringify(seed));
  const store = new SceneStore(root);
  let reopened: SceneStore | undefined;
  try {
    await store.open("interface");
    store.watcher?.close();
    await store.edit((doc) => {
      doc.size = { width: 3840, height: 2160 };
      doc.capture = { density: 4 };
    });
    await store.history("undo");
    assert.deepEqual(store.scene.size, seed.size);
    await store.history("redo");
    assert.equal(store.scene.capture?.density, 4);
    reopened = new SceneStore(root);
    await reopened.open("interface");
    reopened.watcher?.close();
    assert.deepEqual(reopened.scene.size, { width: 3840, height: 2160 });
    assert.equal(reopened.scene.capture?.density, 4);
  } finally {
    store.watcher?.close();
    reopened?.watcher?.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});
