/** Protects against stale completions even when a host adapter ignores AbortSignal. */
export function createRequestGate() {
  let current: AbortController | undefined;
  return {
    cancel() { current?.abort(); current = undefined; },
    start() {
      current?.abort();
      const controller = new AbortController();
      current = controller;
      return { signal: controller.signal, isCurrent: () => current === controller && !controller.signal.aborted };
    },
  };
}
