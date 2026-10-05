import test from "node:test";
import assert from "node:assert/strict";
import {
  PlaygroundSchema,
  applyPlaygroundSnap,
  createPlayground,
  findPlaygroundSnap,
  movePlaygroundTile,
  markPlaygroundTime,
  playgroundSequenceMarks,
  playgroundChain,
  playgroundSequenceDuration,
  playgroundSnapCue,
  playgroundSnapLineLength,
  playgroundPlaybackPins,
  playgroundPlaybackKey,
  playgroundTileGap,
  playgroundTileWidth,
  PLAYGROUND_SNAP_DISTANCE,
  reconcilePlayground,
  resetPlaygroundLayout,
  samplePlaygroundChain,
  selectPlaygroundChain,
  type PlaygroundDocument,
} from "../src/core/playground";
import { WorkspaceUISchema } from "../src/core/workspace-display";

const scenes = [
  { id: "a", duration: 5 },
  { id: "b", duration: 10 },
  { id: "c", duration: 15 },
  { id: "d", duration: 4 },
  { id: "e", duration: 8 },
];
const arrangement = (): PlaygroundDocument => ({
  version: 1,
  canvasHeight: 320,
  tiles: [
    { sceneId: "a", x: 40, y: 40, nextId: "b" },
    { sceneId: "b", x: 224, y: 40, nextId: "c" },
    { sceneId: "c", x: 448, y: 40, nextId: null },
    { sceneId: "d", x: 40, y: 200, nextId: null },
    { sceneId: "e", x: 400, y: 200, nextId: null },
  ],
});

test("reset lines distinct scenes up horizontally with their displayed widths and preserves metadata", () => {
  const catalog = scenes.slice(0, 3).map((scene) => ({
    ...scene,
    name: `Scene ${scene.id}`,
  }));
  const original = PlaygroundSchema.parse({
    ...createPlayground(catalog),
    canvasHeight: 480,
    ui: { clipHeight: 48, clipWidthMode: "uniform", clipUniformWidth: 240 },
    compositions: { b: { clipWidth: 390, clipColor: "#123456" } },
    tags: { a: ["Demo videos"], b: ["Demo videos"], c: ["Demo videos"] },
    marks: [{ sceneId: "b", time: 2.5 }],
  });
  const before = structuredClone(original);
  const { document, bounds } = resetPlaygroundLayout(original, catalog);
  assert.deepEqual(
    document.tiles.map(({ x, y, nextId }) => [x, y, nextId]),
    [
      [40, 40, null],
      [312, 40, null],
      [734, 40, null],
    ],
  );
  assert.deepEqual(bounds, { x: 40, y: 40, width: 934, height: 48 });
  assert.equal(document.canvasHeight, 480);
  for (const key of ["ui", "compositions", "tags", "marks"] as const)
    assert.deepEqual(document[key], original[key]);
  assert.deepEqual(original, before, "reset must not mutate its input");
  assert.deepEqual(PlaygroundSchema.parse(document), document);
});

test("reset stacks named versions in catalog order and leaves room for the widest version", () => {
  const catalog = [
    { id: "hero-v3", name: "Hero final", duration: 5 },
    { id: "other", name: "Checkout", duration: 10 },
    { id: "hero-v1", name: "Hero first", duration: 15 },
    { id: "hero-v2", name: "Hero second", duration: 4 },
  ];
  const original = PlaygroundSchema.parse({
    ...createPlayground(catalog),
    ui: { clipHeight: 44 },
    compositions: {
      "hero-v3": { title: "Hero — Final", version: 3, clipWidth: 180 },
      "hero-v1": { title: "Hero — First", version: 1, clipWidth: 400 },
      "hero-v2": { title: "Hero — Second", version: 2, clipWidth: 280 },
    },
  });
  const { document, bounds } = resetPlaygroundLayout(original, catalog);
  assert.deepEqual(
    document.tiles.map(({ sceneId, x, y }) => [sceneId, x, y]),
    [
      ["hero-v3", 40, 40],
      ["other", 472, 40],
      ["hero-v1", 40, 100],
      ["hero-v2", 40, 160],
    ],
  );
  assert.deepEqual(bounds, { x: 40, y: 40, width: 652, height: 164 });
  assert.deepEqual(resetPlaygroundLayout(document, catalog), {
    document,
    bounds,
  });
});

