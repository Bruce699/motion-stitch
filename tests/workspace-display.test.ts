import test from "node:test";
import assert from "node:assert/strict";
import {
  compositionDetails,
  matchesComposition,
  WorkspaceUISchema,
  CompositionDetailsSchema,
  resetWorkspaceBoxUI,
  resetWorkspaceSnapUI,
  resetWorkspacePreviewUI,
  resetWorkspaceStageUI,
  resetWorkspaceHoverUI,
} from "../src/core/workspace-display";
import { PlaygroundSchema, reconcilePlayground } from "../src/core/playground";

test("scene and version filters use named versions rather than legacy numeric metadata", () => {
  const versions = {
    a: { title: "Order 1401 — Becoming", version: 1 },
    b: { title: "Order 1401 - In depth", version: 2 },
  };
  const a = compositionDetails({ id: "a", name: "First cut" }, versions);
  const b = compositionDetails({ id: "b", name: "Second cut" }, versions);
  assert.equal(matchesComposition(a, "Order 1401", "In depth", ""), false);
  assert.equal(matchesComposition(b, "Order 1401", "In depth", ""), true);
  assert.equal(matchesComposition(b, "Other scene", "In depth", ""), false);
  assert.equal(
    matchesComposition(b, "Order 1401 - In depth", "all", ""),
    false,
  );
  assert.equal(matchesComposition(b, "all", "2", ""), false);
  assert.equal(matchesComposition(b, "all", "all", "v2"), false);
  assert.equal(matchesComposition(b, "all", "all", "  IN DEPTH "), true);
  assert.equal(
    matchesComposition(b, "all", "all", "order 1401 - in depth"),
    true,
  );
  assert.equal(matchesComposition(b, "all", "all", "order 1401"), true);
  assert.equal(
    matchesComposition(b, "all", "In depth", "demo", "Demo videos"),
    true,
  );
  assert.deepEqual(
    compositionDetails({ id: "missing", name: "New scene" }, versions),
    { title: "New scene", sceneName: "New scene", versionName: "" },
  );
});

test("composition names split only the first separator and retain the full display title", () => {
  for (const [title, sceneName, versionName] of [
    ["Order 1401 - Becoming", "Order 1401", "Becoming"],
    ["Order 1401 – In depth", "Order 1401", "In depth"],
    ["Order 1401 — Small things", "Order 1401", "Small things"],
    ["Order 1401—Becoming", "Order 1401", "Becoming"],
    ["Order 1401–Becoming", "Order 1401", "Becoming"],
    [
      "Order 1401 - Becoming — Short - Revised",
      "Order 1401",
      "Becoming — Short - Revised",
    ],
    ["  Order 1401  -  Becoming  ", "Order 1401", "Becoming"],
    ["Long-term project - Re-cut", "Long-term project", "Re-cut"],
    ["Long-term project", "Long-term project", ""],
    ["Scene-Revision", "Scene-Revision", ""],
    ["Scene -Revision", "Scene -Revision", ""],
    ["Scene- Revision", "Scene- Revision", ""],
    ["Scene - ", "Scene -", ""],
    ["Scene —", "Scene —", ""],
    ["— Revision", "— Revision", ""],
    [" - Revision", "- Revision", ""],
    ["Untitled", "Untitled", ""],
  ]) {
    assert.deepEqual(
      compositionDetails({ id: "a", name: title }),
      { title, sceneName, versionName },
      title,
    );
  }
});

test("saved title overrides determine names while legacy numeric metadata remains untouched", () => {
  const metadata = {
    title: "Order 1401 - Becoming",
    version: 7,
    clipWidth: 256,
    clipColor: "#8c51fe",
  };
  assert.deepEqual(
    compositionDetails(
      { id: "a", name: "Source scene — Draft" },
      { a: metadata },
    ),
    { ...metadata, sceneName: "Order 1401", versionName: "Becoming" },
  );
  const unnamedVersion = compositionDetails(
    { id: "a", name: "Standalone scene" },
    { a: { version: 7 } },
  );
  assert.equal(unnamedVersion.sceneName, "Standalone scene");
  assert.equal(unnamedVersion.versionName, "");
  assert.equal(unnamedVersion.version, 7);
  assert.equal(matchesComposition(unnamedVersion, "all", "all", "v7"), false);
  assert.equal(
    matchesComposition(unnamedVersion, "Standalone scene", "", ""),
    true,
  );
  assert.equal(matchesComposition(unnamedVersion, "all", "7", ""), false);
});

