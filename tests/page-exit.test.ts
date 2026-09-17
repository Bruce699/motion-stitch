import test from "node:test";
import assert from "node:assert/strict";
import {
  collectPageExitPatches,
  createPageExitPersistence,
} from "../src/renderer/page-exit";

const viewId = "d761ed70-00e4-4e95-9339-4c9cf1d829f4";
const patch = (blur: number) => ({
  sceneId: "fixture",
  patch: { depthOfField: { blur } },
});
test("page exit merges final lens fields and excludes invalid/unrelated commands", () => {
  assert.deepEqual(
    collectPageExitPatches([
      () => patch(0.25),
      () => [
        { sceneId: "fixture", patch: { depthOfField: { focusPlane: 3 } } },
        patch(0.75),
      ],
      () => patch(NaN),
      () => ({ ...patch(0.2), actorId: "other" }) as any,
      () => {
        throw new Error("Unmounted provider");
      },
    ]),
    [
      {
        sceneId: "fixture",
        patch: { depthOfField: { blur: 0.75, focusPlane: 3 } },
      },
    ],
  );
});
test("pagehide initiates one keepalive immediately and closes events after acknowledgement", async () => {
  const order: string[] = [];
  let resolve!: (response: { ok: boolean; status: number }) => void;
  let init!: RequestInit;
  const exit = createPageExitPersistence({
    viewId,
    send(value) {
      init = value;
      order.push("send");
      return new Promise((done) => {
        resolve = done;
      });
    },
    close() {
      order.push("close");
    },
  });
  const unregister = exit.register(() => patch(0.1));
  unregister();
  exit.register(() => patch(0.9));
  const pending = exit.finish();
  assert.deepEqual(order, ["send"]);
  assert.equal(exit.finish(), pending);
  assert.equal(init.keepalive, true);
  assert.deepEqual(JSON.parse(init.body as string), {
    type: "viewer_exit",
    viewId,
    patches: [patch(0.9)],
  });
  resolve({ ok: true, status: 200 });
  await pending;
  assert.deepEqual(order, ["send", "close"]);
});
test("ambiguous exit network errors never replay a final mutation", async () => {
  let sends = 0,
    closes = 0;
  const exit = createPageExitPersistence({
    viewId,
    async send() {
      sends++;
      throw new Error("Disconnected");
    },
    close() {
      closes++;
    },
  });
  await assert.rejects(exit.finish(), /Disconnected/);
  await assert.rejects(exit.finish(), /Disconnected/);
  assert.equal(sends, 1);
  assert.equal(closes, 1);
});
