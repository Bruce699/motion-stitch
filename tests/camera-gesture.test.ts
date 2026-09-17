import { test } from "node:test";
import assert from "node:assert/strict";
import { CameraGestureDraft } from "../src/renderer/camera-gesture";
import { SceneSchema } from "../src/core/schema";

const scene = () =>
  SceneSchema.parse({
    version: 1,
    background: "#ffffff",
    id: "test",
    name: "Test",
    entry: "scene.ts",
    duration: 8,
    fps: 60,
    size: { width: 640, height: 480 },
    sources: [],
    parameters: {},
    tracks: [],
    camera: {
      projection: "orthographic",
      depthOfField: { enabled: true, focusPlane: 1, blur: 0.2 },
    },
  });

test("lens previews preserve authored document, camera pose and unrelated lens values", () => {
  const draft = new CameraGestureDraft(),
    saved = scene();
  const before = JSON.stringify(saved);
  draft.change(saved.id, "focusPlane", -2.5);
  const preview = draft.apply(saved);
  assert.equal(preview.camera?.depthOfField?.focusPlane, -2.5);
  assert.equal(preview.camera?.depthOfField?.blur, 0.2);
  assert.equal(preview.camera?.projection, saved.camera?.projection);
  assert.equal(JSON.stringify(saved), before);
  assert.equal(preview.sources, saved.sources);
});

test("an earlier persistence completion cannot erase a newer gesture", () => {
  const draft = new CameraGestureDraft(),
    saved = scene();
  const old = draft.change(saved.id, "blur", 0.3);
  const latest = draft.change(saved.id, "blur", 0.8);
  draft.settle(old);
  assert.equal(draft.apply(saved).camera?.depthOfField?.blur, 0.8);
  draft.settle(latest);
  assert.equal(draft.apply(saved), saved);
});

test("independent lens commits merge into fresh file state without dropping the next field", () => {
  const draft = new CameraGestureDraft(),
    saved = scene();
  const blur = draft.change(saved.id, "blur", 0.7);
  const focus = draft.change(saved.id, "focusPlane", 3);
  const committed = scene();
  committed.camera!.depthOfField!.blur = 0.7;
  draft.settle(blur);
  assert.equal(draft.apply(committed).camera?.depthOfField?.blur, 0.7);
  assert.equal(draft.apply(committed).camera?.depthOfField?.focusPlane, 3);
  draft.settle(focus);
  assert.equal(draft.apply(committed), committed);
});

test("scene changes cannot apply another scene's preview and clearing restores file authority", () => {
  const draft = new CameraGestureDraft(),
    saved = scene();
  draft.change("different", "blur", 0.9);
  assert.equal(draft.has(saved.id), false);
  assert.equal(draft.apply(saved), saved);
  draft.change(saved.id, "focusPlane", -4);
  assert.equal(draft.has(saved.id), true);
  draft.clear();
  assert.equal(draft.has(saved.id), false);
  assert.equal(draft.apply(saved), saved);
});

test("page exit carries only the latest outstanding lens values, grouped by scene", () => {
  const draft = new CameraGestureDraft();
  const old = draft.change("one", "blur", 0.2);
  draft.change("one", "blur", 0.8);
  const focus = draft.change("one", "focusPlane", 2.75);
  draft.settle(old);
  assert.deepEqual(draft.exitPatches(), [
    {
      sceneId: "one",
      patch: { depthOfField: { blur: 0.8, focusPlane: 2.75 } },
    },
  ]);
  draft.settle(focus);
  assert.deepEqual(draft.exitPatches(), [
    { sceneId: "one", patch: { depthOfField: { blur: 0.8 } } },
  ]);
  draft.clear();
  assert.deepEqual(draft.exitPatches(), []);
});