test("reset disconnects every sequence before arranging standalone scene columns", () => {
  const catalog = [
    { id: "b", name: "Outro", duration: 10 },
    { id: "a", name: "Intro", duration: 5 },
    { id: "c", name: "Intro", duration: 15 },
    { id: "d", name: "Outro", duration: 4 },
    { id: "e", name: "Single", duration: 8 },
  ];
  const original = PlaygroundSchema.parse({
    ...createPlayground(catalog),
    ui: { clipGap: 12, clipHeight: 32 },
    compositions: { a: { version: 2 }, b: { version: 2 } },
  });
  original.tiles.find((tile) => tile.sceneId === "a")!.nextId = "b";
  original.tiles.find((tile) => tile.sceneId === "c")!.nextId = "d";
  const { document, bounds } = resetPlaygroundLayout(original, catalog);
  assert.deepEqual(playgroundChain(document, "b"), ["b"]);
  assert.deepEqual(playgroundChain(document, "d"), ["d"]);
  assert.deepEqual(
    document.tiles.map(({ sceneId, x, y }) => [sceneId, x, y]),
    [
      ["b", 40, 40],
      ["a", 292, 40],
      ["c", 292, 88],
      ["d", 40, 88],
      ["e", 604, 40],
    ],
  );
  assert.deepEqual(bounds, { x: 40, y: 40, width: 760, height: 80 });
  assert.ok(document.tiles.every((tile) => tile.nextId === null));
  assert.equal(
    original.tiles.find((tile) => tile.sceneId === "a")!.nextId,
    "b",
  );
  assert.equal(
    original.tiles.find((tile) => tile.sceneId === "c")!.nextId,
    "d",
  );
  assert.deepEqual(resetPlaygroundLayout(document, catalog), {
    document,
    bounds,
  });
});

test("reset groups Order named versions despite links crossing scene families", () => {
  const catalog = [
    { id: "becoming", name: "Order 1401 — Becoming", duration: 15 },
    { id: "demo", name: "Demo video", duration: 8 },
    { id: "depth", name: "Order 1401 — In depth", duration: 14 },
    { id: "small", name: "Order 1401 — Small things", duration: 11 },
  ];
  const original = PlaygroundSchema.parse({
    ...createPlayground(catalog),
    compositions: { becoming: { version: 9 }, depth: { version: 2 } },
    ui: { clipGap: 20, clipHeight: 32 },
    marks: [{ sceneId: "depth", time: 4 }],
  });
  original.tiles.find((tile) => tile.sceneId === "becoming")!.nextId = "demo";
  original.tiles.find((tile) => tile.sceneId === "demo")!.nextId = "depth";
  original.tiles.find((tile) => tile.sceneId === "depth")!.nextId = "small";
  const { document, bounds } = resetPlaygroundLayout(original, catalog);
  assert.deepEqual(
    document.tiles.map(({ sceneId, x, y, nextId }) => [sceneId, x, y, nextId]),
    [
      ["becoming", 40, 40, null],
      ["demo", 352, 40, null],
      ["depth", 40, 88, null],
      ["small", 40, 136, null],
    ],
  );
  assert.deepEqual(bounds, { x: 40, y: 40, width: 508, height: 128 });
  assert.deepEqual(document.compositions, original.compositions);
  assert.deepEqual(document.marks, original.marks);
});

test("reset handles an empty canvas and retains tiles missing from a stale catalog", () => {
  const empty = createPlayground([]);
  assert.deepEqual(resetPlaygroundLayout(empty, []), {
    document: empty,
    bounds: null,
  });
  const original = createPlayground(scenes.slice(0, 2));
  original.tiles[0].nextId = "b";
  const { document, bounds } = resetPlaygroundLayout(original, []);
  assert.deepEqual(
    document.tiles.map(({ sceneId, x, y }) => [sceneId, x, y]),
    [
      ["a", 40, 40],
      ["b", 252, 40],
    ],
  );
  assert.deepEqual(bounds, { x: 40, y: 40, width: 392, height: 32 });
  assert.ok(document.tiles.every((tile) => tile.nextId === null));
});

test("the project arrangement round-trips as JSON with safe graph validation", () => {
  const document = arrangement();
  document.tags = { a: ["Order 14-01", "Demo videos"] };
  assert.deepEqual(
    PlaygroundSchema.parse(JSON.parse(JSON.stringify(document))),
    document,
  );
  for (const mutate of [
    (value: PlaygroundDocument) => value.tiles.push({ ...value.tiles[0] }),
    (value: PlaygroundDocument) => (value.tiles[0].x = Infinity),
    (value: PlaygroundDocument) => (value.tiles[0].nextId = "missing"),
    (value: PlaygroundDocument) => (value.tiles[2].nextId = "a"),
    (value: PlaygroundDocument) => (value.tiles[3].nextId = "b"),
  ]) {
    const value = arrangement();
    mutate(value);
    assert.equal(PlaygroundSchema.safeParse(value).success, false);
  }
});

