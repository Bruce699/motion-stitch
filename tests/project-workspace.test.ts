import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  EMPTY_WORKSPACE_REVISION,
  ProjectWorkspaceConflictError,
  ProjectWorkspaceStore,
} from "../src/main/project-workspace";
import { WorkspaceUISchema } from "../src/core/workspace-display";
import type { PlaygroundDocument } from "../src/core/playground";

async function temporaryStore(t: {
  after: (fn: () => Promise<unknown>) => void;
}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-playground-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return new ProjectWorkspaceStore(root);
}

function document(): PlaygroundDocument {
  return {
    version: 1,
    tiles: [
      { sceneId: "intro", x: 40, y: 80, nextId: "demo" },
      { sceneId: "demo", x: 260, y: 80, nextId: null },
    ],
    canvasHeight: 360,
    ui: WorkspaceUISchema.parse({ rowGap: 36 }),
    compositions: { intro: { title: "Demo", version: 2 } },
    marks: [{ sceneId: "intro", time: 1.25 }],
    tags: { intro: ["order 14-01"], demo: ["Demo videos", "order 14-01"] },
  };
}

test("workspace read is non-mutating and arrangements round-trip through the project file", async (t) => {
  const store = await temporaryStore(t);
  const initial = await store.load();
  assert.equal(initial.revision, EMPTY_WORKSPACE_REVISION);
  assert.deepEqual(initial.workspace.tiles, []);
  assert.equal(initial.workspace.canvasHeight, 320);
  assert.deepEqual(await fs.readdir(store.root), []);

  const saved = await store.save(document(), initial.revision);
  assert.match(saved.revision, /^[a-f0-9]{64}$/);
  assert.deepEqual(await new ProjectWorkspaceStore(store.root).load(), saved);
  assert.deepEqual(
    JSON.parse(await fs.readFile(store.file, "utf8")),
    document(),
  );
  assert.deepEqual(await fs.readdir(store.root), ["playground.json"]);
});

test("workspace rejects a stale revision without overwriting external file edits", async (t) => {
  const store = await temporaryStore(t);
  const initial = await store.load();
  const saved = await store.save(document(), initial.revision);
  const external = { ...document(), canvasHeight: 420 };
  const externalBytes = JSON.stringify(external) + "\n";
  await fs.writeFile(store.file, externalBytes);

  await assert.rejects(
    store.save({ ...document(), canvasHeight: 440 }, saved.revision),
    ProjectWorkspaceConflictError,
  );
  assert.equal(await fs.readFile(store.file, "utf8"), externalBytes);
  const reloaded = await store.load();
  assert.equal(reloaded.workspace.canvasHeight, 420);
  assert.notEqual(reloaded.revision, saved.revision);
  await store.save({ ...external, canvasHeight: 460 }, reloaded.revision);
  assert.equal((await store.load()).workspace.canvasHeight, 460);
});

test("workspace revision detects formatting edits and removal of the saved file", async (t) => {
  const store = await temporaryStore(t);
  const saved = await store.save(document(), EMPTY_WORKSPACE_REVISION);
  await fs.writeFile(store.file, JSON.stringify(document()));
  await assert.rejects(
    store.save(document(), saved.revision),
    /revision conflict/,
  );
  const formatted = await store.load();
  await fs.rm(store.file);
  await assert.rejects(
    store.save(document(), formatted.revision),
    /revision conflict/,
  );
  assert.equal((await store.load()).revision, EMPTY_WORKSPACE_REVISION);
});

test("concurrent stores cannot both save against the same revision", async (t) => {
  const store = await temporaryStore(t);
  const other = new ProjectWorkspaceStore(store.root);
  const results = await Promise.allSettled([
    store.save(document(), EMPTY_WORKSPACE_REVISION),
    other.save({ ...document(), canvasHeight: 420 }, EMPTY_WORKSPACE_REVISION),
  ]);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
  const failed = results.find((result) => result.status === "rejected");
  assert.ok(failed?.status === "rejected");
  assert.ok(failed.reason instanceof ProjectWorkspaceConflictError);
  assert.deepEqual(await store.load(), await other.load());
});

test("invalid workspace graphs and values leave the last valid document intact", async (t) => {
  const store = await temporaryStore(t);
  const saved = await store.save(document(), EMPTY_WORKSPACE_REVISION);
  const bytes = await fs.readFile(store.file, "utf8");
  const invalid = [
    { ...document(), version: 2 },
    { ...document(), ui: { ...document().ui, rowGap: 1000 } },
    { ...document(), compositions: { intro: { version: 0 } } },
    {
      ...document(),
      tiles: [{ sceneId: "intro", x: Infinity, y: 80, nextId: null }],
    },
    {
      ...document(),
      tiles: [{ sceneId: "intro", x: 40, y: 80, nextId: "intro" }],
    },
    {
      ...document(),
      tiles: [{ sceneId: "intro", x: 40, y: 80, nextId: "missing" }],
    },
    {
      ...document(),
      tiles: [
        { sceneId: "intro", x: 40, y: 80, nextId: "demo" },
        { sceneId: "demo", x: 260, y: 80, nextId: "intro" },
      ],
    },
    {
      ...document(),
      tiles: [
        ...document().tiles,
        { sceneId: "third", x: 40, y: 200, nextId: "demo" },
      ],
    },
  ];
  for (const candidate of invalid) {
    await assert.rejects(
      store.save(candidate as PlaygroundDocument, saved.revision),
    );
    assert.equal(await fs.readFile(store.file, "utf8"), bytes);
  }
  assert.deepEqual(await fs.readdir(store.root), ["playground.json"]);
});

test("malformed external workspace remains intact and load reports the error", async (t) => {
  const store = await temporaryStore(t);
  await fs.writeFile(store.file, "{ invalid JSON");
  await assert.rejects(store.load(), SyntaxError);
  await assert.rejects(
    store.save(document(), EMPTY_WORKSPACE_REVISION),
    /revision conflict/,
  );
  assert.equal(await fs.readFile(store.file, "utf8"), "{ invalid JSON");
});
