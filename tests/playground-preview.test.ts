import test from "node:test";
import assert from "node:assert/strict";
import { playgroundPreviewNeighbors } from "../src/core/playground-preview";
import { createPlayground } from "../src/core/playground";

const scenes = [
  { id: "a", duration: 8 },
  { id: "b", duration: 6 },
  { id: "c", duration: 4 },
];
const document = createPlayground(scenes);
document.tiles[0].nextId = "b";
document.tiles[1].nextId = "c";

test("neighbor preloading prioritizes the next cut and then the preceding clip", () => {
  assert.deepEqual(playgroundPreviewNeighbors(document, scenes, "a", 3), [
    { sceneId: "b", time: 0 },
    { sceneId: "c", time: 4 - 1 / 60 },
  ]);
  assert.deepEqual(playgroundPreviewNeighbors(document, scenes, "a", 8), [
    { sceneId: "c", time: 0 },
    { sceneId: "a", time: 8 - 1 / 60 },
  ]);
  assert.deepEqual(playgroundPreviewNeighbors(document, scenes, "a", 15), [
    { sceneId: "a", time: 0 },
    { sceneId: "b", time: 6 - 1 / 60 },
  ]);
});

test("preloading skips empty clips and avoids duplicate work for a two-clip loop", () => {
  assert.deepEqual(
    playgroundPreviewNeighbors(
      document,
      [
        { id: "a", duration: 8 },
        { id: "b", duration: 0 },
        { id: "c", duration: 4 },
      ],
      "a",
      0,
    ),
    [{ sceneId: "c", time: 0 }],
  );
  assert.deepEqual(
    playgroundPreviewNeighbors(createPlayground(scenes), scenes, "a", 0),
    [],
  );
});
