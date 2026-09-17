import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  DepthOfField,
  depthOfFieldMemory,
} from "../src/renderer/depth-of-field";
import {
  SurfaceDepthOfField,
  surfacePyramidMemory,
} from "../src/renderer/surface-depth-of-field";

function renderer(width = 128, height = 64) {
  const size = new THREE.Vector2(width, height);
  let target: THREE.WebGLRenderTarget | null = null;
  return {
    size,
    renderer: {
      capabilities: { maxSamples: 4 },
      autoClear: true,
      getDrawingBufferSize: (out: THREE.Vector2) => out.copy(size),
      getRenderTarget: () => target,
      setRenderTarget: (next: THREE.WebGLRenderTarget | null) => {
        target = next;
      },
      render: () => {},
    } as unknown as THREE.WebGLRenderer,
  };
}
function plane(width: number, height: number, texture?: THREE.Texture) {
  const map =
    texture ?? new THREE.Texture({ width, height } as HTMLImageElement);
  return new THREE.Mesh(
    new THREE.PlaneGeometry(),
    new THREE.MeshBasicMaterial({ map }),
  );
}

test("surface pyramid estimates follow actual padded sizes and include scratch", () => {
  const memory = surfacePyramidMemory(128, 64);
  assert.equal(memory.paddedWidth, 160);
  assert.equal(memory.paddedHeight, 96);
  assert.deepEqual(memory.sizes, [
    { width: 80, height: 48 },
    { width: 40, height: 24 },
    { width: 20, height: 12 },
    { width: 10, height: 6 },
    { width: 5, height: 3 },
    { width: 3, height: 2 },
    { width: 2, height: 1 },
    { width: 1, height: 1 },
  ]);
  assert.equal(
    memory.residentBytes,
    (3840 + 960 + 240 + 60 + 15 + 6 + 2 + 1) * 8,
  );
  assert.equal(memory.buildPeakBytes, 3840 * 8 * 2);
  assert.throws(() => surfacePyramidMemory(0, 64), /dimensions/);
});

test("general DOF includes resolved depth, multisampling, and all scratch levels", () => {
  const single = depthOfFieldMemory(128, 64, 0);
  assert.equal(single.colorBytes, 128 * 64 * 12);
  assert.equal(
    single.pyramidBytes,
    (64 * 32 + 32 * 16 + 16 * 8 + 8 * 4 + 4 * 2 + 2) * 16,
  );
  const multisampled = depthOfFieldMemory(128, 64, 4);
  assert.equal(multisampled.colorBytes, single.colorBytes * 5);
  assert.equal(multisampled.pyramidBytes, single.pyramidBytes);
  assert.throws(() => depthOfFieldMemory(128, 64, -1), /sample count/);
});

test("surface estimates deduplicate textures, preserve cached allocations, and include replacement peaks", () => {
  const fake = renderer();
  const effect = new SurfaceDepthOfField(fake.renderer);
  const world = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera();
  const first = plane(128, 64);
  world.add(first, plane(128, 64, first.material.map!));
  assert.equal(effect.supports(world), true);
  const initial = effect.estimateMemory();
  const expected = surfacePyramidMemory(128, 64);
  assert.equal(initial.residentBytes, 0);
  assert.equal(initial.nextResidentBytes, expected.residentBytes);
  assert.equal(initial.peakBytes, expected.buildPeakBytes);
  assert.equal(
    effect.cacheBuilds,
    0,
    "preflight never renders or allocates targets",
  );
  effect.render(world, camera, 1, 0.5);
  assert.equal(effect.residentBytes, expected.residentBytes);
  assert.equal(effect.cacheBuilds, 1);
  assert.deepEqual(effect.estimateMemory(), {
    residentBytes: expected.residentBytes,
    nextResidentBytes: expected.residentBytes,
    peakBytes: expected.residentBytes,
  });
  first.material.map!.image = { width: 256, height: 128 };
  first.material.map!.needsUpdate = true;
  const replacement = effect.estimateMemory(),
    next = surfacePyramidMemory(256, 128);
  assert.equal(
    replacement.peakBytes,
    expected.residentBytes + next.buildPeakBytes,
  );
  assert.equal(replacement.nextResidentBytes, next.residentBytes);
  effect.render(world, camera, 1, 0.5);
  assert.equal(effect.residentBytes, next.residentBytes);
  world.clear();
  effect.supports(world);
  assert.equal(
    effect.estimateMemory().residentBytes,
    next.residentBytes,
    "retained cache stays accounted even when invisible",
  );
  effect.dispose();
  assert.equal(effect.residentBytes, 0);
});

test("general DOF resize estimates reserve both old and next target generations", () => {
  const fake = renderer();
  const effect = new DepthOfField(fake.renderer);
  const world = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera();
  const old = depthOfFieldMemory(128, 64, 4).residentBytes;
  assert.deepEqual(effect.estimateMemory(), {
    residentBytes: 0,
    nextResidentBytes: old,
    peakBytes: old,
  });
  effect.render(world, camera, 1, 0.5);
  assert.equal(effect.residentBytes, old);
  assert.equal(effect.estimateMemory().peakBytes, old);
  fake.size.set(256, 128);
  const next = depthOfFieldMemory(256, 128, 4).residentBytes;
  assert.deepEqual(effect.estimateMemory(), {
    residentBytes: old,
    nextResidentBytes: next,
    peakBytes: old + next,
  });
  effect.render(world, camera, 1, 0.5);
  assert.equal(effect.residentBytes, next);
  effect.dispose();
  assert.equal(effect.residentBytes, 0);
});