test("default clips use two columns, duration-aware widths, and stable catalog reconciliation", () => {
  const document = createPlayground(scenes);
  assert.equal(document.tiles[0].y, document.tiles[1].y);
  assert.ok(document.tiles[2].y > document.tiles[0].y);
  assert.ok(playgroundTileWidth(15) > playgroundTileWidth(5));
  assert.equal(playgroundTileWidth(1000), 340);
  assert.equal(playgroundTileWidth(0), 180);
  const original = arrangement();
  original.tags = { a: ["Demo"], b: ["Deleted"] };
  const catalog = scenes
    .filter((scene) => scene.id !== "b")
    .concat({ id: "new", duration: 8 });
  const result = reconcilePlayground(original, catalog);
  assert.equal(result.tiles.find((tile) => tile.sceneId === "a")!.nextId, null);
  assert.equal(result.tiles.find((tile) => tile.sceneId === "a")!.x, 40);
  assert.equal(
    result.tiles.some((tile) => tile.sceneId === "b"),
    false,
  );
  assert.ok(result.tiles.find((tile) => tile.sceneId === "new")!.y > 200);
  assert.deepEqual(result.tags, { a: ["Demo"] });
  assert.equal(
    original.tiles[0].nextId,
    "b",
    "reconciliation must not mutate its input",
  );
});

test("changing a composition duration keeps connected tiles touching", () => {
  const result = reconcilePlayground(
    arrangement(),
    scenes.map((scene) => ({
      ...scene,
      duration: scene.id === "a" ? 20 : scene.duration,
    })),
  );
  assert.equal(result.tiles[1].x, 40 + 340);
  assert.equal(result.tiles[2].x, 40 + 340 + 220);
});

test("display width modes and clip overrides reflow joined chains without moving their heads", () => {
  const document = PlaygroundSchema.parse({
    ...arrangement(),
    ui: {
      clipWidthMode: "duration",
      clipWidthBase: 80,
      clipWidthPerSecond: 20,
      clipMinWidth: 160,
      clipMaxWidth: 600,
    },
  });
  assert.equal(playgroundTileWidth(10, document, "b"), 280);
  assert.equal(playgroundTileWidth(50, document, "b"), 600);
  assert.equal(playgroundTileWidth(Infinity, document, "b"), 160);
  const duration = reconcilePlayground(document, scenes);
  assert.deepEqual(
    duration.tiles.slice(0, 3).map(({ x }) => x),
    [40, 220, 500],
  );

  const uniform = PlaygroundSchema.parse({
    ...document,
    ui: { ...document.ui, clipWidthMode: "uniform", clipUniformWidth: 240 },
    compositions: {
      a: { version: 1, clipWidth: 400 },
      b: { version: 2, clipWidth: 120, clipColor: "#047efe" },
    },
  });
  const result = reconcilePlayground(uniform, scenes);
  assert.equal(playgroundTileWidth(5, uniform, "a"), 400);
  assert.equal(playgroundTileWidth(15, uniform, "c"), 240);
  assert.deepEqual(
    result.tiles.slice(0, 3).map(({ x, y }) => [x, y]),
    [
      [40, 40],
      [440, 40],
      [560, 40],
    ],
  );
  assert.equal(result.tiles[3].x, document.tiles[3].x);
  assert.equal(result.tiles[3].y, document.tiles[3].y);
  assert.equal(
    document.tiles[2].x,
    448,
    "reflow must not mutate input positions",
  );
  assert.deepEqual(result.compositions, uniform.compositions);
});

test("saved clip spacing reflows every join without moving heads or independent clips", () => {
  assert.equal(playgroundTileGap(), 0);
  for (const gap of [0, 16, 40]) {
    const document = PlaygroundSchema.parse({
      ...arrangement(),
      ui: { clipWidthMode: "uniform", clipUniformWidth: 180, clipGap: gap },
      compositions: { a: { clipWidth: 100 }, b: { clipWidth: 140 } },
    });
    const result = reconcilePlayground(document, scenes);
    assert.equal(playgroundTileGap(result), gap);
    assert.deepEqual(
      result.tiles.slice(0, 3).map(({ x, y }) => [x, y]),
      [
        [40, 40],
        [140 + gap, 40],
        [280 + 2 * gap, 40],
      ],
    );
    assert.deepEqual(result.tiles.slice(3), document.tiles.slice(3));
    assert.equal(
      document.tiles[1].x,
      224,
      "reflow leaves the source document intact",
    );
  }
});

test("append and prepend snaps preserve the configured gap throughout the sequence", () => {
  for (const gap of [0, 16, 40]) {
    const document = PlaygroundSchema.parse({
      ...arrangement(),
      ui: { clipGap: gap },
      tiles: [
        { sceneId: "a", x: 40, y: 40, nextId: null },
        { sceneId: "b", x: 223 + gap, y: 44, nextId: "c" },
        { sceneId: "c", x: 443 + 2 * gap, y: 44, nextId: null },
      ],
    });
    const append = findPlaygroundSnap(document, scenes, "b");
    assert.ok(append);
    assert.deepEqual([append.fromId, append.toId], ["a", "b"]);
    const appended = applyPlaygroundSnap(document, scenes.slice(0, 3), append);
    assert.deepEqual(
      appended.tiles.map(({ x, y }) => [x, y]),
      [
        [40, 40],
        [220 + gap, 40],
        [440 + 2 * gap, 40],
      ],
    );

    const detached = PlaygroundSchema.parse({
      ...document,
      tiles: [
        { sceneId: "a", x: 40, y: 40, nextId: "b" },
        { sceneId: "b", x: 220 + gap, y: 40, nextId: null },
        { sceneId: "c", x: 443 + 2 * gap, y: 44, nextId: null },
      ],
    });
    const prepend = findPlaygroundSnap(detached, scenes, "a");
    assert.ok(prepend);
    assert.deepEqual([prepend.fromId, prepend.toId], ["b", "c"]);
    const prepended = applyPlaygroundSnap(
      detached,
      scenes.slice(0, 3),
      prepend,
    );
    assert.deepEqual(
      prepended.tiles.map(({ x, y }) => [x, y]),
      [
        [43, 44],
        [223 + gap, 44],
        [443 + 2 * gap, 44],
      ],
    );
  }
});

