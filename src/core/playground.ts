import { z } from "zod";
import {
  WorkspaceUISchema,
  CompositionDetailsSchema,
  compositionDetails,
  type WorkspaceUI,
} from "./workspace-display";

/** Project-level arrangement. Scene files remain the authority for clip content. */
export const PlaygroundSchema = z
  .object({
    version: z.literal(1),
    canvasHeight: z.number().finite().min(120).max(2000).default(320),
    tiles: z.array(
      z.object({
        sceneId: z.string().min(1),
        x: z.number().finite().min(0),
        y: z.number().finite().min(0),
        nextId: z.string().min(1).nullable().default(null),
      }),
    ),
    ui: WorkspaceUISchema.optional(),
    compositions: z
      .record(z.string().min(1), CompositionDetailsSchema)
      .optional(),
    marks: z
      .array(
        z.object({
          sceneId: z.string().min(1),
          time: z.number().finite().min(0),
        }),
      )
      .max(1000)
      .optional(),
    tags: z
      .record(
        z.string().min(1),
        z.array(z.string().trim().min(1).max(80)).max(32),
      )
      .optional(),
  })
  .superRefine((document, context) => {
    const tiles = new Map(document.tiles.map((tile) => [tile.sceneId, tile]));
    const incoming = new Set<string>();
    if (tiles.size !== document.tiles.length)
      context.addIssue({
        code: "custom",
        message: "Each composition may appear once on the Playground",
      });
    for (const tile of document.tiles) {
      if (!tile.nextId) continue;
      if (!tiles.has(tile.nextId))
        context.addIssue({
          code: "custom",
          message: `Missing Playground composition ${tile.nextId}`,
        });
      if (incoming.has(tile.nextId))
        context.addIssue({
          code: "custom",
          message: `Composition ${tile.nextId} has more than one predecessor`,
        });
      incoming.add(tile.nextId);
    }
    const complete = new Set<string>();
    for (const tile of document.tiles) {
      const path = new Set<string>();
      let id: string | null = tile.sceneId;
      while (id && tiles.has(id) && !complete.has(id)) {
        if (path.has(id)) {
          context.addIssue({
            code: "custom",
            message: "Playground sequences cannot contain cycles",
          });
          return;
        }
        path.add(id);
        id = tiles.get(id)!.nextId;
      }
      for (const visited of path) complete.add(visited);
    }
  });

export type PlaygroundDocument = z.infer<typeof PlaygroundSchema>;
export type PlaygroundTile = PlaygroundDocument["tiles"][number];
export type PlaygroundScene = { id: string; duration: number };
export const PLAYGROUND_TILE_HEIGHT = 64;
export const PLAYGROUND_TILE_GAP = 0;
export const PLAYGROUND_SNAP_DISTANCE = 26;

const defaultUI = WorkspaceUISchema.parse({});

/** Saved spacing is shared by connected-chain layout and snap targets. */
export function playgroundTileGap(
  workspace?: Pick<PlaygroundDocument, "ui">,
): number {
  return workspace?.ui?.clipGap ?? PLAYGROUND_TILE_GAP;
}

/** Shared display geometry for drawing, snapping and reflowing connected clips. */
export function playgroundTileWidth(
  duration: number,
  workspace?: Pick<PlaygroundDocument, "ui" | "compositions">,
  sceneId?: string,
): number {
  const customWidth = sceneId
    ? workspace?.compositions?.[sceneId]?.clipWidth
    : undefined;
  if (customWidth !== undefined) return customWidth;
  const ui = workspace?.ui ?? defaultUI;
  if (ui.clipWidthMode === "uniform") return ui.clipUniformWidth;
  return Math.min(
    ui.clipMaxWidth,
    Math.max(
      ui.clipMinWidth,
      (Number.isFinite(duration) ? Math.max(0, duration) : 0) *
        ui.clipWidthPerSecond +
        ui.clipWidthBase,
    ),
  );
}

export function createPlayground(
  scenes: readonly PlaygroundScene[],
): PlaygroundDocument {
  return {
    version: 1,
    canvasHeight: 320,
    tiles: scenes.map((scene, index) => ({
      sceneId: scene.id,
      x: 48 + (index % 2) * 400,
      y: 40 + Math.floor(index / 2) * 112,
      nextId: null,
    })),
  };
}