test("workspace display values validate bounds and preserve version metadata through catalog changes", () => {
  const workspace = PlaygroundSchema.parse({
    version: 1,
    tiles: [],
    ui: { rowGap: 48 },
    compositions: {
      a: { title: "First cut", version: 2 },
      removed: { version: 3 },
    },
  });
  assert.equal(workspace.ui?.rowGap, 48);
  assert.equal(workspace.ui?.switchFontSize, 13);
  assert.deepEqual(
    reconcilePlayground(workspace, [{ id: "a", duration: 8 }]).compositions,
    { a: { title: "First cut", version: 2 } },
  );
  for (const ui of [
    { versionOpacity: 2 },
    { switchPaddingX: -1 },
    { toolbarScale: Infinity },
    { clipMinWidth: 500, clipMaxWidth: 400 },
    { clipWidthMode: "fixed" },
    { clipUniformWidth: 79 },
    { clipWidthPerSecond: -1 },
    { clipTagFillOpacity: 1.1 },
    { clipTagVisible: "true" },
    { clipTagTextColor: "red" },
    { clipFillColor: "#ffffff80" },
    { clipBorderColor: "#fff" },
    { clipTagColorMode: "palette" },
    { clipTitleWeight: "800" },
    { clipLayoutAlign: "justify" },
    { clipTagLetterSpacing: -2 },
  ])
    assert.equal(WorkspaceUISchema.safeParse(ui).success, false);
  assert.equal(
    PlaygroundSchema.safeParse({
      version: 1,
      tiles: [],
      compositions: { a: { version: 1.5 } },
    }).success,
    false,
  );
});

test("per-composition clip overrides survive title and version editing", () => {
  const metadata = CompositionDetailsSchema.parse({
    title: "First cut",
    version: 2,
    clipWidth: 512,
    clipColor: "#8c51fe",
  });
  const resolved = compositionDetails(
    { id: "a", name: "Original title" },
    { a: metadata },
  );
  const updated = CompositionDetailsSchema.parse({
    ...resolved,
    title: "Final cut",
    version: 3,
  });
  assert.deepEqual(updated, {
    title: "Final cut",
    version: 3,
    clipWidth: 512,
    clipColor: "#8c51fe",
  });
  for (const override of [
    { clipWidth: 79 },
    { clipWidth: Infinity },
    { clipColor: "#1234" },
    { clipColor: "rgba(0,0,0,.5)" },
  ])
    assert.equal(CompositionDetailsSchema.safeParse(override).success, false);
});

test("preview spacing defaults preserve the existing layout and serialize independently", () => {
  const defaults = WorkspaceUISchema.parse({});
  assert.deepEqual(
    [defaults.previewColumnGap, defaults.previewRowGap],
    [20, 16],
  );
  const workspace = PlaygroundSchema.parse({
    version: 1,
    tiles: [],
    ui: { previewColumnGap: 0, previewRowGap: 120, columnGap: 32, rowGap: 48 },
  });
  const restored = PlaygroundSchema.parse(
    JSON.parse(JSON.stringify(workspace)),
  );
  assert.deepEqual(
    [
      restored.ui?.previewColumnGap,
      restored.ui?.previewRowGap,
      restored.ui?.columnGap,
      restored.ui?.rowGap,
    ],
    [0, 120, 32, 48],
    "preview spacing is independent of Library spacing",
  );
});

test("preview spacing accepts pixel bounds and rejects invalid values", () => {
  for (const key of ["previewColumnGap", "previewRowGap"] as const) {
    for (const value of [0, 12.5, 120])
      assert.equal(WorkspaceUISchema.parse({ [key]: value })[key], value);
    for (const value of [-0.1, 120.1, Infinity, NaN, "20", null])
      assert.equal(
        WorkspaceUISchema.safeParse({ [key]: value }).success,
        false,
      );
  }
});

const hoverBounds = {
  hoverPreviewWidth: [80, 480, 80],
  hoverPreviewHeight: [45, 320, 45],
  hoverPreviewGap: [0, 32, 8],
  hoverPreviewOffset: [0, 80, 12],
  hoverPreviewRadius: [0, 32, 4],
  hoverPreviewPadding: [0, 24, 4],
  hoverPreviewOuterRadius: [0, 40, 10],
  hoverPreviewFPS: [4, 24, 10],
  hoverPreviewDelay: [0, 800, 0],
} as const;

