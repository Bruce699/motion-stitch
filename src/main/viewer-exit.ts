import { withCameraPatch } from "../core/camera";
import { ViewerExitSchema } from "../core/viewer-exit";
import type { SceneStore } from "./store";

type ExitStore = Pick<SceneStore, "edit" | "finishGesture">;
/** Viewer IDs are unique per page load. A terminal viewer can never begin a
 * later gesture or overwrite the final exit value with a delayed request.
 */
export class ViewerExitCoordinator {
  private terminal = new Set<string>();
  private requests = new Map<string, Promise<{ savedScenes: string[] }>>();
  isClosed(viewId?: string) {
    return !!viewId && this.terminal.has(viewId);
  }
  assertOpen(viewId?: string) {
    if (this.isClosed(viewId))
      throw new Error("This viewer has closed; refresh before editing");
  }
  finish(
    input: unknown,
    getStore: (sceneId: string) => Promise<ExitStore>,
    finishOpen: (actor: string) => Promise<unknown>,
  ) {
    const command = ViewerExitSchema.parse(input);
    const existing = this.requests.get(command.viewId);
    if (existing) return existing;
    this.terminal.add(command.viewId);
    const pending = (async () => {
      const savedScenes: string[] = [],
        errors: unknown[] = [];
      for (const { sceneId, cameraId, patch } of command.patches) {
        try {
          const store = await getStore(sceneId);
          try {
            await store.edit(
              (doc) => {
                if (!cameraId || cameraId === "main")
                  doc.camera = withCameraPatch(doc.camera, patch);
                else {
                  const camera = doc.cameras?.find(
                    (camera) => camera.id === cameraId,
                  );
                  if (!camera) throw new Error("Unknown camera");
                  camera.settings = withCameraPatch(camera.settings, patch);
                }
              },
              undefined,
              command.viewId,
            );
            savedScenes.push(sceneId);
          } finally {
            await store.finishGesture(command.viewId);
          }
        } catch (error) {
          errors.push(error);
        }
      }
      // Also close a pointer-down that had not changed a value yet.
      try {
        await finishOpen(command.viewId);
      } catch (error) {
        errors.push(error);
      }
      if (errors.length) throw errors[0];
      return { savedScenes };
    })();
    this.requests.set(command.viewId, pending);
    void pending.catch(() => {});
    return pending;
  }
}

export const viewerMutationCommands = new Set([
  "set_track",
  "add_camera",
  "camera_metadata",
  "add_clip",
  "set_clip",
  "trim_clip",
  "split_clip",
  "remove_clip",
  "clip_parameter",
  "expose_parameter",
  "set_camera",
  "set_parameter",
  "set_setting",
  "write_file",
  "replace_scene",
  "edit_begin",
  "edit_apply",
  "edit_cancel",
  "undo",
  "redo",
  "create",
  "export",
]);
