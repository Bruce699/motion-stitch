type TrackColor = { id: string; color: string; parentId?: string };

/** Group hue is inherited visually; saved track colors remain untouched. */
export function timelineColor(track: TrackColor, tracks: readonly TrackColor[]) {
  let root = track;
  let depth = 0;
  const visited = new Set([track.id]);
  while (root.parentId) {
    const parent = tracks.find((item) => item.id === root.parentId);
    if (!parent || visited.has(parent.id)) break;
    visited.add(parent.id);
    root = parent;
    depth++;
  }
  if (!depth) return track.color;
  // Each level adds 22% tint, capped so deeply nested tracks stay legible.
  const colorPercent = Math.max(45, 100 * 0.78 ** depth).toFixed(2);
  return `color-mix(in srgb, ${root.color} ${colorPercent}%, var(--tilt-timeline-child-tint))`;
}
