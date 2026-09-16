import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { SceneStore } from "../src/main/store";
import { atomicWrite, hash } from "../src/main/files";
import { ViewRegistry } from "../src/main/views";
import { defaultInspection } from "../src/core/context";
const seed = JSON.parse(
  await fs.readFile(
    new URL("../scenes/interface/scene.json", import.meta.url),
    "utf8",
  ),
);
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-history-"));
  const dir = path.join(root, "scenes", "interface");
  await atomicWrite(path.join(dir, "scene.json"), JSON.stringify(seed));
  await atomicWrite(path.join(dir, "scene.ts"), "original");
  const store = new SceneStore(root);
  await store.open("interface");
  store.watcher?.close();
  return {
    root,
    dir,
    store,
    clean: () => fs.rm(root, { recursive: true, force: true }),
  };
}
test("file history includes code, JSON and binary assets and survives reopening", async () => {
  const { root, dir, store, clean } = await fixture();
  let reopened: SceneStore | undefined;
  try {
    const base = store.revision;
    const group = await store.begin("Build scene", "agent", base, "agent", [
      "scene.json",
      "scene.ts",
      "image.bin",
    ]);
    await atomicWrite(path.join(dir, "scene.ts"), "changed");
    await atomicWrite(path.join(dir, "image.bin"), Buffer.from([0, 255, 1, 4]));
    await atomicWrite(
      path.join(dir, "scene.json"),
      JSON.stringify({ ...seed, name: "Edited" }),
    );
    await store.sync();
    assert.equal(store.scene.name, seed.name);
    assert.equal(store.revision, base);
    await store.apply(group.id);
    assert.equal(store.scene.name, "Edited");
    assert.equal(store.journal.ledger.entries.length, 2);
    reopened = new SceneStore(root);
    await reopened.open("interface");
    reopened.watcher?.close();
    await reopened.history("undo");
    assert.equal(
      await fs.readFile(path.join(dir, "scene.ts"), "utf8"),
      "original",
    );
    await assert.rejects(fs.access(path.join(dir, "image.bin")));
    await reopened.history("redo");
    assert.deepEqual(
      await fs.readFile(path.join(dir, "image.bin")),
      Buffer.from([0, 255, 1, 4]),
    );
    assert.equal(reopened.scene.name, "Edited");
  } finally {
    reopened?.watcher?.close();
    await clean();
  }
});
test("gesture values preview live but persist as one undo step", async () => {
  const { store, clean } = await fixture();
  try {
    const group = await store.begin(
      "Tilt",
      "viewer",
      store.revision,
      "gesture",
      ["scene.json"],
    );
    await store.edit(
      (s) => {
        s.parameters.tilt.value = 0.1;
      },
      undefined,
      "viewer",
    );
    assert.equal(store.scene.parameters.tilt.value, 0.1);
    await store.edit(
      (s) => {
        s.parameters.tilt.value = 0.6;
      },
      undefined,
      "viewer",
    );
    assert.equal(store.journal.ledger.entries.length, 1);
    await store.apply(group.id);
    assert.equal(store.journal.ledger.entries.length, 2);
    await store.history("undo");
    assert.equal(store.scene.parameters.tilt.value, seed.parameters.tilt.value);
  } finally {
    await clean();
  }
});
test("offline changes and invalid JSON remain recoverable; stale undo does not erase files", async () => {
  const { root, dir, store, clean } = await fixture();
  let reopened: SceneStore | undefined;
  try {
    await atomicWrite(path.join(dir, "scene.ts"), "offline");
    reopened = new SceneStore(root);
    await reopened.open("interface");
    reopened.watcher?.close();
    assert.equal(reopened.journal.ledger.entries.length, 2);
    await atomicWrite(path.join(dir, "scene.json"), "{broken");
    await reopened.sync();
    assert.ok(reopened.error);
    assert.equal(reopened.scene.name, seed.name);
    await reopened.history("undo");
    assert.equal(reopened.error, null);
    await atomicWrite(path.join(dir, "scene.ts"), "unobserved");
    await assert.rejects(reopened.history("undo"), /External changes/);
    assert.equal(
      await fs.readFile(path.join(dir, "scene.ts"), "utf8"),
      "unobserved",
    );
  } finally {
    reopened?.watcher?.close();
    await clean();
  }
});
test("declared-path conflicts leave an edit open and do not overwrite another file", async () => {
  const { dir, store, clean } = await fixture();
  try {
    const group = await store.begin(
      "Scoped",
      "agent",
      store.revision,
      "agent",
      ["scene.ts"],
    );
    await atomicWrite(path.join(dir, "outside.txt"), "other editor");
    await assert.rejects(store.apply(group.id), /undeclared/);
    assert.equal(store.journal.group?.id, group.id);
    await assert.rejects(store.begin("other", "agent"), /already open/);
  } finally {
    await clean();
  }
});
test("interrupted multi-file undo completes from the write-ahead journal", async () => {
  const { root, dir, store, clean } = await fixture();
  let reopened: SceneStore | undefined;
  try {
    await atomicWrite(path.join(dir, "scene.ts"), "new");
    await store.edit((s) => {
      s.name = "New";
    });
    const journal = store.journal;
    const next = structuredClone(journal.ledger);
    next.cursor = 0;
    const pending = {
      expected: journal.head.files,
      target: next.entries[0].files,
      next,
    };
    await atomicWrite(
      path.join(journal.directory, "pending.json"),
      JSON.stringify(pending),
    );
    await atomicWrite(path.join(dir, "scene.ts"), "original");
    reopened = new SceneStore(root);
    await reopened.open("interface");
    reopened.watcher?.close();
    assert.equal(reopened.scene.name, seed.name);
    assert.equal(reopened.journal.ledger.cursor, 0);
    await assert.rejects(
      fs.access(path.join(journal.directory, "pending.json")),
    );
  } finally {
    reopened?.watcher?.close();
    await clean();
  }
});
test("viewer context isolates tabs, identifies last interaction and acknowledges exact target", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-views-"));
  const views = new ViewRegistry(root);
  try {
    await views.init();
    const input = {
      sceneId: "interface",
      name: "Browser",
      requestedTime: 1,
      presentedTime: 1,
      playing: false,
      mode: "camera",
      sourceId: null,
      selection: [],
      ready: true,
      error: null,
      documentRevision: "a",
      displayedRevision: "a",
      viewport: { width: 100, height: 100 },
      focused: true,
      visible: true,
      inspection: defaultInspection(),
    };
    await views.update("first", input, true);
    await views.update(
      "second",
      { ...input, requestedTime: 3, presentedTime: 3 },
      true,
    );
    await views.update("first", input, false);
    assert.equal(views.activeId, "second");
    assert.equal(views.get("first")?.presentedTime, 1);
    views.once("request", (id, request) => {
      assert.equal(id, "first");
      assert.throws(
        () => views.acknowledge("second", request.id, {}),
        /Unknown/,
      );
      views.acknowledge("first", request.id, { time: 1 });
    });
    assert.deepEqual(await views.request("first", { type: "context" }), {
      time: 1,
    });
    await views.disconnect("first");
    assert.throws(() => views.select("first"), /No connected/);
    const context = JSON.parse(
      await fs.readFile(path.join(root, ".tilt", "context.json"), "utf8"),
    );
    assert.equal(context.active.presentedTime, 3);
    assert.ok(!JSON.stringify(context).includes("token"));
  } finally {
    await views.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});
test("an agent edit survives restart while preview stays on its base snapshot", async () => {
  const { root, dir, store, clean } = await fixture();
  let reopened: SceneStore | undefined;
  try {
    const base = store.revision;
    const group = await store.begin("In progress", "agent", base);
    await atomicWrite(
      path.join(dir, "scene.json"),
      JSON.stringify({ ...seed, name: "Pending" }),
    );
    await atomicWrite(path.join(dir, "scene.ts"), "pending code");
    reopened = new SceneStore(root);
    await reopened.open("interface");
    reopened.watcher?.close();
    assert.equal(reopened.scene.name, seed.name);
    assert.equal(reopened.revision, base);
    assert.equal(reopened.journal.group?.id, group.id);
    await reopened.apply(group.id);
    assert.equal(reopened.scene.name, "Pending");
    await reopened.history("undo");
    assert.equal(
      await fs.readFile(path.join(dir, "scene.ts"), "utf8"),
      "original",
    );
  } finally {
    reopened?.watcher?.close();
    await clean();
  }
});
