import React, { useSyncExternalStore, type ComponentProps } from "react";
import { Timeline } from "./vendor/dialkit/Timeline";
import type { PlayheadStore } from "./playhead-store";

export function LiveTimeline({
  playhead,
  ...props
}: Omit<ComponentProps<typeof Timeline>, "time"> & {
  playhead: PlayheadStore;
}) {
  const time = useSyncExternalStore(playhead.subscribe, playhead.getSnapshot);
  return <Timeline {...props} time={time} />;
}
export function LiveTimecode({
  playhead,
  fps,
  format,
}: {
  playhead: PlayheadStore;
  fps: number;
  format: (time: number, fps: number) => string;
}) {
  const time = useSyncExternalStore(playhead.subscribe, playhead.getSnapshot);
  return <>{format(time, fps)}</>;
}