test("older workspace files receive hover defaults without changing saved layout", () => {
  const tiles = [{ sceneId: "a", x: 40, y: 60, nextId: null }];
  const workspace = PlaygroundSchema.parse({
    version: 1,
    tiles,
    ui: { previewColumnGap: 4, previewRowGap: 4, switchFontSize: 13 },
  });
  for (const [key, [, , value]] of Object.entries(hoverBounds))
    assert.equal(workspace.ui?.[key as keyof typeof hoverBounds], value);
  assert.deepEqual(workspace.tiles, tiles);
  assert.deepEqual(
    [
      workspace.ui?.previewColumnGap,
      workspace.ui?.previewRowGap,
      workspace.ui?.switchFontSize,
    ],
    [4, 4, 13],
  );
});

test("hover settings validate bounds and survive workspace serialization", () => {
  const ui = {
    hoverPreviewWidth: 360,
    hoverPreviewHeight: 202.5,
    hoverPreviewGap: 16,
    hoverPreviewOffset: 24,
    hoverPreviewRadius: 4,
    hoverPreviewPadding: 12,
    hoverPreviewOuterRadius: 16,
    hoverPreviewFPS: 8,
    hoverPreviewDelay: 320,
  };
  const workspace = PlaygroundSchema.parse({ version: 1, tiles: [], ui });
  const restored = PlaygroundSchema.parse(
    JSON.parse(JSON.stringify(workspace)),
  );
  for (const [key, value] of Object.entries(ui))
    assert.equal(restored.ui?.[key as keyof typeof ui], value);
  for (const [key, [min, max]] of Object.entries(hoverBounds)) {
    for (const value of [min, max])
      assert.equal(
        WorkspaceUISchema.parse({ [key]: value })[
          key as keyof typeof hoverBounds
        ],
        value,
      );
    for (const value of [min - 0.1, max + 0.1, Infinity, NaN, "12", null])
      assert.equal(
        WorkspaceUISchema.safeParse({ [key]: value }).success,
        false,
        `${key} rejects ${String(value)}`,
      );
  }
  assert.equal(
    WorkspaceUISchema.safeParse({ hoverPreviewFPS: 12.5 }).success,
    false,
  );
});

test("resetting hover previews preserves every unrelated workspace setting", () => {
  const current = WorkspaceUISchema.parse({
    hoverPreviewWidth: 360,
    hoverPreviewHeight: 202,
    hoverPreviewGap: 16,
    hoverPreviewOffset: 24,
    hoverPreviewRadius: 8,
    hoverPreviewPadding: 12,
    hoverPreviewOuterRadius: 16,
    hoverPreviewFPS: 8,
    hoverPreviewDelay: 320,
    switchFontSize: 20,
    previewColumnGap: 4,
    previewRowGap: 4,
    previewPaddingTop: 36,
    previewTransportGap: 20,
    columnGap: 24,
    rowGap: 40,
    clipRadius: 12,
    snapCueGradientAngle: 270,
    playPinWidth: 5,
  });
  const before = structuredClone(current);
  const defaults = WorkspaceUISchema.parse({});
  const reset = resetWorkspaceHoverUI(current);
  for (const key of Object.keys(defaults) as (keyof typeof defaults)[]) {
    const resetsHover = Object.hasOwn(hoverBounds, key);
    assert.equal(reset[key], resetsHover ? defaults[key] : current[key], key);
    if (resetsHover) {
      assert.notEqual(current[key], defaults[key], `${key} was customized`);
      for (const resetOther of [
        resetWorkspacePreviewUI,
        resetWorkspaceStageUI,
        resetWorkspaceBoxUI,
        resetWorkspaceSnapUI,
      ])
        assert.equal(
          resetOther(current)[key],
          current[key],
          `${key} survives unrelated reset`,
        );
    }
  }
  assert.deepEqual(current, before);
  assert.deepEqual(resetWorkspaceHoverUI(), defaults);
});

const stageBounds = {
  previewPaddingTop: [0, 120, 12],
  previewPaddingBottom: [0, 120, 12],
  previewPaddingX: [0, 120, 12],
  previewTransportHeight: [32, 120, 56],
  previewTransportGap: [0, 32, 12],
  previewTransportPaddingX: [0, 120, 20],
  previewTransportMaxWidth: [320, 1600, 880],
} as const;

