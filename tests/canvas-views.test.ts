import test from "node:test";
import assert from "node:assert/strict";
import { SceneSchema } from "../src/core/schema";
import {
  canvasViewChoices,
  selectedCanvasView,
} from "../src/renderer/canvas-views";

const scene = () =>
  SceneSchema.parse({
    version: 1,
    id: "icons",
    name: "Icons",
    duration: 10,
    fps: 60,
    size: { width: 1920, height: 1080 },
    background: "#ffffff",
    sources: [],
    parameters: {},
    cameraName: "2D",
    cameras: [
      {
        id: "three-dimensional",
        name: "3D",
        settings: { projection: "perspective", preset: "front", side: "right" },
      },
    ],
  });

test("native camera choices select named previews without changing the output camera", () => {
  const document = scene();
  const before = structuredClone(document);
  const choices = canvasViewChoices(document);
  assert.deepEqual(choices, [
    {
      value: "camera:main",
      label: "2D",
      mode: "camera",
      cameraId: "main",
      shortcut: "1",
    },
    {
      value: "camera:three-dimensional",
      label: "3D",
      mode: "camera",
      cameraId: "three-dimensional",
      shortcut: "2",
    },
  ]);
  assert.equal(selectedCanvasView(choices, "camera", "main"), "camera:main");
  assert.equal(
    selectedCanvasView(choices, "camera", "three-dimensional"),
    "camera:three-dimensional",
  );
  assert.deepEqual(document, before);
});

test("browser compositions retain direct 2D source and Camera choices even with named cameras", () => {
  const document = scene();
  document.sources = [
    {
      id: "ui",
      kind: "web",
      entry: "source/index.html",
      width: 1920,
      height: 1080,
      sampling: "controlled",
      layers: [],
    },
  ];
  const choices = canvasViewChoices(document);
  assert.deepEqual(choices, [
    { value: "source", label: "2D", mode: "source", shortcut: "1" },
    { value: "camera", label: "Camera", mode: "camera", shortcut: "2" },
  ]);
  assert.equal(
    selectedCanvasView(choices, "source", "three-dimensional"),
    "source",
  );
  assert.equal(
    selectedCanvasView(choices, "camera", "three-dimensional"),
    "camera",
  );
});

test("native single-camera scenes never offer an empty source view", () => {
  const document = scene();
  document.cameras = [];
  const choices = canvasViewChoices(document);
  assert.deepEqual(choices, [
    { value: "camera", label: "Camera", mode: "camera", shortcut: "2" },
  ]);
  assert.equal(
    choices.find((choice) => choice.shortcut === "1"),
    undefined,
  );
  assert.equal(selectedCanvasView(choices, "source", "main"), "camera");
});

test("additional named cameras remain selectable without reusing shortcuts", () => {
  const document = scene();
  document.cameras!.push({
    ...document.cameras![0],
    id: "detail",
    name: "Detail",
  });
  const choices = canvasViewChoices(document);
  assert.equal(choices[2].shortcut, undefined);
  assert.equal(
    selectedCanvasView(choices, "camera", "detail"),
    "camera:detail",
  );
});