export type PlaygroundBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Disconnect every clip, then arrange scene families in columns. */
export function resetPlaygroundLayout(
  document: PlaygroundDocument,
  scenes: readonly (PlaygroundScene & { name: string })[],
): { document: PlaygroundDocument; bounds: PlaygroundBounds | null } {
  if (!document.tiles.length) return { document, bounds: null };
  const margin = 40;
  const columnGap = 32;
  const rowGap = 16;
  const height = document.ui?.clipHeight ?? defaultUI.clipHeight;
  const tiles = document.tiles.map((tile) => ({ ...tile, nextId: null }));
  const byId = new Map(tiles.map((tile) => [tile.sceneId, tile]));
  const catalog = new Map(scenes.map((scene) => [scene.id, scene]));
  const details = (id: string) =>
    compositionDetails(
      catalog.get(id) ?? { id, name: id },
      document.compositions,
    );
  const width = (id: string) =>
    playgroundTileWidth(catalog.get(id)?.duration ?? 0, document, id);

  // Catalog order is stable even after dragging. Retain any not-yet-refreshed
  // tiles as well; arranging the canvas must not delete content or metadata.
  const orderedIds = [
    ...scenes.map((scene) => scene.id).filter((id) => byId.has(id)),
    ...tiles.map((tile) => tile.sceneId).filter((id) => !catalog.has(id)),
  ];
  const visited = new Set<string>();
  const families = new Map<string, string[]>();
  for (const id of orderedIds) {
    if (visited.has(id)) continue;
    visited.add(id);
    const key = details(id).sceneName;
    const family = families.get(key) ?? [];
    family.push(id);
    families.set(key, family);
  }

  let x = margin;
  let right = margin;
  let bottom = margin;
  for (const family of families.values()) {
    let familyWidth = 0;
    for (const [row, id] of family.entries()) {
      const y = margin + row * (height + rowGap);
      const tile = byId.get(id)!;
      tile.x = x;
      tile.y = y;
      familyWidth = Math.max(familyWidth, width(id));
      bottom = Math.max(bottom, y + height);
    }
    right = x + familyWidth;
    x = right + columnGap;
  }

  return {
    document: { ...document, tiles },
    bounds: {
      x: margin,
      y: margin,
      width: right - margin,
      height: bottom - margin,
    },
  };
}

/** Refresh the catalog without losing arrangements or retaining broken references. */
export function reconcilePlayground(
  document: PlaygroundDocument,
  scenes: readonly PlaygroundScene[],
): PlaygroundDocument {
  const known = new Set(scenes.map((scene) => scene.id));
  const tiles = document.tiles
    .filter((tile) => known.has(tile.sceneId))
    .map((tile) => ({
      ...tile,
      nextId: tile.nextId && known.has(tile.nextId) ? tile.nextId : null,
    }));
  const present = new Set(tiles.map((tile) => tile.sceneId));
  const added = createPlayground(
    scenes.filter((scene) => !present.has(scene.id)),
  ).tiles;
  const bottom = tiles.length
    ? Math.max(...tiles.map((tile) => tile.y)) + 112
    : 40;
  tiles.push(...added.map((tile) => ({ ...tile, y: tile.y - 40 + bottom })));
  const result = { ...document, tiles };
  if (document.tags)
    result.tags = Object.fromEntries(
      Object.entries(document.tags).filter(([id]) => known.has(id)),
    );
  if (document.compositions)
    result.compositions = Object.fromEntries(
      Object.entries(document.compositions).filter(([id]) => known.has(id)),
    );
  if (document.marks)
    result.marks = document.marks
      .filter((mark) => known.has(mark.sceneId))
      .map((mark) => ({
        ...mark,
        time: Math.min(
          mark.time,
          scenes.find((scene) => scene.id === mark.sceneId)!.duration,
        ),
      }));
  // Duration, display width and per-clip edits keep existing joins touching.
  const incoming = new Set(tiles.map((tile) => tile.nextId));
  const byId = new Map(tiles.map((tile) => [tile.sceneId, tile]));
  const durations = new Map(scenes.map((scene) => [scene.id, scene.duration]));
  for (const head of tiles.filter((tile) => !incoming.has(tile.sceneId))) {
    let current = head;
    const visited = new Set<string>();
    while (current.nextId && !visited.has(current.sceneId)) {
      visited.add(current.sceneId);
      const next = byId.get(current.nextId);
      if (!next) break;
      next.x =
        current.x +
        playgroundTileWidth(
          durations.get(current.sceneId) ?? 0,
          result,
          current.sceneId,
        ) +
        playgroundTileGap(result);
      next.y = current.y;
      current = next;
    }
  }
  return result;
}

