import test from "node:test";
import assert from "node:assert/strict";
import {
  compositionTags,
  workspacePage,
} from "../src/renderer/workspace-navigation";

test("opening a project lands in Playground, with explicit editor and Library routes", () => {
  assert.equal(workspacePage(""), "playground");
  assert.equal(workspacePage("#home"), "home");
  assert.equal(workspacePage("#library"), "library");
  assert.equal(workspacePage("#editor"), "editor");
});

test("smart collections recognize composition families and preserve explicit tags", () => {
  assert.deepEqual(compositionTags("Order 1401 — Becoming"), ["Order 14-01"]);
  assert.deepEqual(
    compositionTags("Order 14-01 — In depth", ["Product", "Order 14-01"]),
    ["Product", "Order 14-01"],
  );
  assert.deepEqual(compositionTags("demo video"), ["Demo videos"]);
  assert.deepEqual(compositionTags("Untitled"), []);
});
