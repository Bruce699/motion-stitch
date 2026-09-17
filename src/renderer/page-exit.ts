/** Only final authored lens values cross the page-exit boundary. The runtime
 * closes this viewer's gesture after saving, even if its event stream closed first.
 */
import {
  ViewerExitPatchSchema,
  type ViewerExitPatch,
} from "../core/viewer-exit";
export type PageExitPatch = ViewerExitPatch;
export type PageExitProvider = () =>
  PageExitPatch | readonly PageExitPatch[] | undefined;

export function collectPageExitPatches(
  providers: Iterable<PageExitProvider>,
): PageExitPatch[] {
  const scenes = new Map<string, PageExitPatch>();
  for (const provider of providers) {
    // One failed/unmounted control must not suppress another control's final value.
    let supplied: ReturnType<PageExitProvider>;
    try {
      supplied = provider();
    } catch {
      continue;
    }
    for (const command of supplied === undefined
      ? []
      : Array.isArray(supplied)
        ? supplied
        : [supplied]) {
      const result = ViewerExitPatchSchema.safeParse(command);
      if (!result.success) continue;
      const patch = result.data.patch.depthOfField;
      const previous = scenes.get(command.sceneId);
      scenes.set(command.sceneId, {
        sceneId: command.sceneId,
        patch: { depthOfField: { ...previous?.patch.depthOfField, ...patch } },
      });
    }
  }
  return [...scenes.values()];
}

/** Start one keepalive request synchronously during pagehide. Never retry: a
 * rejected network promise does not tell us whether the mutation executed.
 */
export function createPageExitPersistence(options: {
  viewId: string;
  send: (init: RequestInit) => Promise<Pick<Response, "ok" | "status">>;
  close: () => void;
}) {
  const providers = new Set<PageExitProvider>();
  let pending: Promise<void> | undefined;
  return {
    register(provider: PageExitProvider) {
      providers.add(provider);
      return () => {
        providers.delete(provider);
      };
    },
    finish() {
      if (pending) return pending;
      try {
        const patches = collectPageExitPatches(providers);
        const body = JSON.stringify({
          type: "viewer_exit",
          viewId: options.viewId,
          patches,
        });
        // Fetch keepalive shares a browser-wide 64 KiB budget. A lens payload is
        // normally under 1 KiB; reject abnormal input instead of losing it silently.
        if (new TextEncoder().encode(body).byteLength > 60000)
          throw new Error("Page-exit state is too large");
        pending = options
          .send({
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
          })
          .then((response) => {
            if (!response.ok)
              throw new Error(
                `Could not save final camera state (${response.status})`,
              );
          })
          .finally(options.close);
      } catch (error) {
        options.close();
        pending = Promise.reject(error);
      }
      return pending;
    },
  };
}