test("older workspace files receive stage defaults without changing saved pill or preview spacing", () => {
  const workspace = PlaygroundSchema.parse({
    version: 1,
    tiles: [{ sceneId: "a", x: 40, y: 60 }],
    ui: {
      switchFontSize: 12,
      switchPaddingX: 30,
      switchPaddingY: 14,
      previewColumnGap: 36,
      previewRowGap: 40,
    },
  });
  for (const [key, [, , value]] of Object.entries(stageBounds))
    assert.equal(workspace.ui?.[key as keyof typeof stageBounds], value);
  assert.deepEqual(
    [
      workspace.ui?.switchFontSize,
      workspace.ui?.switchPaddingX,
      workspace.ui?.switchPaddingY,
      workspace.ui?.previewColumnGap,
      workspace.ui?.previewRowGap,
    ],
    [12, 30, 14, 36, 40],
  );
});

test("stage spacing validates pixel bounds and survives workspace serialization", () => {
  const ui = {
    previewPaddingTop: 0,
    previewPaddingBottom: 120,
    previewPaddingX: 24.5,
    previewTransportHeight: 32,
    previewTransportGap: 32,
    previewTransportPaddingX: 72,
    previewTransportMaxWidth: 1600,
  };
  const workspace = PlaygroundSchema.parse({ version: 1, tiles: [], ui });
  const restored = PlaygroundSchema.parse(
    JSON.parse(JSON.stringify(workspace)),
  );
  for (const [key, value] of Object.entries(ui))
    assert.equal(restored.ui?.[key as keyof typeof ui], value);
  for (const [key, [min, max]] of Object.entries(stageBounds)) {
    for (const value of [min, min + 0.5, max])
      assert.equal(
        WorkspaceUISchema.parse({ [key]: value })[
          key as keyof typeof stageBounds
        ],
        value,
      );
    for (const value of [min - 0.1, max + 0.1, Infinity, NaN, "12", null])
      assert.equal(
        WorkspaceUISchema.safeParse({ [key]: value }).success,
        false,
        `${key} rejects ${String(value)}`,
      );
  }
});

test("resetting stage spacing preserves the view pill, preview grid, and every other setting", () => {
  const current = WorkspaceUISchema.parse({
    previewPaddingTop: 24,
    previewPaddingBottom: 40,
    previewPaddingX: 8,
    previewTransportHeight: 72,
    previewTransportGap: 24,
    previewTransportPaddingX: 48,
    previewTransportMaxWidth: 1200,
    switchFontSize: 20,
    switchPaddingX: 32,
    switchPaddingY: 16,
    previewColumnGap: 80,
    previewRowGap: 120,
    columnGap: 32,
    rowGap: 48,
    clipHeight: 44,
    snapCueGradientAngle: 270,
    playPinWidth: 5,
  });
  const before = structuredClone(current);
  const defaults = WorkspaceUISchema.parse({});
  const reset = resetWorkspaceStageUI(current);
  const resetGrid = resetWorkspacePreviewUI(current);
  for (const key of Object.keys(defaults) as (keyof typeof defaults)[]) {
    const resetsStage = Object.hasOwn(stageBounds, key);
    assert.equal(reset[key], resetsStage ? defaults[key] : current[key], key);
    if (resetsStage) {
      assert.notEqual(current[key], defaults[key], `${key} was customized`);
      assert.equal(resetGrid[key], current[key], `${key} survives grid reset`);
    }
  }
  assert.deepEqual(current, before);
  assert.deepEqual(resetWorkspaceStageUI(), defaults);
});

test("resetting preview spacing preserves every other workspace setting and composition", () => {
  const workspace = PlaygroundSchema.parse({
    version: 1,
    tiles: [{ sceneId: "a", x: 40, y: 60 }],
    ui: {
      previewColumnGap: 80,
      previewRowGap: 120,
      columnGap: 32,
      rowGap: 48,
      switchFontSize: 20,
      clipRadius: 12,
      clipHeight: 44,
      clipFontSize: 16,
      clipTagVisible: true,
      snapDistance: 80,
      snapCueGradientAngle: 270,
      snapCueStartLength: 25,
      snapCueEndLength: 200,
      playPinWidth: 5,
    },
    compositions: {
      a: {
        title: "Final cut",
        version: 3,
        clipWidth: 512,
        clipColor: "#8c51fe",
      },
    },
  });
  const before = structuredClone(workspace);
  const defaults = WorkspaceUISchema.parse({});
  const current = workspace.ui!;
  const reset = resetWorkspacePreviewUI(current);
  for (const key of Object.keys(defaults) as (keyof typeof defaults)[]) {
    const resets = key === "previewColumnGap" || key === "previewRowGap";
    assert.equal(
      reset[key],
      resets ? defaults[key] : current[key],
      `${key} ${resets ? "resets" : "is preserved"}`,
    );
  }
  assert.deepEqual(workspace, before);
  assert.deepEqual(resetWorkspacePreviewUI(), defaults);
});

