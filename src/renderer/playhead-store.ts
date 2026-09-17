/** High-frequency transport intent is observed by the playhead/timecode only. */
export function createPlayheadStore(initialTime = 0) {
  let time = initialTime;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => time,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(next: number) {
      if (!Number.isFinite(next) || Object.is(next, time)) return;
      time = next;
      for (const listener of listeners) listener();
    },
  };
}
export type PlayheadStore = ReturnType<typeof createPlayheadStore>;
