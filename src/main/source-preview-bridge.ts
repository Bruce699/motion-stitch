/** Runs inside the isolated source origin. A transferred port binds this source
 * to its parent viewer; the source never receives the editor API or credentials. */
export function sourcePreviewBridge() {
  let connected = false;
  window.addEventListener("message", async (event) => {
    if (
      connected ||
      event.source !== window.parent ||
      event.data?.type !== "tilt-preview-connect" ||
      !event.ports[0]
    )
      return;
    connected = true;
    const port = event.ports[0];
    let queue = Promise.resolve();
    const ready = (async () => {
      if (document.readyState !== "complete")
        await new Promise<void>((resolve) =>
          window.addEventListener("load", () => resolve(), { once: true }),
        );
      await document.fonts.ready;
      await (window as any).tiltSource?.ready?.();
    })();
    void ready.catch(() => {});
    port.onmessage = ({ data }) => {
      queue = queue.then(async () => {
        try {
          await ready;
          const adapter = (window as any).tiltSource;
          if (data.controlled && typeof adapter?.sample !== "function")
            throw new Error(
              "Controlled source must implement window.tiltSource.sample",
            );
          await adapter?.sample?.({
            time: data.time,
            parameters: data.parameters,
            presentation: "dom",
          });
          for (const animation of document.getAnimations()) {
            animation.pause();
            animation.currentTime = data.time * 1000;
          }
          const route = new URL(location.href);
          route.searchParams.delete("__tilt_preview");
          port.postMessage({
            id: data.id,
            route: route.pathname + route.search + route.hash,
          });
        } catch (error) {
          port.postMessage({ id: data.id, error: String(error) });
        }
      });
    };
    port.start();
  });
}