test("independent tag and duration controls preserve legacy typography until explicitly changed", () => {
  const legacy = WorkspaceUISchema.parse({ clipFontSize: 11, versionGap: 12 });
  assert.deepEqual(
    [legacy.clipTagFontSize, legacy.clipDurationFontSize, legacy.clipTagGap],
    [9, 10, 12],
  );
  const explicit = WorkspaceUISchema.parse({
    clipFontSize: 11,
    versionGap: 12,
    clipTagFontSize: 14,
    clipDurationFontSize: 16,
    clipTagGap: 0,
  });
  assert.deepEqual(
    [
      explicit.clipTagFontSize,
      explicit.clipDurationFontSize,
      explicit.clipTagGap,
    ],
    [14, 16, 0],
  );
  const defaults = WorkspaceUISchema.parse({});
  assert.deepEqual(
    {
      switchFontSize: defaults.switchFontSize,
      switchPaddingX: defaults.switchPaddingX,
      switchPaddingY: defaults.switchPaddingY,
      toolbarScale: defaults.toolbarScale,
      toolbarLineHeight: defaults.toolbarLineHeight,
      labelFontSize: defaults.labelFontSize,
      labelLineHeight: defaults.labelLineHeight,
      versionGap: defaults.versionGap,
      versionOpacity: defaults.versionOpacity,
      cardPadding: defaults.cardPadding,
      columnGap: defaults.columnGap,
      rowGap: defaults.rowGap,
      libraryPadding: defaults.libraryPadding,
      clipFontSize: defaults.clipFontSize,
      clipHeight: defaults.clipHeight,
      clipPadding: defaults.clipPadding,
      clipTagFontSize: defaults.clipTagFontSize,
      clipDurationFontSize: defaults.clipDurationFontSize,
      clipTagGap: defaults.clipTagGap,
      clipRadius: defaults.clipRadius,
      clipTagVisible: defaults.clipTagVisible,
    },
    {
      switchFontSize: 13,
      switchPaddingX: 24,
      switchPaddingY: 10,
      toolbarScale: 0.8,
      toolbarLineHeight: 1.4,
      labelFontSize: 12,
      labelLineHeight: 1.4,
      versionGap: 12,
      versionOpacity: 0.6,
      cardPadding: 12,
      columnGap: 8,
      rowGap: 8,
      libraryPadding: 24,
      clipFontSize: 11,
      clipHeight: 32,
      clipPadding: 8,
      clipTagFontSize: 9,
      clipDurationFontSize: 10,
      clipTagGap: 12,
      clipRadius: 8,
      clipTagVisible: false,
    },
  );
  assert.equal(
    WorkspaceUISchema.parse({ clipFontSize: 10 }).clipTagFontSize,
    9,
  );
});

