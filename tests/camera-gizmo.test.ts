import test from "node:test";
import assert from "node:assert/strict";
import { defaultInspection } from "../src/core/context";
import { orbitDrag, orbitPoint } from "../src/renderer/camera-gizmo-geometry";
import { cameraNavigationPatch } from "../src/renderer/camera-navigation";

test("orbit gesture changes saved heading and elevation together, preserving lens and pan", () => {
  const initial = { ...defaultInspection(), zoom: 2, panX: 12, orbitY: -0.5 };
  const next = orbitDrag(initial, 25, 15);
  const patch = cameraNavigationPatch(next);
  assert.equal(patch.rotation, 17);
  assert.equal(patch.elevation, 51);
  assert.equal(patch.zoom, 2);
  assert.equal(patch.panX, 12);
  assert.deepEqual(orbitDrag(initial, 0, 0), {
    ...initial,
    alignment: undefined,
  });
});
test("elevation stops at the hemisphere boundaries and reverses from the original gesture", () => {
  const initial = { ...defaultInspection(), orbitY: -0.5 };
  assert.equal(orbitDrag(initial, 0, 1000).orbitY, -Math.PI / 2);
  assert.equal(orbitDrag(initial, 0, -1000).orbitY, 0);
  assert.equal(orbitDrag(initial, 0, 0).orbitY, -0.5);
  const snap = orbitDrag(initial, 25, 15, true);
  assert.ok(Math.abs(snap.orbitX / (Math.PI / 12) - 1) < 1e-10);
});
test("camera marker circles a fixed target with a continuous heading seam", () => {
  const a = orbitPoint(-Math.PI, 0.5),
    b = orbitPoint(Math.PI, 0.5);
  assert.ok(Math.abs(a.x - b.x) < 1e-10);
  assert.ok(Math.abs(a.y - b.y) < 1e-10);
  assert.notEqual(orbitPoint(0, 0).x, orbitPoint(Math.PI, 0).x);
  assert.ok(Number.isFinite(orbitPoint(0, Math.PI / 2).y));
});