test("snap reach and cue progress use the saved threshold while explicit overrides remain available", () => {
  for (const snapDistance of [4, 28, 100]) {
    const document = PlaygroundSchema.parse({
      version: 1,
      ui: { clipGap: 16, snapDistance },
      tiles: [
        { sceneId: "a", x: 40, y: 40, nextId: null },
        { sceneId: "b", x: 236 + snapDistance / 2, y: 40, nextId: null },
      ],
    });
    const inside = findPlaygroundSnap(document, scenes, "b");
    assert.ok(inside);
    assert.equal(playgroundSnapCue(document, scenes, inside)!.progress, 0.5);
    const edge = movePlaygroundTile(document, "b", 236 + snapDistance, 40);
    assert.equal(findPlaygroundSnap(edge, scenes, "b")!.distance, snapDistance);
    assert.equal(
      playgroundSnapCue(edge, scenes, findPlaygroundSnap(edge, scenes, "b"))!
        .progress,
      0,
    );
    const outside = movePlaygroundTile(document, "b", 237 + snapDistance, 40);
    assert.equal(findPlaygroundSnap(outside, scenes, "b"), null);
    assert.ok(findPlaygroundSnap(outside, scenes, "b", snapDistance + 1));
    assert.equal(
      findPlaygroundSnap(document, scenes, "b", snapDistance / 2 - 1),
      null,
    );
  }
});

test("snapping uses the same custom geometry for appended and prepended sequences", () => {
  const document = PlaygroundSchema.parse({
    version: 1,
    ui: { clipWidthMode: "uniform", clipUniformWidth: 240 },
    compositions: { a: { clipWidth: 400 }, b: { clipWidth: 120 } },
    tiles: [
      { sceneId: "a", x: 40, y: 40, nextId: null },
      { sceneId: "b", x: 458, y: 44, nextId: "c" },
      { sceneId: "c", x: 582, y: 44, nextId: null },
    ],
  });
  const catalog = scenes.slice(0, 3);
  const append = findPlaygroundSnap(document, catalog, "b");
  assert.ok(append);
  assert.deepEqual([append.fromId, append.toId], ["a", "b"]);
  const appended = applyPlaygroundSnap(document, catalog, append);
  assert.deepEqual(
    appended.tiles.map(({ x, y }) => [x, y]),
    [
      [40, 40],
      [440, 40],
      [560, 40],
    ],
  );

  const detached = PlaygroundSchema.parse({
    ...document,
    tiles: [
      { sceneId: "a", x: 40, y: 40, nextId: "b" },
      { sceneId: "b", x: 444, y: 40, nextId: null },
      { sceneId: "c", x: 574, y: 44, nextId: null },
    ],
  });
  const prepend = findPlaygroundSnap(detached, catalog, "a");
  assert.ok(prepend);
  assert.deepEqual([prepend.fromId, prepend.toId], ["b", "c"]);
  const prepended = applyPlaygroundSnap(detached, catalog, prepend);
  assert.deepEqual(
    prepended.tiles.map(({ x, y }) => [x, y]),
    [
      [54, 44],
      [454, 44],
      [574, 44],
    ],
  );
  assert.deepEqual(playgroundChain(prepended, "c"), ["a", "b", "c"]);
});

test("snap cues follow the displayed gap with custom widths and vertical offset", () => {
  const document = PlaygroundSchema.parse({
    version: 1,
    ui: { clipWidthMode: "uniform", clipUniformWidth: 240 },
    compositions: { a: { clipWidth: 400 } },
    tiles: [
      { sceneId: "a", x: 40, y: 40, nextId: null },
      { sceneId: "b", x: 458, y: 44, nextId: "c" },
      { sceneId: "c", x: 702, y: 44, nextId: null },
    ],
  });
  const snap = findPlaygroundSnap(document, scenes, "b");
  assert.ok(snap);
  const cue = playgroundSnapCue(document, scenes, snap);
  assert.ok(cue);
  assert.equal(cue.x, 449, "cue belongs in the current 18px gap");
  assert.equal(cue.y, 42);
  assert.equal(cue.progress, 1 - Math.hypot(18, 4) / PLAYGROUND_SNAP_DISTANCE);
  assert.equal(
    document.tiles[1].x,
    458,
    "cue measurement must not snap the clip",
  );
});