test("older workspaces receive snap and play pin defaults without changing existing styling", () => {
  const legacy = WorkspaceUISchema.parse({
    clipFontSize: 13,
    versionGap: 16,
    clipFillColor: "#8c51fe",
    rowGap: 36,
  });
  assert.deepEqual(
    {
      clipGap: legacy.clipGap,
      snapDistance: legacy.snapDistance,
      snapSettleDuration: legacy.snapSettleDuration,
      snapCornerDuration: legacy.snapCornerDuration,
      snapEase: legacy.snapEase,
      snapCornerAnticipation: legacy.snapCornerAnticipation,
      snapCueVisible: legacy.snapCueVisible,
      snapCueWidth: legacy.snapCueWidth,
      snapCueHeight: legacy.snapCueHeight,
      snapCueRadius: legacy.snapCueRadius,
      snapCueOpacity: legacy.snapCueOpacity,
      snapCueFadeIn: legacy.snapCueFadeIn,
      snapCueFadeOut: legacy.snapCueFadeOut,
      snapCueGrowDuration: legacy.snapCueGrowDuration,
      snapCueStartScale: legacy.snapCueStartScale,
      snapCueStartLength: legacy.snapCueStartLength,
      snapCueEndLength: legacy.snapCueEndLength,
      snapCueGrowthCurve: legacy.snapCueGrowthCurve,
      snapCueColorMode: legacy.snapCueColorMode,
      snapCueGradientAngle: legacy.snapCueGradientAngle,
      snapCueFromColor: legacy.snapCueFromColor,
      snapCueToColor: legacy.snapCueToColor,
      playPinVisible: legacy.playPinVisible,
      playPinWidth: legacy.playPinWidth,
      playPinHeadSize: legacy.playPinHeadSize,
      playPinColor: legacy.playPinColor,
    },
    {
      clipGap: 0,
      snapDistance: 26,
      snapSettleDuration: 160,
      snapCornerDuration: 180,
      snapEase: "soft",
      snapCornerAnticipation: 1,
      snapCueVisible: true,
      snapCueWidth: 3,
      snapCueHeight: 1.2,
      snapCueRadius: 12,
      snapCueOpacity: 1,
      snapCueFadeIn: 100,
      snapCueFadeOut: 100,
      snapCueGrowDuration: 160,
      snapCueStartScale: 0.25,
      snapCueStartLength: 12.2,
      snapCueEndLength: 45.2,
      snapCueGrowthCurve: "linear",
      snapCueColorMode: "clips",
      snapCueGradientAngle: 143,
      snapCueFromColor: "#00bca6",
      snapCueToColor: "#ff9900",
      playPinVisible: true,
      playPinWidth: 1.5,
      playPinHeadSize: 6,
      playPinColor: "#ffffff",
    },
  );
  assert.equal(legacy.clipFontSize, 13);
  assert.equal(legacy.clipFillColor, "#8c51fe");
  assert.equal(legacy.rowGap, 36);
  assert.deepEqual(
    [legacy.clipTagFontSize, legacy.clipDurationFontSize, legacy.clipTagGap],
    [11, 12, 16],
  );
});

test("fresh snap line defaults match the approved direction and pixel lengths", () => {
  const defaults = WorkspaceUISchema.parse({});
  assert.deepEqual(
    [
      defaults.snapCueGradientAngle,
      defaults.snapCueStartLength,
      defaults.snapCueEndLength,
    ],
    [143, 12.2, 45.2],
  );
  assert.equal(
    WorkspaceUISchema.parse({ snapCueStartLength: 5 }).snapCueEndLength,
    45.2,
  );
  assert.equal(
    WorkspaceUISchema.parse({ snapCueEndLength: 60 }).snapCueStartLength,
    12.2,
  );
});

test("snap and play pin edits survive workspace serialization with bounded values", () => {
  const ui = {
    clipGap: 0,
    snapDistance: 100,
    snapSettleDuration: 0,
    snapCornerDuration: 1000,
    snapEase: "linear",
    snapCornerAnticipation: 0.4,
    snapCueVisible: false,
    snapCueWidth: 0.5,
    snapCueHeight: 3,
    snapCueRadius: 0,
    snapCueOpacity: 0.6,
    snapCueFadeIn: 0,
    snapCueFadeOut: 1000,
    snapCueGrowDuration: 320,
    snapCueStartScale: 0,
    snapCueStartLength: 0,
    snapCueEndLength: 256,
    snapCueGrowthCurve: "smooth",
    snapCueColorMode: "custom",
    snapCueGradientAngle: 360,
    snapCueFromColor: "#aabbcc",
    snapCueToColor: "#112233",
    playPinVisible: false,
    playPinWidth: 8,
    playPinHeadSize: 3,
    playPinColor: "#ff9900",
  };
  const workspace = PlaygroundSchema.parse({ version: 1, tiles: [], ui });
  const restored = PlaygroundSchema.parse(
    JSON.parse(JSON.stringify(workspace)),
  );
  for (const [key, value] of Object.entries(ui))
    assert.equal(restored.ui?.[key as keyof typeof ui], value);

  for (const invalid of [
    { clipGap: -1 },
    { snapDistance: 3 },
    { snapSettleDuration: 1001 },
    { snapCornerDuration: -1 },
    { snapEase: "spring" },
    { snapCornerAnticipation: 1.1 },
    { snapCueVisible: "true" },
    { snapCueWidth: 0.4 },
    { snapCueWidth: 32.1 },
    { snapCueHeight: 3.1 },
    { snapCueRadius: 13 },
    { snapCueOpacity: -0.1 },
    { snapCueFadeIn: Infinity },
    { snapCueFadeOut: -1 },
    { snapCueGrowDuration: 1001 },
    { snapCueStartScale: 1.1 },
    { snapCueStartLength: -1 },
    { snapCueEndLength: 256.1 },
    { snapCueStartLength: 50, snapCueEndLength: 40 },
    { snapCueEndLength: Infinity },
    { snapCueGrowthCurve: "spring" },
    { snapCueGradientAngle: -1 },
    { snapCueGradientAngle: 361 },
    { snapCueColorMode: "palette" },
    { snapCueFromColor: "#fff" },
    { snapCueToColor: "red" },
    { playPinVisible: "false" },
    { playPinWidth: 8.1 },
    { playPinHeadSize: 2 },
    { playPinColor: "#ffffff80" },
  ])
    assert.equal(WorkspaceUISchema.safeParse(invalid).success, false);
});