function suffix(document: PlaygroundDocument, id: string): string[] {
  const tiles = new Map(document.tiles.map((tile) => [tile.sceneId, tile]));
  const result: string[] = [];
  const visited = new Set<string>();
  let current: string | null = id;
  while (current && tiles.has(current) && !visited.has(current)) {
    visited.add(current);
    result.push(current);
    current = tiles.get(current)!.nextId;
  }
  return result;
}

/** Resolve a tile to its complete sequence, even when the clicked tile is in the middle. */
export function playgroundChain(
  document: PlaygroundDocument,
  id: string,
): string[] {
  if (!document.tiles.some((tile) => tile.sceneId === id)) return [];
  const previous = new Map(
    document.tiles
      .filter((tile) => tile.nextId)
      .map((tile) => [tile.nextId!, tile.sceneId]),
  );
  const visited = new Set<string>();
  let head = id;
  while (previous.has(head) && !visited.has(head)) {
    visited.add(head);
    head = previous.get(head)!;
  }
  return suffix(document, head);
}

/** A head moves its sequence; dragging a later tile pulls off that tile and its suffix. */
export function movePlaygroundTile(
  document: PlaygroundDocument,
  id: string,
  x: number,
  y: number,
): PlaygroundDocument {
  const tile = document.tiles.find((item) => item.sceneId === id);
  if (!tile || !Number.isFinite(x) || !Number.isFinite(y)) return document;
  const moving = new Set(suffix(document, id));
  const dx = Math.max(0, x) - tile.x;
  const dy = Math.max(0, y) - tile.y;
  return {
    ...document,
    tiles: document.tiles.map((item) => ({
      ...item,
      x: moving.has(item.sceneId) ? item.x + dx : item.x,
      y: moving.has(item.sceneId) ? item.y + dy : item.y,
      nextId: item.nextId === id ? null : item.nextId,
    })),
  };
}

export type PlaygroundSnap = {
  movingId: string;
  fromId: string;
  toId: string;
  /** Snapped position of the moving sequence's head. */
  x: number;
  y: number;
  distance: number;
};

/** Cue position in the current gap; y is the midpoint of the two top edges. */
export function playgroundSnapCue(
  document: PlaygroundDocument,
  scenes: readonly PlaygroundScene[],
  snap: PlaygroundSnap | null,
): { x: number; y: number; progress: number } | null {
  if (!snap || snap.fromId === snap.toId) return null;
  const from = document.tiles.find((tile) => tile.sceneId === snap.fromId);
  const to = document.tiles.find((tile) => tile.sceneId === snap.toId);
  if (!from || !to) return null;
  const duration =
    scenes.find((scene) => scene.id === from.sceneId)?.duration ?? 0;
  const right = from.x + playgroundTileWidth(duration, document, from.sceneId);
  return {
    x: (right + to.x) / 2,
    y: (from.y + to.y) / 2,
    progress: Number.isNaN(snap.distance)
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            1 -
              snap.distance /
                (document.ui?.snapDistance ?? PLAYGROUND_SNAP_DISTANCE),
          ),
        ),
  };
}

/** Snap line length follows proximity, independently of how long a drag takes. */
export function playgroundSnapLineLength(
  ui: Pick<
    WorkspaceUI,
    "snapCueStartLength" | "snapCueEndLength" | "snapCueGrowthCurve"
  >,
  progress: number,
): number {
  const proximity = Number.isFinite(progress)
    ? Math.max(0, Math.min(1, progress))
    : 0;
  let growth = proximity;
  if (ui.snapCueGrowthCurve === "easeIn") growth = proximity ** 2;
  else if (ui.snapCueGrowthCurve === "easeOut")
    growth = 1 - (1 - proximity) ** 2;
  else if (ui.snapCueGrowthCurve === "smooth")
    growth = proximity ** 2 * (3 - 2 * proximity);
  return (
    ui.snapCueStartLength +
    (ui.snapCueEndLength - ui.snapCueStartLength) * growth
  );
}

