import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseCLI } from "../src/core/cli";
import { parseAgentCommand } from "../src/core/commands";
import { SceneStore } from "../src/main/store";
import { atomicWrite, hash } from "../src/main/files";

test("agent commands preserve typed controls and reject malformed targets, stale-write omissions and unknown options", () => {
  assert.deepEqual(
    parseCLI(["set", "offset", "[1,2]", "--view", "viewer-a"]).command,
    { type: "set_parameter", key: "offset", value: [1, 2], viewId: "viewer-a" },
  );
  assert.equal(
    parseCLI(["set", "label", "hello world"]).command?.value,
    "hello world",
  );
  assert.throws(() => parseCLI(["seek", "NaN"]));
  assert.throws(() => parseAgentCommand({ type: "set_setting", key: "name" }));
  assert.throws(
    () => parseCLI(["seek", "1", "--veiw", "one"]),
    /Unknown option/,
  );
  assert.throws(() => parseCLI(["context", "--view"]), /Missing value/);
  assert.throws(() =>
    parseAgentCommand({
      type: "write_file",
      path: "scene.ts",
      content: "change",
    }),
  );
  assert.throws(() =>
    parseAgentCommand({ type: "seek", time: 1, viewId: "../other" }),
  );
  assert.throws(
    () => parseAgentCommand({ type: "toString" }),
    /Unknown agent command/,
  );
  assert.throws(() => parseAgentCommand({ type: "seek", time: 1, typo: true }));
  assert.equal(
    parseAgentCommand({
      type: "write_file",
      path: "new.ts",
      content: "new",
      hash: null,
    }).hash,
    null,
  );
  assert.equal(
    parseCLI([
      "begin",
      "Edit",
      "abc",
      "--actor",
      "agent-a",
      "--paths",
      '["scene.ts"]',
    ]).command?.actorId,
    "agent-a",
  );
});
test("owned edits reject another agent's writes, apply and discard, with scoped and hash guarded files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-agents-"));
  const directory = path.join(root, "scenes/interface");
  const seed = JSON.parse(
    await fs.readFile(
      new URL("./fixtures/scene.json", import.meta.url),
      "utf8",
    ),
  );
  await atomicWrite(path.join(directory, "scene.json"), JSON.stringify(seed));
  await atomicWrite(path.join(directory, "scene.ts"), "original");
  const store = new SceneStore(root);
  try {
    await store.open("interface");
    store.watcher?.close();
    const originalRevision = store.revision;
    const edit = await store.begin(
      "Agent A",
      "agent-a",
      originalRevision,
      "agent",
      ["scene.ts"],
    );
    await assert.rejects(
      store.writeFile("scene.ts", "clobbered", hash("original"), "agent-b"),
      /owned by agent-a/,
    );
    await assert.rejects(store.apply(edit.id, "agent-b"), /belongs to agent-a/);
    await assert.rejects(
      store.cancel(edit.id, "agent-b"),
      /belongs to agent-a/,
    );
    await assert.rejects(
      store.writeFile("outside.ts", "outside", null, "agent-a"),
      /outside the declared/,
    );
    await store.writeFile("scene.ts", "edited", hash("original"), "agent-a");
    assert.equal(store.revision, originalRevision);
    await assert.rejects(
      store.writeFile("scene.ts", "stale", hash("original"), "agent-a"),
      /File changed/,
    );
    await store.apply(edit.id, "agent-a");
    assert.equal(store.journal.head.actor, "agent-a");
    await assert.rejects(
      store.edit(
        (scene) => {
          scene.name = "stale";
        },
        originalRevision,
        "agent-b",
      ),
      /changed on disk/,
    );
    await assert.rejects(
      store.history("undo", originalRevision),
      /Revision conflict/,
    );
    await assert.rejects(
      store.writeFile("scene.ts", "overwrite", null, "agent-b"),
      /already exists/,
    );
    assert.equal(
      await fs.readFile(path.join(directory, "scene.ts"), "utf8"),
      "edited",
    );
  } finally {
    store.watcher?.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});