test("legacy snap line lengths migrate to pixels and explicit lengths remain independent of box height", () => {
  for (const [input, lengths] of [
    [{ clipHeight: 32 }, [9.6, 38.4]],
    [{ clipHeight: 40 }, [12, 48]],
    [{ snapCueHeight: 2 }, [16, 64]],
    [{ snapCueStartScale: 0.5 }, [19.2, 38.4]],
    [{ snapCueStartScale: 0.5, snapCueEndLength: 90 }, [19.2, 90]],
    [{ snapCueHeight: 2, snapCueStartLength: 5 }, [5, 64]],
  ] as const) {
    const migrated = WorkspaceUISchema.parse(input);
    assert.deepEqual(
      [migrated.snapCueStartLength, migrated.snapCueEndLength],
      lengths,
    );
  }
  const legacy = WorkspaceUISchema.parse({
    clipHeight: 40,
    snapCueHeight: 2,
    snapCueStartScale: 0.5,
  });
  assert.deepEqual(
    [legacy.snapCueStartLength, legacy.snapCueEndLength],
    [40, 80],
  );
  const serialized = JSON.parse(JSON.stringify(legacy));
  const resized = WorkspaceUISchema.parse({
    ...serialized,
    clipHeight: 64,
    snapCueHeight: 3,
    snapCueStartScale: 0,
  });
  assert.deepEqual(
    [resized.snapCueStartLength, resized.snapCueEndLength],
    [40, 80],
    "saved pixel lengths do not follow later changes to legacy proportions",
  );
  const explicit = WorkspaceUISchema.parse({
    clipHeight: 64,
    snapCueHeight: 3,
    snapCueStartScale: 1,
    snapCueStartLength: 5,
    snapCueEndLength: 15,
    snapCueGradientAngle: 0,
    snapCueWidth: 32,
  });
  assert.deepEqual(
    [
      explicit.snapCueStartLength,
      explicit.snapCueEndLength,
      explicit.snapCueGradientAngle,
      explicit.snapCueWidth,
    ],
    [5, 15, 0, 32],
  );
  const sameLength = WorkspaceUISchema.parse({
    snapCueStartLength: 0,
    snapCueEndLength: 0,
  });
  assert.equal(sameLength.snapCueEndLength, 0);
});

test("resetting snapping preserves every box, play pin, View, and Library control", () => {
  const current = WorkspaceUISchema.parse({
    clipHeight: 44,
    clipRadius: 12,
    clipFontSize: 16,
    clipTagVisible: true,
    clipGap: 16,
    snapDistance: 80,
    snapCueStartLength: 25,
    snapCueEndLength: 200,
    snapCueGradientAngle: 270,
    snapCueWidth: 20,
    snapCueGrowthCurve: "easeIn",
    snapCueFromColor: "#aabbcc",
    snapEase: "linear",
    playPinWidth: 5,
    playPinVisible: false,
    rowGap: 50,
    switchFontSize: 20,
  });
  const before = structuredClone(current);
  const defaults = WorkspaceUISchema.parse({});
  const reset = resetWorkspaceSnapUI(current);
  assert.deepEqual(
    [
      reset.snapCueGradientAngle,
      reset.snapCueStartLength,
      reset.snapCueEndLength,
    ],
    [143, 12.2, 45.2],
    "reset restores the approved lengths even when box height is customized",
  );
  for (const key of Object.keys(defaults) as (keyof typeof defaults)[]) {
    const resets = key === "clipGap" || key.startsWith("snap");
    assert.equal(
      reset[key],
      resets ? defaults[key] : current[key],
      `${key} ${resets ? "resets" : "is preserved"}`,
    );
  }
  assert.deepEqual(current, before);
  assert.deepEqual(resetWorkspaceSnapUI(), defaults);
});

