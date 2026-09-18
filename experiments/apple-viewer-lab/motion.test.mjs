import test from "node:test";
import assert from "node:assert/strict";
import { nearestTurn, nearestShot, approach, shots, TAU } from "./motion.mjs";

test("crossing the full-turn seam takes the short route", () => {
  assert.ok(Math.abs(nearestTurn(0.04, TAU - 0.04) - (TAU + 0.04)) < 1e-10);
  assert.ok(Math.abs(nearestTurn(TAU - 0.04, 0.04) + 0.04) < 1e-10);
});
test("snapping is periodic even after many full revolutions", () => {
  for (let turn = -20; turn <= 20; turn++)
    assert.equal(nearestShot(shots, TAU * turn + 0.015, 0).id, "back");
});
test("release velocity changes the intended destination, with bounded prediction", () => {
  const s = [
    { yaw: 0, pitch: 0 },
    { yaw: 1, pitch: 0 },
    { yaw: 3, pitch: 0 },
  ];
  assert.equal(nearestShot(s, 0.4, 0, 0), s[0]);
  assert.equal(nearestShot(s, 0.4, 0, 2), s[1]);
  assert.equal(nearestShot(s, 0.4, 0, 100), s[1]);
});
test("damping agrees at 30, 60, and 120 Hz", () => {
  const run = (hz) => {
    let x = 0;
    for (let i = 0; i < hz; i++) x = approach(x, 1, 7.3, 1 / hz);
    return x;
  };
  assert.ok(Math.abs(run(30) - run(60)) < 1e-12);
  assert.ok(Math.abs(run(60) - run(120)) < 1e-12);
});
test("reversing a transition immediately moves toward its new target", () => {
  let x = approach(0, 1, 7.3, 1 / 60);
  const reversed = approach(x, -1, 7.3, 1 / 60);
  assert.ok(reversed < x && reversed > -1);
});
test("tab-resume frame does not jump through a whole animation", () => {
  assert.equal(approach(0, 1, 7.3, 30), approach(0, 1, 7.3, 0.05));
});
