import { test } from "node:test";
import assert from "node:assert/strict";
import { createPlayheadStore } from "../src/renderer/playhead-store";
test("playhead subscribers receive only changes and keep synchronous intent after backward seeks", () => {
  const store = createPlayheadStore(1),
    values: number[] = [];
  const off = store.subscribe(() => values.push(store.getSnapshot()));
  store.set(2);
  store.set(2);
  store.set(0);
  store.set(NaN);
  assert.deepEqual(values, [2, 0]);
  assert.equal(store.getSnapshot(), 0);
  off();
  store.set(3);
  assert.deepEqual(values, [2, 0]);
});
