import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import * as THREE from "three";
import {
  defaultCamera,
  defaultDepthOfField,
  withCameraPatch,
} from "../src/core/camera";
import { focusDistance } from "../src/renderer/depth-of-field";
import { SceneStore } from "../src/main/store";

test("DOF is opt-in; nested partial edits preserve focus, blur and camera framing", () => {
  assert.equal(defaultCamera().depthOfField, undefined);
  assert.equal(defaultDepthOfField().enabled, false);
  let camera = withCameraPatch(undefined, {
    zoom: 3,
    depthOfField: { enabled: true },
  });
  assert.deepEqual(camera.depthOfField, {
    enabled: true,
    focusPlane: 0,
    blur: 0.35,
  });
  camera = withCameraPatch(camera, {
    depthOfField: { focusPlane: -2, blur: 0.7 },
  });
  camera = withCameraPatch(camera, { depthOfField: { enabled: false } });
  camera = withCameraPatch(camera, { depthOfField: { enabled: true } });
  assert.deepEqual(camera.depthOfField, {
    enabled: true,
    focusPlane: -2,
    blur: 0.7,
  });
  assert.equal(camera.zoom, 3);
  for (const depthOfField of [
    { blur: -1 },
    { blur: 1.01 },
    { focusPlane: Infinity },
    { focusPlane: -1001 },
    { enabled: "true" },
    { aperture: 1 },
  ])
    assert.throws(() => withCameraPatch(camera, { depthOfField }));
});

test("focus is camera-space depth, follows the source, and works in both projections", () => {
  for (const camera of [
    new THREE.PerspectiveCamera(35, 1, 0.01, 100),
    new THREE.OrthographicCamera(-3, 3, 3, -3, 0.01, 100),
  ]) {
    const origin = new THREE.Vector3(1, 2, 3);
    camera.position.set(1, 2, 10);
    camera.lookAt(origin);
    assert.equal(focusDistance(camera, origin, 0), 7);
    assert.equal(focusDistance(camera, origin, 1), 6);
    camera.position.set(8, 2, 3);
    camera.lookAt(origin);
    assert.ok(Math.abs(focusDistance(camera, origin, -2) - 9) < 1e-8);
    assert.equal(focusDistance(camera, origin, 100), 0.01);
    assert.equal(focusDistance(camera, origin, -1000), 100);
    assert.deepEqual(origin.toArray(), [1, 2, 3]);
  }
});

test("DOF gestures survive file undo, redo and reopening without losing inactive values", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-dof-"));
  const directory = path.join(root, "scenes/interface");
  const seed = JSON.parse(
    await fs.readFile(
      new URL("./fixtures/scene.json", import.meta.url),
      "utf8",
    ),
  );
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, "scene.json"), JSON.stringify(seed));
  const store = new SceneStore(root);
  let reopened: SceneStore | undefined;
  try {
    await store.open("interface");
    store.watcher?.close();
    await store.edit((doc) => {
      doc.camera = withCameraPatch(doc.camera, {
        depthOfField: { enabled: true, focusPlane: 0.8, blur: 0.6 },
      });
    });
    await store.edit((doc) => {
      doc.camera = withCameraPatch(doc.camera, {
        depthOfField: { enabled: false },
      });
    });
    await store.history("undo");
    assert.equal(store.scene.camera?.depthOfField?.enabled, true);
    await store.history("redo");
    assert.deepEqual(store.scene.camera?.depthOfField, {
      enabled: false,
      focusPlane: 0.8,
      blur: 0.6,
    });
    reopened = new SceneStore(root);
    await reopened.open("interface");
    reopened.watcher?.close();
    assert.deepEqual(reopened.scene.camera, store.scene.camera);
  } finally {
    store.watcher?.close();
    reopened?.watcher?.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});
