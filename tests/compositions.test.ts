import test from "node:test";
import assert from "node:assert/strict";
import { SceneSchema } from "../src/core/schema";
import {
  CompositionClipSchema,
  cameraDocument,
  clipDocument,
  sourceTime,
  splitClip,
  trimClip,
  validateCompositionGraph,
} from "../src/core/compositions";

const scene = (id: string) =>
  SceneSchema.parse({
    version: 1,
    id,
    name: id,
    duration: 5,
    fps: 60,
    size: { width: 640, height: 360 },
    background: "#000000",
    sources: [],
    parameters: { depth: { label: "Depth", value: 1, min: 0, max: 10 } },
    exposedParameters: ["depth"],
  });
const clip = () =>
  CompositionClipSchema.parse({
    id: "dashboard-use",
    compositionId: "dashboard",
    label: "Dashboard",
    start: 0,
    end: 2,
    sourceIn: 1,
  });

test("split references preserve source continuity, speed, camera, and isolated overrides", () => {
  const original = {
    ...clip(),
    speed: 2,
    cameraId: "detail",
    overrides: { depth: 2 },
  };
  const [left, right] = splitClip(original, 0.5, "second");
  assert.equal(sourceTime(left, left.end), sourceTime(right, right.start));
  assert.equal(right.sourceIn, 2);
  assert.equal(right.cameraId, "detail");
  right.overrides.depth = 9;
  assert.equal(left.overrides.depth, 2);
  assert.equal(original.overrides.depth, 2);
  assert.throws(() => splitClip(original, 2, "bad"));
});
test("moving, trimming, and slipping do not stretch source animation", () => {
  const original = clip();
  assert.equal(trimClip(original, 1, 3).sourceIn, 1);
  assert.equal(trimClip(original, 0.5, 2).sourceIn, 1.5);
  const shortened = trimClip(original, 0, 1);
  assert.equal(shortened.speed, 1);
  assert.equal(sourceTime(shortened, 1), 2);
});
test("camera preview and clip overrides do not mutate the shared source or its output camera", () => {
  const source = scene("dashboard"),
    parent = scene("edit");
  source.cameras = [
    {
      id: "detail",
      name: "Detail",
      settings: {
        projection: "perspective",
        preset: "front",
        side: "right",
        zoom: 2,
      },
    },
  ];
  const use = { ...clip(), cameraId: "detail", overrides: { depth: 3 } };
  assert.equal(cameraDocument(source, "detail").camera.zoom, 2);
  assert.equal(source.defaultCameraId, undefined);
  assert.equal(clipDocument(source, use, parent).parameters.depth.value, 3);
  assert.equal(source.parameters.depth.value, 1);
  source.parameters.depth.value = 5;
  assert.equal(clipDocument(source, clip(), parent).parameters.depth.value, 5);
  assert.equal(clipDocument(source, use, parent).parameters.depth.value, 3);
});
test("controls can pass through another nesting level with validated values", () => {
  const source = scene("dashboard"),
    parent = scene("edit");
  parent.parameters.depth.value = 4;
  const use = { ...clip(), bindings: { depth: "depth" } };
  assert.equal(clipDocument(source, use, parent).parameters.depth.value, 4);
  assert.throws(
    () => clipDocument(source, { ...use, overrides: { missing: 1 } }, parent),
    /does not expose/,
  );
  assert.throws(() =>
    clipDocument(source, { ...clip(), overrides: { depth: 11 } }, parent),
  );
});
test("graph validation rejects cycles, missing dependencies, missing cameras, and invalid source ranges", () => {
  const a = scene("edit"),
    b = scene("dashboard");
  a.clips = [clip()];
  validateCompositionGraph(a.id, { edit: a, dashboard: b });
  assert.throws(
    () => validateCompositionGraph(a.id, { edit: a }),
    /Missing composition/,
  );
  a.clips[0].cameraId = "deleted";
  assert.throws(
    () => validateCompositionGraph(a.id, { edit: a, dashboard: b }),
    /Unknown camera/,
  );
  delete a.clips[0].cameraId;
  b.clips = [{ ...clip(), compositionId: "edit" }];
  assert.throws(
    () => validateCompositionGraph(a.id, { edit: a, dashboard: b }),
    /contain themselves/,
  );
  b.clips = [];
  a.clips[0].sourceIn = 4;
  assert.throws(
    () => validateCompositionGraph(a.id, { edit: a, dashboard: b }),
    /source range/,
  );
});
test("legacy scene files retain their camera and new documents reject ambiguous IDs", () => {
  const doc = scene("dashboard");
  assert.equal(doc.cameras, undefined);
  assert.equal(cameraDocument(doc).camera.projection, "perspective");
  assert.throws(() => SceneSchema.parse({ ...doc, defaultCameraId: "absent" }));
  assert.throws(() => SceneSchema.parse({ ...doc, clips: [clip()] }));
  assert.throws(() =>
    SceneSchema.parse({ ...scene("edit"), clips: [clip(), clip()] }),
  );
});