test("prepended and detached suffix cues use the endpoint rather than the dragged head", () => {
  const document = PlaygroundSchema.parse({
    ...arrangement(),
    ui: { clipWidthMode: "uniform", clipUniformWidth: 240 },
    compositions: { a: { clipWidth: 400 }, b: { clipWidth: 120 } },
    tiles: [
      { sceneId: "a", x: 40, y: 40, nextId: "b" },
      { sceneId: "b", x: 444, y: 40, nextId: null },
      { sceneId: "c", x: 574, y: 44, nextId: null },
    ],
  });
  const prepend = findPlaygroundSnap(document, scenes, "a");
  assert.ok(prepend);
  assert.deepEqual([prepend.fromId, prepend.toId], ["b", "c"]);
  assert.equal(playgroundSnapCue(document, scenes, prepend)!.x, 569);

  const detached = movePlaygroundTile(document, "b", 450, 44);
  assert.equal(detached.tiles[0].nextId, null);
  const suffixSnap = findPlaygroundSnap(detached, scenes, "b");
  assert.ok(suffixSnap);
  assert.deepEqual([suffixSnap.fromId, suffixSnap.toId], ["b", "c"]);
  assert.deepEqual(playgroundSnapCue(detached, scenes, suffixSnap), {
    x: 572,
    y: 44,
    progress: 1 - 4 / PLAYGROUND_SNAP_DISTANCE,
  });
});

test("snap cue progress is bounded and stale endpoints produce no cue", () => {
  const document = arrangement();
  const snap = {
    movingId: "d",
    fromId: "a",
    toId: "d",
    x: 224,
    y: 40,
    distance: 0,
  };
  for (const [distance, expected] of [
    [-1, 1],
    [0, 1],
    [PLAYGROUND_SNAP_DISTANCE / 2, 0.5],
    [PLAYGROUND_SNAP_DISTANCE, 0],
    [PLAYGROUND_SNAP_DISTANCE + 1, 0],
    [NaN, 0],
  ]) {
    assert.equal(
      playgroundSnapCue(document, scenes, { ...snap, distance })!.progress,
      expected,
    );
  }
  assert.equal(playgroundSnapCue(document, scenes, null), null);
  assert.equal(
    playgroundSnapCue(document, scenes, { ...snap, fromId: "missing" }),
    null,
  );
  assert.equal(
    playgroundSnapCue(document, scenes, { ...snap, toId: "missing" }),
    null,
  );
  assert.equal(
    playgroundSnapCue(document, scenes, { ...snap, toId: "a" }),
    null,
  );
});

test("snap line grows monotonically with proximity through the configured pixel lengths and curve", () => {
  const document = PlaygroundSchema.parse({
    version: 1,
    tiles: [
      { sceneId: "a", x: 40, y: 40, nextId: null },
      { sceneId: "b", x: 246, y: 40, nextId: null },
    ],
    ui: { snapCueStartLength: 8, snapCueEndLength: 72 },
  });
  for (const snapCueGrowthCurve of [
    "linear",
    "easeIn",
    "easeOut",
    "smooth",
  ] as const) {
    const ui = { ...document.ui!, snapCueGrowthCurve };
    const lengths = [26, 19.5, 13, 6.5, 0].map((distance) => {
      const moved = movePlaygroundTile(document, "b", 220 + distance, 40);
      const snap = findPlaygroundSnap(moved, scenes, "b");
      assert.ok(snap);
      return playgroundSnapLineLength(
        ui,
        playgroundSnapCue(moved, scenes, snap)!.progress,
      );
    });
    assert.equal(lengths[0], 8, `${snapCueGrowthCurve} starts at snap reach`);
    assert.equal(lengths.at(-1), 72, `${snapCueGrowthCurve} ends at the join`);
    assert.ok(
      lengths.every((length, index) => !index || length >= lengths[index - 1]),
    );
    assert.equal(
      lengths[2],
      { linear: 40, easeIn: 24, easeOut: 56, smooth: 40 }[snapCueGrowthCurve],
      `${snapCueGrowthCurve} controls intermediate growth`,
    );
  }
});

test("snap line clamps proximity and supports a fixed or zero length", () => {
  const ui = WorkspaceUISchema.parse({
    snapCueStartLength: 8,
    snapCueEndLength: 72,
  });
  for (const [progress, expected] of [
    [-1, 8],
    [0, 8],
    [1, 72],
    [2, 72],
    [NaN, 8],
    [Infinity, 8],
    [-Infinity, 8],
  ])
    assert.equal(playgroundSnapLineLength(ui, progress), expected);
  for (const length of [0, 30])
    for (const progress of [0, 0.5, 1])
      assert.equal(
        playgroundSnapLineLength(
          { ...ui, snapCueStartLength: length, snapCueEndLength: length },
          progress,
        ),
        length,
      );
});

