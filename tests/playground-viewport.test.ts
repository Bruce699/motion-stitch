import test from "node:test";
import assert from "node:assert/strict";
import {
  clampPlaygroundZoom,
  fitPlaygroundViewport,
  playgroundPinchZoom,
  playgroundWheelZoom,
  zoomPlaygroundViewport,
} from "../src/core/playground-viewport";

test("reset fits a long horizontal lineup on a phone below the normal zoom floor", () => {
  const bounds = { x: 40, y: 40, width: 1800, height: 32 };
  const viewport = { width: 390, height: 180 };
  const fitted = fitPlaygroundViewport(bounds, viewport);
  assert.ok(fitted.zoom < 0.25);
  assert.ok(bounds.x * fitted.zoom - fitted.scrollLeft >= 0);
  assert.ok(
    (bounds.x + bounds.width) * fitted.zoom - fitted.scrollLeft <=
      viewport.width - 24,
  );
  assert.ok(
    (bounds.y + bounds.height) * fitted.zoom - fitted.scrollTop <=
      viewport.height - 64,
  );
  const next = zoomPlaygroundViewport(
    fitted,
    fitted.zoom * 1.25,
    { x: 195, y: 90 },
    { width: 1880, height: 360 },
    viewport,
    undefined,
    fitted.zoom,
  );
  assert.equal(next.zoom, fitted.zoom * 1.25);
  assert.equal(
    playgroundWheelZoom(
      fitted.zoom,
      { ctrlKey: true, deltaY: 100, deltaMode: 0 },
      180,
      fitted.zoom,
    ),
    fitted.zoom,
  );
});

test("reset fits stacked versions above the controls and does not enlarge a small layout", () => {
  const bounds = { x: 40, y: 40, width: 400, height: 600 };
  const viewport = { width: 900, height: 180 };
  const fitted = fitPlaygroundViewport(bounds, viewport);
  assert.ok(
    (bounds.y + bounds.height) * fitted.zoom - fitted.scrollTop <=
      viewport.height - 64,
  );
  assert.equal(
    fitPlaygroundViewport({ x: 40, y: 40, width: 180, height: 32 }, viewport)
      .zoom,
    1,
  );
  assert.deepEqual(fitPlaygroundViewport(null, viewport), {
    zoom: 1,
    scrollLeft: 0,
    scrollTop: 0,
  });
});

test("canvas zoom preserves the world point beneath the pointer", () => {
  const before = { zoom: 1, scrollLeft: 400, scrollTop: 300 };
  const anchor = { x: 170, y: 120 };
  const after = zoomPlaygroundViewport(
    before,
    1.5,
    anchor,
    { width: 2400, height: 1600 },
    { width: 800, height: 500 },
  );
  assert.equal((after.scrollLeft + anchor.x) / after.zoom, 570);
  assert.equal((after.scrollTop + anchor.y) / after.zoom, 420);
  assert.deepEqual(
    zoomPlaygroundViewport(
      after,
      1,
      anchor,
      { width: 2400, height: 1600 },
      { width: 800, height: 500 },
    ),
    before,
  );
});

test("zoom clamps to 25–200% and scroll limits when the canvas fits", () => {
  assert.equal(clampPlaygroundZoom(0.05), 0.25);
  assert.equal(clampPlaygroundZoom(12), 2);
  assert.equal(clampPlaygroundZoom(Number.NaN), 1);
  assert.deepEqual(
    zoomPlaygroundViewport(
      { zoom: 1, scrollLeft: 400, scrollTop: 300 },
      0.1,
      { x: 400, y: 250 },
      { width: 1800, height: 1200 },
      { width: 800, height: 500 },
    ),
    { zoom: 0.25, scrollLeft: 0, scrollTop: 0 },
  );
  const edge = zoomPlaygroundViewport(
    { zoom: 2, scrollLeft: 1000, scrollTop: 700 },
    1,
    { x: 0, y: 0 },
    { width: 1200, height: 800 },
    { width: 800, height: 500 },
  );
  assert.deepEqual(edge, { zoom: 1, scrollLeft: 400, scrollTop: 300 });
});

test("trackpad pinch respects direction and wheel delta units", () => {
  assert.ok(playgroundPinchZoom(1, -10) > 1);
  assert.ok(playgroundPinchZoom(1, 10) < 1);
  assert.equal(playgroundPinchZoom(1, 1, 1), playgroundPinchZoom(1, 16));
  assert.equal(playgroundPinchZoom(1, 1, 2, 400), playgroundPinchZoom(1, 400));
  assert.equal(
    playgroundWheelZoom(1, { ctrlKey: false, deltaY: 10, deltaMode: 0 }, 400),
    null,
  );
  assert.equal(
    playgroundWheelZoom(1, { ctrlKey: true, deltaY: -10, deltaMode: 0 }, 400),
    playgroundPinchZoom(1, -10),
  );
});

test("a moving two-finger midpoint pans without changing its canvas anchor", () => {
  const after = zoomPlaygroundViewport(
    { zoom: 1, scrollLeft: 300, scrollTop: 200 },
    1.5,
    { x: 240, y: 180 },
    { width: 2400, height: 1600 },
    { width: 800, height: 500 },
    { x: 200, y: 150 },
  );
  assert.equal((after.scrollLeft + 240) / after.zoom, 500);
  assert.equal((after.scrollTop + 180) / after.zoom, 350);
});
