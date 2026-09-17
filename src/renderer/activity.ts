export type RenderActivity = "idle" | "play" | "scrub";

type ActivityEnvironment = {
  hidden: () => boolean;
  playing: () => boolean;
  onVisibilityChange: (listener: () => void) => () => void;
  every?: (listener: () => void, milliseconds: number) => () => void;
};

/** Only visible work renews a render-priority lease. Focus may belong to a sibling pane. */
export function createRenderActivity(
  send: (activity: RenderActivity) => Promise<unknown>,
  environment: ActivityEnvironment,
) {
  let disposed = false;
  let sending = false;
  let pending: RenderActivity | undefined;
  let stopHeartbeat: (() => void) | undefined;
  const every =
    environment.every ??
    ((listener, milliseconds) => {
      const timer = setInterval(listener, milliseconds);
      return () => clearInterval(timer);
    });

  // A delayed play request must finish before the following idle release, never
  // overwrite it. Keep only the latest pending state while that request settles.
  const report = (activity: RenderActivity) => {
    pending = activity;
    if (sending) return;
    void (async () => {
      sending = true;
      while (pending !== undefined) {
        const next = pending;
        pending = undefined;
        try {
          await send(next);
        } catch {
          // Missed leases expire in the worker; activity is not creative state.
        }
      }
      sending = false;
    })();
  };
  const current = (): RenderActivity =>
    !environment.hidden() && environment.playing() ? "play" : "idle";
  const refresh = () => {
    if (disposed) return;
    stopHeartbeat?.();
    stopHeartbeat = undefined;
    report(current());
    if (!environment.hidden() && environment.playing())
      stopHeartbeat = every(() => {
        if (!disposed && !environment.hidden()) report(current());
      }, 1000);
  };
  const removeVisibility = environment.onVisibilityChange(refresh);
  refresh();
  return {
    playbackChanged: refresh,
    scrub() {
      if (!disposed && !environment.hidden()) report("scrub");
    },
    endScrub() {
      if (!disposed && !environment.hidden()) report(current());
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stopHeartbeat?.();
      removeVisibility();
      report("idle");
    },
  };
}
