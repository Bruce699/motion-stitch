import {
  playgroundChain,
  samplePlaygroundChain,
  type PlaygroundDocument,
  type PlaygroundScene,
} from "./playground";

/** The next cut has priority; retain the preceding cut for backward scrubbing. */
export function playgroundPreviewNeighbors(
  document: PlaygroundDocument,
  scenes: readonly PlaygroundScene[],
  head: string,
  time: number,
): { sceneId: string; time: number }[] {
  const sample = samplePlaygroundChain(document, scenes, head, time);
  if (!sample) return [];
  const catalog = new Map(scenes.map((scene) => [scene.id, scene]));
  const chain = playgroundChain(document, head)
    .map((id) => catalog.get(id))
    .filter((scene): scene is PlaygroundScene =>
      Boolean(scene && Number.isFinite(scene.duration) && scene.duration > 0),
    );
  if (chain.length < 2) return [];
  const next = chain[(sample.index + 1) % chain.length];
  const previous = chain[(sample.index + chain.length - 1) % chain.length];
  return [
    { sceneId: next.id, time: 0 },
    ...(previous.id === next.id
      ? []
      : [
          {
            sceneId: previous.id,
            time: Math.max(0, previous.duration - 1 / 60),
          },
        ]),
  ];
}