/** Find the closest exposed tail/head pair. Existing sequences never form branches or cycles. */
export function findPlaygroundSnap(
  document: PlaygroundDocument,
  scenes: readonly PlaygroundScene[],
  movingId: string,
  threshold = document.ui?.snapDistance ?? PLAYGROUND_SNAP_DISTANCE,
): PlaygroundSnap | null {
  const moving = suffix(document, movingId);
  if (!moving.length) return null;
  const movingSet = new Set(moving);
  const byId = new Map(document.tiles.map((tile) => [tile.sceneId, tile]));
  const durations = new Map(scenes.map((scene) => [scene.id, scene.duration]));
  const incoming = new Set(
    document.tiles
      .filter((tile) => tile.nextId !== movingId)
      .map((tile) => tile.nextId),
  );
  const head = byId.get(movingId)!;
  const tail = byId.get(moving.at(-1)!)!;
  const tailWidth = playgroundTileWidth(
    durations.get(tail.sceneId) ?? 0,
    document,
    tail.sceneId,
  );
  const candidates: PlaygroundSnap[] = [];
  const gap = playgroundTileGap(document);
  for (const target of document.tiles) {
    if (movingSet.has(target.sceneId)) continue;
    if (!target.nextId || target.nextId === movingId) {
      const x =
        target.x +
        playgroundTileWidth(
          durations.get(target.sceneId) ?? 0,
          document,
          target.sceneId,
        ) +
        gap;
      candidates.push({
        movingId,
        fromId: target.sceneId,
        toId: movingId,
        x,
        y: target.y,
        distance: Math.hypot(head.x - x, head.y - target.y),
      });
    }
    if (!incoming.has(target.sceneId)) {
      const x = head.x + target.x - (tail.x + tailWidth + gap);
      if (x >= 0)
        candidates.push({
          movingId,
          fromId: tail.sceneId,
          toId: target.sceneId,
          x,
          y: target.y,
          distance: Math.hypot(
            tail.x + tailWidth + gap - target.x,
            tail.y - target.y,
          ),
        });
    }
  }
  return (
    candidates
      .filter((candidate) => candidate.distance <= threshold)
      .sort((a, b) => a.distance - b.distance)[0] ?? null
  );
}

export function applyPlaygroundSnap(
  document: PlaygroundDocument,
  scenes: readonly PlaygroundScene[],
  snap: PlaygroundSnap,
): PlaygroundDocument {
  const head = document.tiles.find((tile) => tile.sceneId === snap.movingId);
  if (!head)
    throw new Error("The dragged composition is no longer on the Playground");
  const detached = movePlaygroundTile(document, snap.movingId, head.x, head.y);
  const moving = suffix(detached, snap.movingId);
  const movingSet = new Set(moving);
  const from = detached.tiles.find((tile) => tile.sceneId === snap.fromId);
  const to = detached.tiles.find((tile) => tile.sceneId === snap.toId);
  if (
    !from ||
    !to ||
    from.nextId ||
    detached.tiles.some((tile) => tile.nextId === to.sceneId)
  )
    throw new Error("The snap endpoints are no longer available");
  const append = to.sceneId === snap.movingId && !movingSet.has(from.sceneId);
  const prepend = from.sceneId === moving.at(-1) && !movingSet.has(to.sceneId);
  if (!append && !prepend)
    throw new Error("A sequence cannot be connected to itself");
  const durations = new Map(scenes.map((scene) => [scene.id, scene.duration]));
  const gap = playgroundTileGap(detached);
  const span = moving.reduce(
    (total, id) =>
      total + playgroundTileWidth(durations.get(id) ?? 0, detached, id) + gap,
    0,
  );
  const x = append
    ? from.x +
      playgroundTileWidth(
        durations.get(from.sceneId) ?? 0,
        detached,
        from.sceneId,
      ) +
      gap
    : to.x - span;
  const y = append ? from.y : to.y;
  if (x < 0)
    throw new Error("The sequence would extend outside the Playground");
  const result = movePlaygroundTile(detached, snap.movingId, x, y);
  result.tiles.find((tile) => tile.sceneId === from.sceneId)!.nextId =
    to.sceneId;
  return reconcilePlayground(result, scenes);
}

/** Click replaces selection; Shift-click toggles a sequence, with at most four previews. */
export function selectPlaygroundChain(
  document: PlaygroundDocument,
  current: readonly string[],
  id: string,
  additive: boolean,
): string[] {
  const head = playgroundChain(document, id)[0];
  const selected = [
    ...new Set(
      current
        .map((value) => playgroundChain(document, value)[0])
        .filter((value): value is string => Boolean(value)),
    ),
  ].slice(0, 4);
  if (!head) return selected;
  if (!additive) return [head];
  if (selected.includes(head))
    return selected.filter((value) => value !== head);
  return selected.length < 4 ? [...selected, head] : selected;
}

export function playgroundSequenceDuration(
  document: PlaygroundDocument,
  scenes: readonly PlaygroundScene[],
  id: string,
): number {
  const durations = new Map(scenes.map((scene) => [scene.id, scene.duration]));
  return playgroundChain(document, id).reduce((total, sceneId) => {
    const duration = durations.get(sceneId) ?? 0;
    return total + (Number.isFinite(duration) && duration > 0 ? duration : 0);
  }, 0);
}

