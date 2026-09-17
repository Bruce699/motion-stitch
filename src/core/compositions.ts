import { z } from "zod";
import { CameraSettingsSchema, defaultCamera } from "./camera";
import { TRACK_COLORS } from "./track-colors";
import { ParameterValueSchema, withParameterValue } from "./parameters";
import type { SceneDocument } from "./schema";

const id = z.string().regex(/^[a-zA-Z][\w-]*$/);
export const CompositionClipSchema = z.object({
  id,
  compositionId: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1).max(100),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default(TRACK_COLORS.teal),
  start: z.number().finite().min(0),
  end: z.number().finite().min(0),
  sourceIn: z.number().finite().min(0),
  speed: z.number().finite().positive().max(100).default(1),
  cameraId: id.optional(),
  overrides: z.record(id, ParameterValueSchema).default({}),
  bindings: z.record(id, id).default({}),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  scale: z.number().finite().positive().default(1),
  opacity: z.number().min(0).max(1).default(1),
});
export type CompositionClip = z.infer<typeof CompositionClipSchema>;
export const NamedCameraSchema = z.object({
  id: id.refine((value) => value !== "main", "main is the original camera"),
  name: z.string().min(1).max(100),
  settings: CameraSettingsSchema,
});
export type PreparedComposition = {
  scene: SceneDocument;
  url: string;
  revision: string;
  codeRevision: number;
};
export type CompositionGraph = Record<string, PreparedComposition>;

export function compositionCameras(doc: SceneDocument) {
  return [
    {
      id: "main",
      name: doc.cameraName ?? "Camera 1",
      settings: doc.camera ?? defaultCamera(),
    },
    ...(doc.cameras ?? []),
  ];
}
export function cameraDocument(
  doc: SceneDocument,
  cameraId = doc.defaultCameraId ?? "main",
) {
  const camera = compositionCameras(doc).find(
    (camera) => camera.id === cameraId,
  );
  if (!camera) throw new Error(`Unknown camera ${cameraId} in ${doc.name}`);
  return { ...doc, camera: camera.settings };
}
export function sourceTime(clip: CompositionClip, time: number) {
  return clip.sourceIn + (time - clip.start) * clip.speed;
}
export function clipDocument(
  source: SceneDocument,
  clip: CompositionClip,
  parent: SceneDocument,
) {
  const doc = cameraDocument(
    source,
    clip.cameraId ?? source.defaultCameraId ?? "main",
  );
  doc.parameters = { ...source.parameters };
  const overrides = { ...clip.overrides };
  for (const [key, binding] of Object.entries(clip.bindings)) {
    const parameter = parent.parameters[binding];
    if (!parameter) throw new Error(`Missing exposed control ${binding}`);
    overrides[key] = parameter.value;
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (!source.exposedParameters?.includes(key))
      throw new Error(`${source.name} does not expose ${key}`);
    doc.parameters[key] = withParameterValue(source.parameters[key], value);
  }
  return doc;
}
/** A split preserves both source time and overrides; the right half never restarts. */
export function splitClip(
  clip: CompositionClip,
  time: number,
  rightId: string,
): [CompositionClip, CompositionClip] {
  if (time <= clip.start || time >= clip.end)
    throw new Error("Split inside the clip");
  return [
    { ...structuredClone(clip), end: time },
    {
      ...structuredClone(clip),
      id: rightId,
      start: time,
      sourceIn: sourceTime(clip, time),
    },
  ];
}
/** Moving preserves sourceIn; trimming the left edge advances it. No implicit stretching. */
export function trimClip(
  clip: CompositionClip,
  start: number,
  end: number,
): CompositionClip {
  const moving = Math.abs(end - start - (clip.end - clip.start)) < 1e-8;
  return {
    ...clip,
    start,
    end,
    sourceIn: moving ? clip.sourceIn : sourceTime(clip, start),
  };
}
export function validateCompositionGraph(
  rootId: string,
  documents: Record<string, SceneDocument>,
) {
  const visiting = new Set<string>(),
    visited = new Set<string>();
  const visit = (id: string) => {
    if (visiting.has(id))
      throw new Error(
        "Compositions cannot contain themselves: " +
          [...visiting, id].join(" → "),
      );
    if (visited.has(id)) return;
    const doc = documents[id];
    if (!doc) throw new Error(`Missing composition ${id}`);
    visiting.add(id);
    for (const clip of doc.clips ?? []) {
      visit(clip.compositionId);
      const child = documents[clip.compositionId];
      if (sourceTime(clip, clip.end) > child.duration + 1e-8)
        throw new Error(
          `${clip.label}: source range exceeds ${child.name}'s duration`,
        );
      clipDocument(child, clip, doc);
    }
    visiting.delete(id);
    visited.add(id);
  };
  visit(rootId);
}
