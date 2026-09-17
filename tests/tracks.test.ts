import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dragTrack,
  TrackSchema,
  withTrackTiming,
  retimeTracks,
  trackRows,
} from "../src/core/tracks";
import { SceneSchema } from "../src/core/schema";
import { readFileSync } from "node:fs";

test("clip movement clamps without changing length; reversing uses original grab", () => {
  const track = { start: 2, end: 5 };
  assert.deepEqual(dragTrack(track, "move", 100, 8, 60), { start: 5, end: 8 });
  assert.deepEqual(dragTrack(track, "move", -100, 8, 60), { start: 0, end: 3 });
  assert.deepEqual(dragTrack(track, "move", 0, 8, 60), track);
  assert.equal(dragTrack(track, "move", 0.02, 8, 60).start, 121 / 60);
});
test("both trim handles preserve at least a frame", () => {
  const track = { start: 2, end: 5 };
  assert.equal(dragTrack(track, "start", 100, 8, 60).start, 5 - 1 / 60);
  assert.equal(dragTrack(track, "end", -100, 8, 60).end, 2 + 1 / 60);
});
test("retiming preserves relative cues and rejects invalid bounds", () => {
  const track = TrackSchema.parse({
    id: "a",
    label: "A",
    color: "#aabbcc",
    start: 2,
    end: 4,
    keys: [2, 3, 4],
  });
  assert.deepEqual(
    withTrackTiming(track, { start: 1, end: 5 }, 8).keys,
    [1, 3, 5],
  );
  assert.throws(() => withTrackTiming(track, { start: 4, end: 4 }, 8));
  assert.throws(() => withTrackTiming(track, { start: 1, end: 9 }, 8));
});
test("track bindings require existing parameters and unique track IDs", () => {
  const scene = JSON.parse(
    readFileSync(new URL("./fixtures/scene.json", import.meta.url), "utf8"),
  );
  const track = {
    id: "a",
    label: "A",
    color: "#aabbcc",
    start: 0,
    end: 1,
    parameterKeys: ["missing"],
  };
  assert.equal(
    SceneSchema.safeParse({ ...scene, tracks: [track] }).success,
    false,
  );
  assert.equal(
    SceneSchema.safeParse({
      ...scene,
      tracks: [
        { ...track, parameterKeys: [] },
        { ...track, parameterKeys: [] },
      ],
    }).success,
    false,
  );
});

test("group hierarchy validates targets, parents, cycles and contained timing", () => {
  const scene = JSON.parse(
    readFileSync(
      new URL("../scenes/interface/scene.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(SceneSchema.safeParse(scene).success, true);
  for (const patch of [
    { parentId: "missing" },
    { parentId: "settle-note" },
    { end: 7 },
    { targets: [{ kind: "layer", sourceId: "ui", layerId: "missing" }] },
  ]) {
    const changed = structuredClone(scene);
    Object.assign(changed.tracks[2], patch);
    assert.equal(SceneSchema.safeParse(changed).success, false);
  }
  scene.tracks[0].parentId = "cards-settle";
  assert.equal(SceneSchema.safeParse(scene).success, false);
});

test("nested group retiming preserves relative motion and leaves siblings alone", () => {
  const make = (
    id: string,
    start: number,
    end: number,
    parentId?: string,
    kind?: "group",
  ) =>
    TrackSchema.parse({
      id,
      label: id,
      color: "#aabbcc",
      start,
      end,
      parentId,
      kind,
      keys: [start, end],
    });
  const tracks = [
    make("group", 0, 6, undefined, "group"),
    make("nested", 1, 5, "group", "group"),
    make("child", 2, 4, "nested"),
    make("camera", 0, 6),
  ];
  const next = retimeTracks(tracks, "group", { start: 2, end: 5 }, 8);
  assert.deepEqual(
    next.map((t) => [t.start, t.end]),
    [
      [2, 5],
      [2.5, 4.5],
      [3, 4],
      [0, 6],
    ],
  );
  assert.deepEqual(next[2].keys, [3, 4]);
  assert.deepEqual(
    retimeTracks(next, "group", { start: 0, end: 6 }, 8),
    tracks,
  );
  assert.throws(
    () => retimeTracks(tracks, "child", { start: 0, end: 4 }, 8),
    /inside its group/,
  );
  assert.deepEqual(
    trackRows(tracks, new Set()).map((r) => r.track.id),
    ["group", "camera"],
  );
  assert.deepEqual(
    trackRows(tracks, new Set(["group", "nested"])).map((r) => [
      r.track.id,
      r.depth,
    ]),
    [
      ["group", 0],
      ["nested", 1],
      ["child", 2],
      ["camera", 0],
    ],
  );
});

test("group and child edits drive absolute scene sampling independently of camera drift", async () => {
  const THREE = await import("three");
  const { default: createScene } = await import("../scenes/interface/scene");
  const { parameterReader } = await import("../src/core/parameters");
  const document = SceneSchema.parse(
    JSON.parse(
      readFileSync(
        new URL("../scenes/interface/scene.json", import.meta.url),
        "utf8",
      ),
    ),
  );
  const world = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  const { LayeredSource } = await import("../src/renderer/layered-source");
  const layered = new LayeredSource(document.sources[0], {}, { width: 5.8 });
  const instance = createScene({
    motion: await import("../src/core/motion"),
    THREE,
    world,
    camera,
    document,
    createLayeredSource: () => layered,
  } as any);
  const controls = parameterReader(document.parameters);
  const poses = new Map<number, number[]>();
  for (const time of [0, 3, 6, 3, 0, 8]) {
    instance.sample({
      time,
      frame: time * 60,
      document,
      controls,
      parameters: {},
    });
    const heights = layered.ids.map((id) => layered.get(id).object.position.z);
    if (poses.has(time)) assert.deepEqual(heights, poses.get(time));
    else poses.set(time, heights);
    if (time >= 6) {
      assert.ok(heights.every((z) => z === 0));
      assert.equal(
        camera.view?.offsetX,
        document.size.width * controls.number("driftX"),
      );
      assert.equal(
        camera.view?.offsetY,
        document.size.height * controls.number("driftY"),
      );
    }
    if (time === 0) {
      assert.equal(camera.view?.offsetX, 0);
      assert.equal(camera.view?.offsetY, 0);
    }
    if (time === 0) assert.ok(heights.every((z) => z > 0));
  }
  document.tracks = retimeTracks(
    document.tracks,
    "cards-settle",
    { start: 2, end: 8 },
    8,
  );
  instance.sample({ time: 6, frame: 360, document, controls, parameters: {} });
  assert.ok(layered.get("composer").object.position.z > 0);
  assert.equal(
    camera.view?.offsetX,
    document.size.width * controls.number("driftX"),
  );
  document.tracks = retimeTracks(
    document.tracks,
    "settle-composer",
    { start: 2, end: 3 },
    8,
  );
  instance.sample({ time: 3, frame: 180, document, controls, parameters: {} });
  assert.equal(layered.get("composer").object.position.z, 0);
  assert.ok(layered.get("payment").object.position.z > 0);
});