export type PlaygroundSample = {
  sceneId: string;
  sourceTime: number;
  sequenceTime: number;
  sequenceDuration: number;
  index: number;
};

/** One absolute clock; cut boundaries belong to the following composition. */
export function samplePlaygroundChain(
  document: PlaygroundDocument,
  scenes: readonly PlaygroundScene[],
  id: string,
  time: number,
  options: { loop?: boolean } = {},
): PlaygroundSample | null {
  if (!Number.isFinite(time)) return null;
  const byId = new Map(scenes.map((scene) => [scene.id, scene]));
  const chain = playgroundChain(document, id)
    .map((sceneId) => byId.get(sceneId))
    .filter((scene): scene is PlaygroundScene =>
      Boolean(scene && Number.isFinite(scene.duration) && scene.duration > 0),
    );
  const sequenceDuration = chain.reduce(
    (total, scene) => total + scene.duration,
    0,
  );
  if (!chain.length || !sequenceDuration) return null;
  const positive = Math.max(0, time);
  const sequenceTime =
    options.loop === false
      ? Math.min(positive, sequenceDuration)
      : positive % sequenceDuration;
  let start = 0;
  for (const [index, scene] of chain.entries()) {
    if (sequenceTime < start + scene.duration || index === chain.length - 1)
      return {
        sceneId: scene.id,
        sourceTime: sequenceTime - start,
        sequenceTime,
        sequenceDuration,
        index,
      };
    start += scene.duration;
  }
  return null;
}

export type PlaygroundPlaybackPin = { sceneId: string; progress: number };

function selectedPlaygroundHeads(
  document: PlaygroundDocument,
  selected: readonly string[],
): string[] {
  return [
    ...new Set(
      selected
        .map((id) => playgroundChain(document, id)[0])
        .filter((id): id is string => Boolean(id)),
    ),
  ].slice(0, 4);
}

/** Playback changes with selected sequences, never with canvas positions or unrelated joins. */
export function playgroundPlaybackKey(
  document: PlaygroundDocument,
  selected: readonly string[],
): string {
  return JSON.stringify(
    selectedPlaygroundHeads(document, selected).map((id) =>
      playgroundChain(document, id),
    ),
  );
}

/** Pins sample the same absolute clock and cuts as the selected video previews. */
export function playgroundPlaybackPins(
  document: PlaygroundDocument,
  scenes: readonly PlaygroundScene[],
  selectedHeads: readonly string[],
  time: number,
): PlaygroundPlaybackPin[] {
  const heads = selectedPlaygroundHeads(document, selectedHeads);
  const durations = new Map(scenes.map((scene) => [scene.id, scene.duration]));
  const pins: PlaygroundPlaybackPin[] = [];
  for (const head of heads) {
    const sample = samplePlaygroundChain(document, scenes, head, time);
    if (!sample) continue;
    const duration = durations.get(sample.sceneId)!;
    pins.push({
      sceneId: sample.sceneId,
      progress: Math.max(0, Math.min(1, sample.sourceTime / duration)),
    });
  }
  return pins;
}

/** Marks refer to source time, so joining or separating clips does not lose them. */
export function markPlaygroundTime(
  document: PlaygroundDocument,
  scenes: readonly PlaygroundScene[],
  selected: readonly string[],
  time: number,
): PlaygroundDocument {
  const marks = [...(document.marks ?? [])];
  for (const id of selected) {
    const sample = samplePlaygroundChain(document, scenes, id, time);
    if (!sample) continue;
    const at = Math.round(sample.sourceTime * 1000) / 1000;
    if (
      !marks.some(
        (mark) =>
          mark.sceneId === sample.sceneId && Math.abs(mark.time - at) < 1 / 60,
      )
    )
      marks.push({ sceneId: sample.sceneId, time: at });
  }
  return { ...document, marks };
}

export function playgroundSequenceMarks(
  document: PlaygroundDocument,
  scenes: readonly PlaygroundScene[],
  id: string,
): { sceneId: string; sourceTime: number; time: number }[] {
  const result: { sceneId: string; sourceTime: number; time: number }[] = [];
  let start = 0;
  for (const sceneId of playgroundChain(document, id)) {
    const duration =
      scenes.find((scene) => scene.id === sceneId)?.duration ?? 0;
    for (const mark of document.marks ?? []) {
      if (mark.sceneId === sceneId && mark.time <= duration)
        result.push({
          sceneId,
          sourceTime: mark.time,
          time: start + mark.time,
        });
    }
    start += duration;
  }
  return result.sort((a, b) => a.time - b.time);
}