test("dragging the head moves a sequence; dragging its middle detaches only the suffix", () => {
  const original = arrangement();
  const whole = movePlaygroundTile(original, "a", 80, 140);
  assert.deepEqual(playgroundChain(whole, "c"), ["a", "b", "c"]);
  assert.equal(whole.tiles[1].x, 264);
  assert.equal(whole.tiles[2].y, 140);
  const detached = movePlaygroundTile(original, "b", 500, 300);
  assert.equal(detached.tiles[0].nextId, null);
  assert.deepEqual(playgroundChain(detached, "c"), ["b", "c"]);
  assert.equal(detached.tiles[2].x, 724);
  assert.equal(detached.tiles[3].y, 200);
  assert.equal(original.tiles[0].nextId, "b");
  assert.equal(original.tiles[1].x, 224);
});

test("a dragged head snaps to another sequence's tail and aligns precisely", () => {
  const document = createPlayground(scenes.slice(0, 3));
  document.tiles = [
    { sceneId: "a", x: 40, y: 40, nextId: null },
    { sceneId: "b", x: 238, y: 44, nextId: "c" },
    { sceneId: "c", x: 462, y: 44, nextId: null },
  ];
  const snap = findPlaygroundSnap(document, scenes, "b");
  assert.ok(snap);
  assert.deepEqual([snap.fromId, snap.toId], ["a", "b"]);
  const result = applyPlaygroundSnap(document, scenes.slice(0, 3), snap);
  assert.deepEqual(playgroundChain(result, "b"), ["a", "b", "c"]);
  assert.deepEqual(
    result.tiles.map(({ x, y }) => [x, y]),
    [
      [40, 40],
      [220, 40],
      [440, 40],
    ],
  );
  assert.equal(document.tiles[0].nextId, null);
});

test("a dragged sequence's tail snaps to another head without moving the target", () => {
  const document = arrangement();
  document.tiles[1].nextId = null;
  document.tiles[2] = { sceneId: "c", x: 450, y: 44, nextId: null };
  const snap = findPlaygroundSnap(document, scenes, "a");
  assert.ok(snap);
  assert.deepEqual([snap.fromId, snap.toId], ["b", "c"]);
  const result = applyPlaygroundSnap(document, scenes, snap);
  assert.equal(result.tiles[0].x, 50);
  assert.equal(result.tiles[1].x, 230);
  assert.equal(result.tiles[2].x, 450);
  assert.equal(result.tiles[0].y, 44);
  assert.deepEqual(playgroundChain(result, "c"), ["a", "b", "c"]);
});

test("snap rejects distant clips, occupied endpoints, stale connections, and cycles", () => {
  const document = arrangement();
  assert.equal(findPlaygroundSnap(document, scenes, "a"), null);
  const nextToMiddle = movePlaygroundTile(
    document,
    "d",
    document.tiles[1].x - playgroundTileWidth(4) - 4,
    40,
  );
  assert.equal(findPlaygroundSnap(nextToMiddle, scenes, "d"), null);
  assert.throws(
    () =>
      applyPlaygroundSnap(document, scenes, {
        movingId: "a",
        fromId: "c",
        toId: "a",
        x: 0,
        y: 0,
        distance: 0,
      }),
    /itself/,
  );
  assert.throws(
    () =>
      applyPlaygroundSnap(document, scenes, {
        movingId: "d",
        fromId: "a",
        toId: "d",
        x: 0,
        y: 0,
        distance: 0,
      }),
    /no longer available/,
  );
});

test("Shift-click selects at most four distinct sequences and toggles any member", () => {
  const document = createPlayground(scenes);
  let selected: string[] = [];
  for (const scene of scenes)
    selected = selectPlaygroundChain(document, selected, scene.id, true);
  assert.deepEqual(selected, ["a", "b", "c", "d"]);
  assert.deepEqual(selectPlaygroundChain(document, selected, "b", true), [
    "a",
    "c",
    "d",
  ]);
  assert.deepEqual(selectPlaygroundChain(document, selected, "e", false), [
    "e",
  ]);
  assert.deepEqual(
    selectPlaygroundChain(arrangement(), ["a", "d"], "c", true),
    ["d"],
  );
  assert.deepEqual(
    selectPlaygroundChain(arrangement(), ["b", "c", "d"], "e", true),
    ["a", "d", "e"],
  );
});

