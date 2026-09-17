import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { alignInspectionFront } from "../src/renderer/camera";
import { InspectionSchema, defaultInspection } from "../src/core/context";
import { rotateInspection } from "../src/renderer/inspection-rotation";

test("front reset aligns translated and tilted content, fits both aspect ratios and is repeatable", () => {
  for (const aspect of [0.6, 1.6]) {
    const frame = new THREE.Group();
    frame.position.set(2, -1, 0.3);
    frame.rotation.set(0.4, -0.7, 0.2);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(6, 4));
    frame.add(plane);
    const camera = new THREE.PerspectiveCamera(35, aspect, 0.01, 100);
    camera.position.set(4, 5, 9);
    const target = alignInspectionFront(camera, frame);
    camera.updateMatrixWorld(true);
    assert.ok(target.clone().project(camera).length() < 1.01);
    const center = target.clone().project(camera);
    assert.ok(Math.abs(center.x) < 1e-9 && Math.abs(center.y) < 1e-9);
    const corners = [
      [-3, -2],
      [3, -2],
      [3, 2],
      [-3, 2],
    ].map(([x, y]) =>
      new THREE.Vector3(x, y, 0)
        .applyMatrix4(frame.matrixWorld)
        .project(camera),
    );
    for (const point of corners)
      assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1);
    assert.ok(Math.abs(corners[0].y - corners[1].y) < 1e-9);
    assert.ok(Math.abs(corners[1].x - corners[2].x) < 1e-9);
    const previous = camera.position.clone();
    alignInspectionFront(camera, frame);
    assert.ok(previous.distanceTo(camera.position) < 1e-9);
  }
});

test("old viewer state gains neutral roll and all rotation axes preserve pan and zoom", () => {
  const old = { zoom: 2, panX: 0.3, panY: -0.2, orbitX: 0.4, orbitY: -0.5 };
  const restored = InspectionSchema.parse(old);
  assert.equal(restored.orbitZ, 0);
  for (const [axis, key] of [
    ["X", "orbitY"],
    ["Y", "orbitX"],
    ["Z", "orbitZ"],
  ] as const) {
    const next = rotateInspection(restored, axis, 0.25);
    assert.deepEqual(next, { ...restored, [key]: restored[key] + 0.25 });
    assert.deepEqual(rotateInspection(next, axis, -0.25), restored);
  }
});

test("rotation snapping uses exact 15 degree stops on either side of zero", () => {
  for (const sign of [-1, 1]) {
    const next = rotateInspection(defaultInspection(), "Z", sign * 0.3, true);
    assert.equal(next.orbitZ, (sign * Math.PI) / 12);
  }
  assert.equal(defaultInspection().orbitZ, 0);
});
