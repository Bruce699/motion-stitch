import test from "node:test";
import assert from "node:assert/strict";
import {
  compositionPreviewKey,
  type PreviewRevisionNode,
} from "../src/core/preview-revision";
import { PreviewProfileSchema } from "../src/core/preview-profile";

const graph = () =>
  new Map<string, PreviewRevisionNode>([
    ["edit", { revision: "edit-1", dependencies: ["child", "child"] }],
    ["child", { revision: "child-1", dependencies: ["leaf"] }],
    ["leaf", { revision: "leaf-1", dependencies: [] }],
    ["unrelated", { revision: "unrelated-1", dependencies: [] }],
  ]);

test("poster keys invalidate ancestors of edited children and preserve unrelated cards", () => {
  const nodes = graph();
  const parent = compositionPreviewKey("edit", nodes);
  const child = compositionPreviewKey("child", nodes);
  const unrelated = compositionPreviewKey("unrelated", nodes);
  nodes.set("leaf", { revision: "leaf-2", dependencies: [] });
  assert.notEqual(compositionPreviewKey("edit", nodes), parent);
  assert.notEqual(compositionPreviewKey("child", nodes), child);
  assert.equal(compositionPreviewKey("unrelated", nodes), unrelated);
  const current = compositionPreviewKey("edit", nodes);
  nodes.set("unrelated", { revision: "unrelated-2", dependencies: [] });
  assert.equal(compositionPreviewKey("edit", nodes), current);
});

test("poster keys are stable across graph order and repeated references", () => {
  const nodes = graph();
  const key = compositionPreviewKey("edit", nodes);
  const reordered = new Map([...nodes].reverse());
  reordered.set("edit", { revision: "edit-1", dependencies: ["child"] });
  assert.equal(compositionPreviewKey("edit", reordered), key);
  assert.deepEqual(JSON.parse(key), [
    ["child", "child-1"],
    ["edit", "edit-1"],
    ["leaf", "leaf-1"],
  ]);
});

test("broken dependency keys change when references are repaired without looping on cycles", () => {
  const nodes = graph();
  nodes.delete("leaf");
  const missing = compositionPreviewKey("edit", nodes);
  assert.ok(
    JSON.parse(missing).some(
      ([id, revision]: [string, string | null]) =>
        id === "leaf" && revision === null,
    ),
  );
  nodes.set("leaf", { revision: "leaf-1", dependencies: ["edit"] });
  assert.notEqual(compositionPreviewKey("edit", nodes), missing);
  assert.equal(JSON.parse(compositionPreviewKey("edit", nodes)).length, 3);
});

test("preview profile accepts isolated compact modes or the normal default", () => {
  assert.equal(PreviewProfileSchema.parse(undefined), undefined);
  assert.equal(PreviewProfileSchema.parse("thumbnail"), "thumbnail");
  assert.equal(PreviewProfileSchema.parse("playback"), "playback");
  assert.throws(() => PreviewProfileSchema.parse("export"));
  assert.throws(() => PreviewProfileSchema.parse({ density: 1 }));
});