test("sequence sampling uses absolute time, owns cuts on the right, and loops the joined duration", () => {
  const document = arrangement();
  assert.equal(playgroundSequenceDuration(document, scenes, "b"), 30);
  assert.deepEqual(samplePlaygroundChain(document, scenes, "b", 5), {
    sceneId: "b",
    sourceTime: 0,
    sequenceTime: 5,
    sequenceDuration: 30,
    index: 1,
  });
  assert.equal(
    samplePlaygroundChain(document, scenes, "c", 14.75)!.sourceTime,
    9.75,
  );
  assert.equal(samplePlaygroundChain(document, scenes, "c", 15)!.sceneId, "c");
  assert.equal(samplePlaygroundChain(document, scenes, "a", 31)!.sourceTime, 1);
  assert.equal(samplePlaygroundChain(document, scenes, "a", 31)!.sceneId, "a");
  assert.equal(
    samplePlaygroundChain(document, scenes, "a", 30, { loop: false })!
      .sourceTime,
    15,
  );
  assert.equal(
    samplePlaygroundChain(document, scenes, "a", -10)!.sourceTime,
    0,
  );
  assert.equal(
    samplePlaygroundChain(document, scenes, "a", 4)!.sourceTime,
    4,
    "backward seeking does not depend on previous samples",
  );
  assert.equal(samplePlaygroundChain(document, scenes, "missing", 0), null);
  assert.equal(samplePlaygroundChain(document, [], "a", 0), null);
  assert.equal(samplePlaygroundChain(document, scenes, "a", Infinity), null);
});

test("playback identity and samples survive canvas moves and unrelated joins or separations", () => {
  const original = arrangement();
  const key = playgroundPlaybackKey(original, ["b"]);
  const moved = movePlaygroundTile(original, "a", 90, 75);
  const near = movePlaygroundTile(
    moved,
    "e",
    moved.tiles[3].x + playgroundTileWidth(4, moved, "d"),
    moved.tiles[3].y,
  );
  const snap = findPlaygroundSnap(near, scenes, "e");
  assert.ok(snap);
  assert.deepEqual([snap.fromId, snap.toId], ["d", "e"]);
  const joined = applyPlaygroundSnap(near, scenes, snap);
  const separated = movePlaygroundTile(joined, "e", 610, 290);
  assert.equal(joined.tiles[3].nextId, "e");
  assert.equal(separated.tiles[3].nextId, null);

  for (const document of [moved, near, joined, separated]) {
    assert.equal(playgroundPlaybackKey(document, ["b"]), key);
    for (const time of [2.5, 5, 6, 32]) {
      assert.deepEqual(
        samplePlaygroundChain(document, scenes, "b", time),
        samplePlaygroundChain(original, scenes, "b", time),
      );
      assert.deepEqual(
        playgroundPlaybackPins(document, scenes, ["b"], time),
        playgroundPlaybackPins(original, scenes, ["b"], time),
      );
    }
  }
});

test("editing a selected chain changes playback identity and its sampled sequence", () => {
  const original = arrangement();
  const key = playgroundPlaybackKey(original, ["a"]);
  const separated = movePlaygroundTile(original, "b", 600, 300);
  assert.notEqual(playgroundPlaybackKey(separated, ["a"]), key);
  assert.equal(samplePlaygroundChain(original, scenes, "a", 6)!.sceneId, "b");
  assert.equal(samplePlaygroundChain(separated, scenes, "a", 6)!.sceneId, "a");

  const near = movePlaygroundTile(
    original,
    "d",
    original.tiles[2].x + playgroundTileWidth(15, original, "c"),
    original.tiles[2].y,
  );
  const snap = findPlaygroundSnap(near, scenes, "d");
  assert.ok(snap);
  const joined = applyPlaygroundSnap(near, scenes, snap);
  assert.notEqual(playgroundPlaybackKey(joined, ["a"]), key);
  assert.deepEqual(playgroundChain(joined, "a"), ["a", "b", "c", "d"]);
  assert.equal(samplePlaygroundChain(joined, scenes, "a", 31)!.sceneId, "d");
});

test("playback identity normalizes comparison members, preserves order and matches the four-preview limit", () => {
  const joined = arrangement();
  assert.equal(
    playgroundPlaybackKey(joined, ["b", "a", "c", "missing", "d"]),
    playgroundPlaybackKey(joined, ["a", "d"]),
  );
  assert.notEqual(
    playgroundPlaybackKey(joined, ["a", "d"]),
    playgroundPlaybackKey(joined, ["d", "a"]),
  );
  const separate = createPlayground(scenes);
  const selected = ["a", "missing", "a", "b", "c", "d", "e"];
  assert.equal(
    playgroundPlaybackKey(separate, selected),
    playgroundPlaybackKey(separate, ["a", "b", "c", "d"]),
  );
  assert.equal(JSON.parse(playgroundPlaybackKey(separate, selected)).length, 4);
  assert.deepEqual(
    playgroundPlaybackPins(separate, scenes, selected, 1),
    playgroundPlaybackPins(separate, scenes, ["a", "b", "c", "d"], 1),
  );
  assert.equal(playgroundPlaybackKey(joined, ["missing"]), "[]");
});

