import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ViewRegistry } from "../src/main/views";
import { defaultInspection, ViewStateSchema } from "../src/core/context";

const input = {
  sceneId: "interface",
  name: "Browser",
  duration: 12,
  fps: 60,
  requestedTime: 4.2,
  presentedTime: 4.1,
  playing: false,
  mode: "camera",
  sourceId: null,
  selection: ["lift"],
  selectedTracks: [
    {
      id: "lift",
      label: "Lift card",
      kind: "animation",
      start: 3,
      end: 6,
      parameterKeys: ["depth"],
      targets: [],
    },
  ],
  timeline: { start: 3, end: 6, zoom: 4, expandedTrackIds: ["cards"] },
  ready: true,
  error: null,
  documentRevision: "new",
  displayedRevision: "old",
  viewport: { width: 100, height: 100 },
  focused: true,
  visible: true,
  inspection: defaultInspection(),
};
async function fixture(
  run: (views: ViewRegistry, root: string) => Promise<void>,
) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-context-"));
  const views = new ViewRegistry(root);
  try {
    await views.init();
    await run(views, root);
  } finally {
    await views.close();
    await fs.rm(root, { recursive: true, force: true });
  }
}
test("file and live context preserve distinct duration, visible range, intent and displayed frame", async () =>
  fixture(async (views, root) => {
    await views.update("one", input, true);
    const snapshot = JSON.parse(
      await fs.readFile(path.join(root, ".tilt/context.json"), "utf8"),
    );
    assert.equal(snapshot.cursor, views.cursor);
    assert.equal(snapshot.workspaceId, views.workspaceId);
    assert.equal(snapshot.active.duration, 12);
    assert.deepEqual(snapshot.active.timeline, input.timeline);
    assert.equal(snapshot.active.requestedTime, 4.2);
    assert.equal(snapshot.active.presentedTime, 4.1);
    assert.equal(snapshot.active.displayedRevision, "old");
    assert.equal(snapshot.active.selectedTracks[0].label, "Lift card");
    assert.throws(() =>
      ViewStateSchema.parse({
        ...input,
        timeline: { ...input.timeline, start: 7 },
      }),
    );
  }));
test("watch cursors ignore identical heartbeats, wake on edits, time out and survive runtime restarts", async () =>
  fixture(async (views, root) => {
    await views.update("one", input, true);
    const cursor = views.cursor;
    await views.update("one", input);
    assert.equal(views.cursor, cursor);
    assert.equal(
      ((await views.waitForChange(cursor, 5)) as any).changed,
      false,
    );
    const waiting = views.waitForChange(cursor, 500);
    await views.update("one", { ...input, requestedTime: 5 });
    const changed = (await waiting) as any;
    assert.equal(changed.changed, true);
    assert.equal(changed.active.requestedTime, 5);
    assert.equal(views.listenerCount("context"), 0);
    const sceneChange = views.waitForChange(views.cursor, 500);
    await views.observeScene({
      sceneId: "interface",
      name: "Scene",
      duration: 12,
      fps: 60,
      revision: "saved",
      codeRevision: 1,
      error: null,
      pendingEdit: {
        id: "edit",
        actor: "agent-a",
        label: "Change",
        base: "saved",
        kind: "agent",
        paths: ["scene.ts"],
        startedAt: new Date().toISOString(),
      },
    });
    assert.equal(
      ((await sceneChange) as any).scenes[0].pendingEdit.actor,
      "agent-a",
    );
    await views.close();
    const reopened = new ViewRegistry(root);
    try {
      await reopened.init();
      assert.equal(reopened.workspaceId, views.workspaceId);
      assert.notEqual(reopened.runtimeId, views.runtimeId);
      assert.equal(
        ((await reopened.waitForChange(cursor, 500)) as any).changed,
        true,
      );
    } finally {
      await reopened.close();
    }
  }));
test("scene targeting never controls a different scene or guesses between matching viewers", async () =>
  fixture(async (views) => {
    await views.update("one", input, true);
    await views.update("two", { ...input, sceneId: "other" }, true);
    assert.equal(views.target(undefined, "interface")?.viewId, "one");
    assert.throws(() => views.target("two", "interface"), /different scene/);
    assert.throws(() => views.target("missing"), /Unknown viewer/);
    await views.update("three", input);
    assert.throws(
      () => views.target(undefined, "interface"),
      /Multiple viewers/,
    );
    const pending = views.request("one", { type: "context" });
    const rejected = assert.rejects(pending, /disconnected/);
    await views.disconnect("one");
    await rejected;
    assert.equal(views.get("two")?.sceneId, "other");
  }));
