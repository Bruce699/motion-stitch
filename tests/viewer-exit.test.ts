import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { SceneStore } from "../src/main/store";
import { SceneSchema } from "../src/core/schema";
import { ViewerExitCoordinator } from "../src/main/viewer-exit";

const viewId = "d761ed70-00e4-4e95-9339-4c9cf1d829f4";
const command = (blur = 0.8) => ({
  type: "viewer_exit",
  viewId,
  patches: [{ sceneId: "fixture", patch: { depthOfField: { blur } } }],
});
async function fixture(t: { after(fn: () => Promise<void>): void }) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-view-exit-"));
  const directory = path.join(root, "scenes/fixture");
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(
    path.join(directory, "scene.json"),
    JSON.stringify(
      SceneSchema.parse({
        version: 1,
        id: "fixture",
        name: "Fixture",
        duration: 1,
        size: { width: 64, height: 64 },
        background: "#000000",
        sources: [],
        parameters: {},
      }),
    ),
  );
  const store = new SceneStore(root);
  await store.open("fixture");
  store.watcher?.close();
  t.after(async () => {
    store.watcher?.close();
    await fs.rm(root, { recursive: true, force: true });
  });
  const exit = new ViewerExitCoordinator();
  const getStore = async () => store;
  const finishOpen = async (actor: string) => {
    await store.finishGesture(actor);
  };
  return { store, exit, getStore, finishOpen };
}
test("final lens patch closes an active gesture with one history checkpoint", async (t) => {
  const f = await fixture(t);
  const before = f.store.journal.ledger.entries.length;
  await f.store.begin("Blur", viewId, undefined, "gesture", ["scene.json"]);
  await f.exit.finish(command(), f.getStore, f.finishOpen);
  assert.equal(f.store.scene.camera?.depthOfField?.blur, 0.8);
  assert.equal(f.store.journal.group, undefined);
  assert.equal(f.store.journal.ledger.entries.length, before + 1);
  await f.store.history("undo");
  assert.equal(f.store.scene.camera, undefined);
});
test("disconnect cleanup before final request still persists the final value", async (t) => {
  const f = await fixture(t);
  const before = f.store.journal.ledger.entries.length;
  await f.store.begin("Blur", viewId, undefined, "gesture", ["scene.json"]);
  await f.store.finishGesture(viewId);
  await f.exit.finish(command(), f.getStore, f.finishOpen);
  assert.equal(f.store.scene.camera?.depthOfField?.blur, 0.8);
  assert.equal(f.store.journal.group, undefined);
  assert.equal(f.store.journal.ledger.entries.length, before + 1);
});
test("begin waiting for a store cannot open a gesture after final exit state", async (t) => {
  const f = await fixture(t);
  let release!: (store: SceneStore) => void;
  const loading = new Promise<SceneStore>((resolve) => {
    release = resolve;
  });
  const begin = (async () => {
    f.exit.assertOpen(viewId);
    const store = await loading;
    f.exit.assertOpen(viewId);
    await store.begin("Late blur", viewId, undefined, "gesture");
  })();
  const saved = f.exit.finish(command(), () => loading, f.finishOpen);
  assert.throws(() => f.exit.assertOpen(viewId), /closed/);
  release(f.store);
  await assert.rejects(begin, /closed/);
  await saved;
  assert.equal(f.store.journal.group, undefined);
  assert.equal(f.store.scene.camera?.depthOfField?.blur, 0.8);
});
test("already queued writes precede the final patch; duplicate exits cannot replay", async (t) => {
  const f = await fixture(t);
  await f.store.begin("Blur", viewId, undefined, "gesture");
  const older = f.store.edit(
    (doc) => {
      doc.background = "#111111";
    },
    undefined,
    viewId,
  );
  const first = f.exit.finish(command(0.8), f.getStore, f.finishOpen);
  const second = f.exit.finish(command(0.1), f.getStore, f.finishOpen);
  assert.equal(first, second);
  await Promise.all([older, first]);
  assert.equal(f.store.scene.background, "#111111");
  assert.equal(f.store.scene.camera?.depthOfField?.blur, 0.8);
  assert.equal(f.store.journal.group, undefined);
});
test("invalid payload cannot seal viewer and another actor's group stays protected", async (t) => {
  const f = await fixture(t);
  assert.throws(() =>
    f.exit.finish(
      { ...command(), actorId: "someone-else" },
      f.getStore,
      f.finishOpen,
    ),
  );
  assert.equal(f.exit.isClosed(viewId), false);
  assert.throws(() => f.exit.finish(command(2), f.getStore, f.finishOpen));
  assert.equal(f.exit.isClosed(viewId), false);
  const group = await f.store.begin(
    "Other agent",
    "other",
    f.store.revision,
    "agent",
  );
  const pending = f.exit.finish(command(), f.getStore, f.finishOpen);
  await assert.rejects(pending, /open edit/);
  assert.equal(f.store.journal.group?.id, group.id);
  assert.equal(f.store.scene.camera, undefined);
  assert.equal(f.exit.finish(command(), f.getStore, f.finishOpen), pending);
});