test("resetting box controls restores all canvas defaults and preserves View, Library, and composition settings", () => {
  const preserved = {
    switchFontSize: 20,
    switchPaddingX: 30,
    switchPaddingY: 18,
    toolbarScale: 1.2,
    toolbarLineHeight: 1.8,
    labelFontSize: 18,
    labelLineHeight: 1.9,
    versionGap: 29,
    versionOpacity: 0.2,
    cardPadding: 25,
    columnGap: 33,
    rowGap: 47,
    libraryPadding: 48,
  };
  const changed = {
    clipFontSize: 15,
    clipHeight: 44,
    clipPadding: 20,
    clipWidthMode: "uniform",
    clipWidthBase: 250,
    clipWidthPerSecond: 30,
    clipMinWidth: 100,
    clipMaxWidth: 500,
    clipUniformWidth: 400,
    clipColorMode: "uniform",
    clipFillColor: "#112233",
    clipTextColor: "#aabbcc",
    clipRadius: 12,
    clipBorderWidth: 3,
    clipBorderColor: "#112233",
    clipBorderOpacity: 0.3,
    clipTitleWeight: "700",
    clipTitleLineHeight: 1.8,
    clipTitleLetterSpacing: 2,
    clipLayoutAlign: "right",
    clipVerticalAlign: "end",
    clipPaddingY: 6,
    clipItemGap: 20,
    clipTagGap: 4,
    clipDurationFontSize: 18,
    clipDurationOpacity: 0.3,
    clipDurationWeight: "600",
    clipTagVisible: true,
    clipTagFontSize: 16,
    clipTagWeight: "400",
    clipTagPaddingX: 10,
    clipTagPaddingY: 8,
    clipTagRadius: 8,
    clipTagFill: "#112233",
    clipTagFillOpacity: 0.8,
    clipTagColorMode: "custom",
    clipTagTextColor: "#aabbcc",
    clipTagTextOpacity: 0.3,
    clipTagBorderWidth: 2,
    clipTagBorderColor: "#112233",
    clipTagBorderOpacity: 0.3,
    clipTagLetterSpacing: 2,
    clipGap: 12,
    snapDistance: 64,
    snapSettleDuration: 400,
    snapCornerDuration: 500,
    snapEase: "linear",
    snapCornerAnticipation: 0.3,
    snapCueVisible: false,
    snapCueWidth: 5,
    snapCueHeight: 2,
    snapCueRadius: 6,
    snapCueOpacity: 0.3,
    snapCueFadeIn: 400,
    snapCueFadeOut: 500,
    snapCueGrowDuration: 600,
    snapCueStartScale: 0.6,
    snapCueStartLength: 20,
    snapCueEndLength: 90,
    snapCueGrowthCurve: "smooth",
    snapCueColorMode: "custom",
    snapCueGradientAngle: 180,
    snapCueFromColor: "#112233",
    snapCueToColor: "#aabbcc",
    playPinVisible: false,
    playPinWidth: 5,
    playPinHeadSize: 10,
    playPinColor: "#112233",
  };
  const workspace = PlaygroundSchema.parse({
    version: 1,
    tiles: [{ sceneId: "a", x: 40, y: 60 }],
    ui: { ...preserved, ...changed },
    compositions: {
      a: {
        title: "Final cut",
        version: 3,
        clipWidth: 512,
        clipColor: "#8c51fe",
      },
    },
  });
  const before = structuredClone(workspace);
  const defaults = WorkspaceUISchema.parse({});
  const reset = resetWorkspaceBoxUI(workspace.ui);
  const boxKeys = Object.keys(defaults).filter((key) =>
    /^(clip|snap|playPin)/.test(key),
  );
  assert.deepEqual(Object.keys(changed).sort(), boxKeys.sort());
  for (const key of boxKeys) {
    const field = key as keyof typeof defaults;
    assert.notEqual(
      workspace.ui?.[field],
      defaults[field],
      `${key} was customized`,
    );
    assert.equal(
      reset[field],
      defaults[field],
      `${key} resets to its schema default`,
    );
  }
  assert.equal(Object.keys(preserved).length, 13);
  for (const [key, value] of Object.entries(preserved))
    assert.equal(
      reset[key as keyof typeof reset],
      value,
      `${key} remains unchanged`,
    );
  assert.deepEqual(workspace, before);
  assert.deepEqual(resetWorkspaceBoxUI(), defaults);
});
