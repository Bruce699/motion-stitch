import { test } from "node:test";
import assert from "node:assert/strict";
import {
  flushControlEdits,
  queueControlEdit,
} from "../src/renderer/control-edits";

test("history waits for saves and gesture completion across controls", async () => {
  const events: string[] = [];
  let release!: () => void;
  const save = new Promise<void>((resolve) => {
    release = resolve;
  });
  void queueControlEdit(async () => {
    await save;
    events.push("first save");
  });
  void queueControlEdit(async () => {
    events.push("first gesture end");
  });
  void queueControlEdit(async () => {
    events.push("second control");
  });
  const history = flushControlEdits().then(() => events.push("undo"));
  assert.deepEqual(events, []);
  release();
  await history;
  assert.deepEqual(events, [
    "first save",
    "first gesture end",
    "second control",
    "undo",
  ]);
  await assert.rejects(
    queueControlEdit(async () => {
      throw new Error("conflict");
    }),
  );
  assert.equal(await queueControlEdit(async () => "recovered"), "recovered");
});
