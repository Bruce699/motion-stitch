import { withCameraPatch } from "../core/camera";
import type { SceneDocument } from "../core/schema";
import type { ViewerExitPatch } from "../core/viewer-exit";

export type LensField = "focusPlane" | "blur";
export type LensPreview = {
  change: (field: LensField, value: number) => number;
  settled: (ticket: number) => Promise<void>;
};

/** Temporary gesture values. Files remain authoritative after the gesture settles. */
export class CameraGestureDraft {
  private sequence = 0;
  private entries = new Map<
    LensField,
    { sceneId: string; value: number; ticket: number }
  >();

  change(sceneId: string, field: LensField, value: number) {
    const ticket = ++this.sequence;
    this.entries.set(field, { sceneId, value, ticket });
    return ticket;
  }
  settle(ticket: number) {
    for (const [field, entry] of this.entries)
      if (entry.ticket === ticket) this.entries.delete(field);
  }
  clear() {
    this.entries.clear();
  }
  has(sceneId: string) {
    return [...this.entries.values()].some(
      (entry) => entry.sceneId === sceneId,
    );
  }
  exitPatches(): ViewerExitPatch[] {
    const scenes = new Map<string, ViewerExitPatch>();
    for (const [field, entry] of this.entries) {
      const patch = scenes.get(entry.sceneId) ?? {
        sceneId: entry.sceneId,
        patch: { depthOfField: {} },
      };
      patch.patch.depthOfField[field] = entry.value;
      scenes.set(entry.sceneId, patch);
    }
    return [...scenes.values()];
  }
  apply(document: SceneDocument): SceneDocument {
    const patch: Partial<Record<LensField, number>> = {};
    for (const [field, entry] of this.entries)
      if (entry.sceneId === document.id) patch[field] = entry.value;
    return Object.keys(patch).length
      ? {
          ...document,
          camera: withCameraPatch(document.camera, { depthOfField: patch }),
        }
      : document;
  }
}
