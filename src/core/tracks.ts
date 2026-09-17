import { z } from "zod";

export const TrackSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  start: z.number().finite().min(0),
  end: z.number().finite().min(0),
  keys: z.array(z.number().finite().min(0)).default([]),
  parameterKeys: z.array(z.string()).default([]),
  kind: z.enum(["animation", "group"]).optional(),
  parentId: z.string().min(1).optional(),
  durationLabel: z.string().min(1).max(100).optional(),
  targets: z
    .array(
      z.discriminatedUnion("kind", [
        z.object({
          kind: z.literal("layer"),
          sourceId: z.string(),
          layerId: z.string(),
        }),
        z.object({ kind: z.literal("camera"), id: z.string().optional() }),
        z.object({ kind: z.literal("object"), id: z.string().min(1) }),
      ]),
    )
    .optional(),
});
export type Track = z.infer<typeof TrackSchema>;
export type TrackTiming = Pick<Track, "start" | "end">;
const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

/** Absolute, frame-snapped edits; grab offsets do not accumulate rounding errors. */
export function dragTrack(
  track: TrackTiming,
  mode: "move" | "start" | "end",
  delta: number,
  duration: number,
  fps: number,
): TrackTiming {
  const snap = (v: number) => Math.round(v * fps) / fps;
  const minimum = 1 / fps;
  if (mode === "start")
    return {
      start: clamp(snap(track.start + delta), 0, track.end - minimum),
      end: track.end,
    };
  if (mode === "end")
    return {
      start: track.start,
      end: clamp(snap(track.end + delta), track.start + minimum, duration),
    };
  const start = clamp(
    snap(track.start + delta),
    0,
    duration - (track.end - track.start),
  );
  return { start, end: start + track.end - track.start };
}

/** File order orders siblings; hierarchy, not array adjacency, defines membership. */
export function trackRows<T extends { id: string; parentId?: string }>(
  tracks: T[],
  expanded: ReadonlySet<string>,
): { track: T; depth: number }[] {
  const rows: { track: T; depth: number }[] = [];
  const visit = (parentId: string | undefined, depth: number) => {
    for (const track of tracks.filter((t) => t.parentId === parentId)) {
      rows.push({ track, depth });
      if (expanded.has(track.id)) visit(track.id, depth + 1);
    }
  };
  visit(undefined, 0);
  return rows;
}

/** Move/scale the entire subtree in a single document edit. Children remain absolute seconds. */
export function retimeTracks(
  tracks: Track[],
  id: string,
  timing: TrackTiming,
  duration: number,
): Track[] {
  const root = tracks.find((t) => t.id === id);
  if (!root) throw new Error("Unknown track");
  const parent = tracks.find((t) => t.id === root.parentId);
  if (parent && (timing.start < parent.start || timing.end > parent.end))
    throw new Error("Animation timing must stay inside its group");
  const updated = withTrackTiming(root, timing, duration);
  const members = new Set([id]);
  for (let size = -1; size !== members.size;) {
    size = members.size;
    for (const t of tracks)
      if (t.parentId && members.has(t.parentId)) members.add(t.id);
  }
  const scale = (updated.end - updated.start) / (root.end - root.start);
  const mapTime = (time: number) =>
    clamp(
      updated.start + (time - root.start) * scale,
      updated.start,
      updated.end,
    );
  return tracks.map((t) =>
    t.id === id
      ? updated
      : members.has(t.id)
        ? withTrackTiming(
            t,
            { start: mapTime(t.start), end: mapTime(t.end) },
            duration,
          )
        : t,
  );
}

export function withTrackTiming(
  track: Track,
  timing: TrackTiming,
  duration: number,
): Track {
  const { start, end } = z
    .object({
      start: z.number().finite().min(0),
      end: z.number().finite().min(0),
    })
    .strict()
    .parse(timing);
  if (end <= start || end > duration)
    throw new Error("Track timing must stay inside the scene");
  const scale = (end - start) / (track.end - track.start);
  return {
    ...track,
    start,
    end,
    keys: track.keys.map((key) =>
      Math.max(start, Math.min(end, start + (key - track.start) * scale)),
    ),
  };
}