test("playback pins use source progress, exact joined cuts, and the preview loop", () => {
  const single = createPlayground(scenes);
  assert.deepEqual(playgroundPlaybackPins(single, scenes, ["a"], 2.5), [
    { sceneId: "a", progress: 0.5 },
  ]);
  assert.deepEqual(playgroundPlaybackPins(single, scenes, ["a"], 8), [
    { sceneId: "a", progress: 0.6 },
  ]);
  const joined = PlaygroundSchema.parse({
    ...arrangement(),
    ui: { clipGap: 40 },
  });
  assert.deepEqual(playgroundPlaybackPins(joined, scenes, ["a"], 5), [
    { sceneId: "b", progress: 0 },
  ]);
  assert.deepEqual(playgroundPlaybackPins(joined, scenes, ["a"], 10), [
    { sceneId: "b", progress: 0.5 },
  ]);
  assert.deepEqual(playgroundPlaybackPins(joined, scenes, ["a"], 15), [
    { sceneId: "c", progress: 0 },
  ]);
  assert.deepEqual(playgroundPlaybackPins(joined, scenes, ["a"], 30), [
    { sceneId: "a", progress: 0 },
  ]);
  assert.deepEqual(playgroundPlaybackPins(joined, scenes, ["a"], 32.5), [
    { sceneId: "a", progress: 0.5 },
  ]);
});

test("comparison pins share one clock with unequal durations and at most four unique sequences", () => {
  assert.deepEqual(
    playgroundPlaybackPins(arrangement(), scenes, ["a", "b", "c", "d", "e"], 6),
    [
      { sceneId: "b", progress: 0.1 },
      { sceneId: "d", progress: 0.5 },
      { sceneId: "e", progress: 0.75 },
    ],
  );
  assert.deepEqual(
    playgroundPlaybackPins(
      createPlayground(scenes),
      scenes,
      ["a", "a", "b", "c", "d", "e"],
      2,
    ),
    [
      { sceneId: "a", progress: 0.4 },
      { sceneId: "b", progress: 0.2 },
      { sceneId: "c", progress: 2 / 15 },
      { sceneId: "d", progress: 0.5 },
    ],
  );
});

test("pins skip empty or invalid clips and clamp negative or nonfinite clock input safely", () => {
  const catalog = [
    { id: "a", duration: 0 },
    { id: "b", duration: Infinity },
    { id: "c", duration: -1 },
    { id: "d", duration: 2 },
    { id: "e", duration: 8 },
  ];
  const document = arrangement();
  document.tiles[2].nextId = "d";
  assert.deepEqual(playgroundPlaybackPins(document, catalog, ["a", "e"], 1), [
    { sceneId: "d", progress: 0.5 },
    { sceneId: "e", progress: 0.125 },
  ]);
  assert.deepEqual(playgroundPlaybackPins(document, catalog, ["a"], -10), [
    { sceneId: "d", progress: 0 },
  ]);
  for (const time of [Infinity, -Infinity, NaN])
    assert.deepEqual(
      playgroundPlaybackPins(document, catalog, ["a", "e"], time),
      [],
    );
  assert.deepEqual(
    playgroundPlaybackPins(document, catalog.slice(0, 3), ["a"], 0),
    [],
  );
  assert.deepEqual(
    playgroundPlaybackPins(document, catalog, ["missing"], 0),
    [],
  );
});

test("time marks retain source timestamps across joined and separated sequences", () => {
  const original = arrangement();
  const marked = markPlaygroundTime(original, scenes, ["a", "d"], 7.25);
  assert.deepEqual(marked.marks, [
    { sceneId: "b", time: 2.25 },
    { sceneId: "d", time: 3.25 },
  ]);
  assert.equal(original.marks, undefined);
  assert.deepEqual(playgroundSequenceMarks(marked, scenes, "a"), [
    { sceneId: "b", sourceTime: 2.25, time: 7.25 },
  ]);
  const separated = movePlaygroundTile(marked, "b", 800, 300);
  assert.deepEqual(playgroundSequenceMarks(separated, scenes, "b"), [
    { sceneId: "b", sourceTime: 2.25, time: 2.25 },
  ]);
  assert.deepEqual(
    PlaygroundSchema.parse(JSON.parse(JSON.stringify(marked))),
    marked,
  );
  assert.deepEqual(
    markPlaygroundTime(marked, scenes, ["a"], 7.26).marks,
    marked.marks,
  );
});

test("catalog changes discard removed marks and clamp shortened clips", () => {
  const marked = {
    ...arrangement(),
    marks: [
      { sceneId: "b", time: 8 },
      { sceneId: "d", time: 3 },
    ],
  };
  const catalog = scenes
    .filter((scene) => scene.id !== "d")
    .map((scene) => (scene.id === "b" ? { ...scene, duration: 4 } : scene));
  assert.deepEqual(reconcilePlayground(marked, catalog).marks, [
    { sceneId: "b", time: 4 },
  ]);
  assert.equal(
    PlaygroundSchema.safeParse({
      ...marked,
      marks: [{ sceneId: "a", time: NaN }],
    }).success,
    false,
  );
});
