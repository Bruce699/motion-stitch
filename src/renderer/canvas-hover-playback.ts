type HoverClip = { id: string; duration: number };

/** One absolute clock chooses exactly one moving card in the hovered sequence. */
export function sampleCanvasHoverSequence(
  clips: readonly HoverClip[],
  time: number,
) {
  const durations = clips.map((clip) => Math.max(0, clip.duration));
  const duration = durations.reduce((sum, value) => sum + value, 0);
  if (!clips.length || !duration) return undefined;
  const at = ((Math.max(0, time) % duration) + duration) % duration;
  let start = 0;
  for (let index = 0; index < clips.length; index++) {
    const end = start + durations[index];
    if (at < end) {
      return {
        index,
        sceneId: clips[index].id,
        sourceTime: at - start,
        duration,
        nextIndex: clips.findIndex(
          (_, candidate) => candidate > index && durations[candidate] > 0,
        ),
      };
    }
    start = end;
  }
  return undefined;
}
