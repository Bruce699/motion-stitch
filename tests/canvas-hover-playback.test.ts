import { test } from "node:test";
import assert from "node:assert/strict";
import { sampleCanvasHoverSequence } from "../src/renderer/canvas-hover-playback";

const clips = [
  { id: "a", duration: 2 },
  { id: "b", duration: 3 },
  { id: "c", duration: 1 },
];

test("hover playback uses one sequence clock and switches exactly at each cut", () => {
  assert.deepEqual(sampleCanvasHoverSequence(clips, 1.5), {
    index: 0,
    sceneId: "a",
    sourceTime: 1.5,
    duration: 6,
    nextIndex: 1,
  });
  assert.deepEqual(sampleCanvasHoverSequence(clips, 2), {
    index: 1,
    sceneId: "b",
    sourceTime: 0,
    duration: 6,
    nextIndex: 2,
  });
  assert.deepEqual(sampleCanvasHoverSequence(clips, 5), {
    index: 2,
    sceneId: "c",
    sourceTime: 0,
    duration: 6,
    nextIndex: -1,
  });
});

test("hover sequence loops together rather than giving cards independent clocks", () => {
  assert.equal(sampleCanvasHoverSequence(clips, 6)?.sceneId, "a");
  assert.equal(sampleCanvasHoverSequence(clips, 8.75)?.sceneId, "b");
  assert.equal(sampleCanvasHoverSequence(clips, 8.75)?.sourceTime, 0.75);
  assert.equal(sampleCanvasHoverSequence(clips, -1)?.sourceTime, 0);
});

test("empty clips are skipped for presentation and prewarming", () => {
  const sequence = [
    { id: "empty", duration: 0 },
    ...clips.slice(0, 1),
    { id: "end", duration: 0 },
  ];
  assert.equal(sampleCanvasHoverSequence(sequence, 0)?.sceneId, "a");
  assert.equal(sampleCanvasHoverSequence(sequence, 0)?.nextIndex, -1);
  assert.equal(sampleCanvasHoverSequence([], 0), undefined);
  assert.equal(
    sampleCanvasHoverSequence([{ id: "empty", duration: 0 }], 0),
    undefined,
  );
});
