import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  CAMERA_STOPS,
  defaultCamera,
  withCameraPatch,
} from "../src/core/camera";
import { applyIsometricCamera } from "../src/renderer/camera";
import { SceneSchema } from "../src/core/schema";
import { SceneStore } from "../src/main/store";

const near = (a: number, b: number) =>
  assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
const angle = (a: THREE.Vector3, b: THREE.Vector3, aspect: number) => {
  let degrees = THREE.MathUtils.radToDeg(
    Math.atan2(b.y - a.y, (b.x - a.x) * aspect),
  );
  if (degrees > 90) degrees -= 180;
  if (degrees < -90) degrees += 180;
  return degrees;
};

test("orthographic stops keep exact projected diagonals across aspect, mirror, parent transforms, pan and zoom", () => {
  for (const aspect of [0.6, 1, 1.6, 2.4])
    for (const transformed of [false, true])
      for (const side of ["left", "right"] as const) {
        const frame = new THREE.Group();
        if (transformed) {
          frame.position.set(1, -0.6, 0.4);
          frame.rotation.set(0.4, -0.6, 0.2);
          frame.scale.set(2, 1.2, 3);
        }
        frame.updateMatrixWorld(true);
        const authored = new THREE.PerspectiveCamera(35, aspect, 0.01, 100);
        authored.position.z = 7;
        for (const [preset, degrees] of [
          ["diagonal15", 15],
          ["isometric", 30],
          ["diagonal45", 45],
        ] as const) {
          const camera = new THREE.OrthographicCamera();
          applyIsometricCamera(
            camera,
            authored,
            { ...defaultCamera(), projection: "orthographic", preset, side },
            frame,
            { zoom: 2.3, panX: 0.3, panY: -0.25 },
          );
          const project = (x: number, y: number, z = 0) =>
            new THREE.Vector3(x, y, z)
              .applyMatrix4(frame.matrixWorld)
              .project(camera);
          for (const depth of [0, 0.7, 2]) {
            const a = project(0, 0, depth),
              x = project(1, 0, depth),
              y = project(0, 1, depth);
            near(Math.abs(angle(a, x, aspect)), degrees);
            near(Math.abs(angle(a, y, aspect)), degrees);
            assert.ok(angle(a, x, aspect) * angle(a, y, aspect) < 0);
          }
        }
      }
});

test("true isometric equally foreshortens three axes and front matches perspective plane framing", () => {
  const frame = new THREE.Group(),
    authored = new THREE.PerspectiveCamera(35, 1.6, 0.01, 100);
  authored.position.z = 7;
  authored.updateMatrixWorld(true);
  const camera = new THREE.OrthographicCamera();
  applyIsometricCamera(
    camera,
    authored,
    { ...defaultCamera(), preset: "isometric" },
    frame,
    { zoom: 1, panX: 0, panY: 0 },
  );
  const center = new THREE.Vector3().project(camera);
  const lengths = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ].map((p) => {
    const v = new THREE.Vector3(...p).project(camera).sub(center);
    return Math.hypot(v.x * authored.aspect, v.y);
  });
  near(lengths[0], lengths[1]);
  near(lengths[1], lengths[2]);
  applyIsometricCamera(
    camera,
    authored,
    { ...defaultCamera(), preset: "front" },
    frame,
    { zoom: 1, panX: 0, panY: 0 },
  );
  for (const p of [
    [-2, -1, 0],
    [2, 1, 0],
  ]) {
    const a = new THREE.Vector3(...p).project(camera),
      b = new THREE.Vector3(...p).project(authored);
    near(a.x, b.x);
    near(a.y, b.y);
  }
  near(CAMERA_STOPS.isometric.elevation, Math.atan(1 / Math.sqrt(2)));
});

test("camera patches preserve other fields and reject unknown or approximate presets", () => {
  const s = withCameraPatch(undefined, {
    projection: "orthographic",
    side: "left",
  });
  assert.deepEqual(withCameraPatch(s, { preset: "diagonal15" }), {
    projection: "orthographic",
    side: "left",
    preset: "diagonal15",
  });
  assert.throws(() => withCameraPatch(s, { preset: 35.264 }));
  assert.throws(() => withCameraPatch(s, { projection: "isometric" }));
  assert.throws(() => withCameraPatch(s, { fov: NaN }));
});

test("camera choice persists and participates in file undo, redo and reopening", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-camera-"));
  const dir = path.join(root, "scenes/interface");
  const seed = JSON.parse(
    await fs.readFile(
      new URL("../scenes/interface/scene.json", import.meta.url),
      "utf8",
    ),
  );
  delete seed.camera;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "scene.json"), JSON.stringify(seed));
  const store = new SceneStore(root);
  let reopened: SceneStore | undefined;
  try {
    await store.open("interface");
    store.watcher?.close();
    await store.edit((s) => {
      s.camera = withCameraPatch(s.camera, {
        projection: "orthographic",
        preset: "isometric",
        sourceId: "ui",
      });
    });
    await store.history("undo");
    assert.equal(store.scene.camera, undefined);
    await store.history("redo");
    assert.equal(
      SceneSchema.parse(store.scene).camera?.projection,
      "orthographic",
    );
    reopened = new SceneStore(root);
    await reopened.open("interface");
    reopened.watcher?.close();
    assert.deepEqual(reopened.scene.camera, store.scene.camera);
    assert.equal(
      SceneSchema.safeParse({
        ...seed,
        camera: { ...defaultCamera(), sourceId: "missing" },
      }).success,
      false,
    );
  } finally {
    store.watcher?.close();
    reopened?.watcher?.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});
