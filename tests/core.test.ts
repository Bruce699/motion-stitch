import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { SceneSchema } from "../src/core/schema";
import { LatestFrame, SceneClock } from "../src/core/motion";
import { SceneStore } from "../src/main/store";
import { safePath, atomicWrite } from "../src/main/files";

const seed = JSON.parse(
  await fs.readFile(
    new URL("../scenes/interface/scene.json", import.meta.url),
    "utf8",
  ),
);
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-test-"));
  await fs.mkdir(path.join(root, "scenes", "interface"), { recursive: true });
  await atomicWrite(
    path.join(root, "scenes", "interface", "scene.json"),
    JSON.stringify(seed),
  );
  const store = new SceneStore(root);
  await store.open("interface");
  return {
    root,
    store,
    clean: async () => {
      store.watcher?.close();
      await fs.rm(root, { recursive: true, force: true });
    },
  };
}

test("document rejects path escape, invalid ranges, odd output size and impossible cues", () => {
  assert.equal(SceneSchema.parse(seed).version, 1);
  for (const patch of [
    { entry: "../outside.ts" },
    { parameters: { x: { label: "X", value: 4, min: 0, max: 1, step: 1 } } },
    { size: { width: 101, height: 100 } },
    {
      tracks: [
        { id: "x", label: "x", color: "#aaaaaa", start: 0, end: 99, keys: [] },
      ],
    },
  ])
    assert.equal(SceneSchema.safeParse({ ...seed, ...patch }).success, false);
});
test("play intent survives preparation but pause cancels it without a time jump", () => {
  const c = new SceneClock(8, 30);
  c.play();
  c.advance(20);
  assert.equal(c.time, 0);
  c.pause();
  c.ready = true;
  c.advance(1);
  assert.equal(c.time, 0);
  c.play();
  c.advance(0.03);
  assert.equal(c.time, 0.03);
  c.seek(8);
  c.play();
  assert.equal(c.time, 0);
  c.seek(5);
  c.seek(1);
  assert.equal(c.time, 1);
});
test("rapid seeks discard superseded work and only present the last pending frame", async () => {
  const sampled: number[] = [];
  const presented: number[] = [];
  const queue = new LatestFrame<number>(
    async (n, current) => {
      sampled.push(n);
      await pause(20);
      if (current()) presented.push(n);
    },
    (e) => {
      throw e;
    },
  );
  queue.request(1);
  queue.request(2);
  queue.request(3);
  await pause(70);
  assert.deepEqual(sampled, [1, 3]);
  assert.deepEqual(presented, [3]);
});
test("serialized edits preserve independent fields, persist, undo and redo", async () => {
  const { store, clean } = await fixture();
  try {
    await Promise.all([
      store.edit((s) => {
        s.parameters.tilt.value = 0.4;
      }),
      store.edit((s) => {
        s.parameters.lift.value = 0.5;
      }),
    ]);
    assert.equal(store.scene.parameters.tilt.value, 0.4);
    assert.equal(store.scene.parameters.lift.value, 0.5);
    await store.history("undo");
    assert.equal(store.scene.parameters.lift.value, seed.parameters.lift.value);
    await store.history("redo");
    assert.equal(store.scene.parameters.lift.value, 0.5);
    const disk = JSON.parse(
      await fs.readFile(path.join(store.directory, "scene.json"), "utf8"),
    );
    assert.equal(disk.parameters.tilt.value, 0.4);
  } finally {
    await clean();
  }
});
test("external document changes conflict with stale replacement and invalid JSON retains last good state", async () => {
  const { store, clean } = await fixture();
  try {
    const revision = store.revision;
    const updated = structuredClone(seed);
    updated.name = "External";
    await atomicWrite(
      path.join(store.directory, "scene.json"),
      JSON.stringify(updated),
    );
    await assert.rejects(
      store.edit((s) => {
        s.name = "stale";
      }, revision),
      /changed on disk/,
    );
    await pause(350);
    assert.equal(store.scene.name, "External");
    await atomicWrite(path.join(store.directory, "scene.json"), "{broken");
    await pause(350);
    assert.equal(store.scene.name, "External");
    assert.ok(store.error);
  } finally {
    await clean();
  }
});
test("file writes reject traversal, symlink escapes and stale hashes", async () => {
  const { store, root, clean } = await fixture();
  try {
    await assert.rejects(
      safePath(store.directory, "../outside", true),
      /inside/,
    );
    await fs.symlink(os.tmpdir(), path.join(store.directory, "escape"));
    await assert.rejects(
      safePath(store.directory, "escape/file.txt", true),
      /escapes/,
    );
    await fs.unlink(path.join(store.directory, "escape"));
    const first = await store.writeFile("source.txt", "one");
    await store.writeFile("source.txt", "two", first.hash);
    await assert.rejects(
      store.writeFile("source.txt", "three", first.hash),
      /changed/,
    );
    assert.equal(await store.readFile("source.txt"), "two");
  } finally {
    await clean();
  }
});

test("a batched source and document edit still invalidates source preparation", async () => {
  const { store, clean } = await fixture();
  try {
    const previous = store.codeRevision;
    await atomicWrite(
      path.join(store.directory, "scene.ts"),
      "export default () => ({sample(){}})",
    );
    await atomicWrite(
      path.join(store.directory, "scene.json"),
      JSON.stringify(seed),
    );
    await pause(350);
    assert.ok(store.codeRevision > previous);
  } finally {
    await clean();
  }
});
