import { test } from "node:test";
import assert from "node:assert/strict";
import { frameForReceiver } from "../src/core/frame-transfer";
import type { CapturedFrame } from "../src/core/layers";

const frame: CapturedFrame = {
  images: { ui: "whole PNG", "ui/nav": "nav PNG" },
  imageVersions: { ui: "capture-a", "ui/nav": "capture-a" },
  layers: [],
  routes: [{ id: "ui", route: "/current" }],
  quality: [],
};

test("frame transfer is receiver-specific and never mutates the cached full frame", () => {
  const known = { ui: "capture-a", "ui/nav": "capture-a" };
  assert.deepEqual(frameForReceiver(frame, known).images, {});
  assert.deepEqual(frameForReceiver(frame, {}).images, frame.images);
  assert.deepEqual(frameForReceiver(frame, known).images, {});
  assert.equal(frameForReceiver(frame), frame);
  assert.equal(Object.keys(frame.images).length, 2);
});

test("partial, stale and failed receiver acknowledgements resend needed images", () => {
  assert.deepEqual(frameForReceiver(frame, { ui: "capture-a" }).images, {
    "ui/nav": "nav PNG",
  });
  assert.deepEqual(
    frameForReceiver(frame, { ui: "older" }).images,
    frame.images,
  );
  const refreshed = {
    ...frame,
    imageVersions: { ui: "new-density", "ui/nav": "new-density" },
  };
  assert.deepEqual(
    frameForReceiver(refreshed, frame.imageVersions).images,
    frame.images,
  );
  const legacy = { ...frame, imageVersions: undefined };
  assert.deepEqual(
    frameForReceiver(legacy, frame.imageVersions).images,
    frame.images,
  );
});

test("cached pixel transfer still includes current metadata and ignores malformed acknowledgements", () => {
  const response = frameForReceiver(frame, frame.imageVersions);
  for (const key of ["layers", "routes", "quality", "imageVersions"] as const)
    assert.equal(response[key], frame[key]);
  for (const value of [null, 42, "capture-a", []])
    assert.equal(frameForReceiver(frame, value), frame);
  assert.deepEqual(
    frameForReceiver(frame, Object.create(frame.imageVersions!)).images,
    frame.images,
  );
});
