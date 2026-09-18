import { z } from "zod";
import { CompositionClipSchema } from "./compositions";
import { CameraSettingsSchema } from "./camera";
import { SourceQualitySchema } from "./quality";
import { RenderMetricsSchema } from "./render-metrics";
import { SourceStatusSchema } from "./source-status";
export const InspectionSchema = z.object({
  zoom: z.number().min(0.1).max(12),
  panX: z.number().finite(),
  panY: z.number().finite(),
  orbitX: z.number().finite(),
  orbitY: z.number().finite(),
  orbitZ: z.number().finite().default(0),
  alignment: z.literal("front").optional(),
});
export type Inspection = z.infer<typeof InspectionSchema>;
export const defaultInspection = (): Inspection => ({
  zoom: 1,
  panX: 0,
  panY: 0,
  orbitX: 0,
  orbitY: 0,
  orbitZ: 0,
});
export const TimelineContextSchema = z
  .object({
    start: z.number().finite().min(0),
    end: z.number().finite().min(0),
    zoom: z.number().finite().min(1),
    expandedTrackIds: z.array(z.string()).default([]),
  })
  .refine((value) => value.end >= value.start, "Timeline range is reversed");
export type TimelineContext = z.infer<typeof TimelineContextSchema>;
export const ViewStateSchema = z.object({
  sceneId: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().max(80).default("Browser"),
  requestedTime: z.number().finite().min(0),
  presentedTime: z.number().finite().min(0),
  playing: z.boolean(),
  duration: z.number().finite().min(0).optional(),
  fps: z.number().finite().positive().optional(),
  timeline: TimelineContextSchema.optional(),
  selectedClips: z.array(CompositionClipSchema).default([]),
  selectedTracks: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        kind: z.string(),
        start: z.number(),
        end: z.number(),
        parentId: z.string().optional(),
        parameterKeys: z.array(z.string()),
        targets: z.array(z.record(z.string(), z.unknown())),
      }),
    )
    .default([]),
  mode: z.enum(["source", "camera"]),
  camera: CameraSettingsSchema.optional(),
  cameraId: z.string().optional(),
  sourceQuality: z.array(SourceQualitySchema).optional(),
  renderMetrics: RenderMetricsSchema.optional(),
  sourceStatus: z.array(SourceStatusSchema).optional(),
  outputSize: z.object({ width: z.number(), height: z.number() }).optional(),
  previewSize: z.object({ width: z.number(), height: z.number() }).optional(),
  sourceId: z.string().nullable().default(null),
  selection: z.array(z.string().max(200)).max(100),
  ready: z.boolean(),
  error: z.string().max(3000).nullable(),
  documentRevision: z.string(),
  displayedRevision: z.string().nullable(),
  dependencyRevision: z.string().optional(),
  displayedDependencyRevision: z.string().optional(),
  viewport: z.object({
    width: z.number().int().min(0).max(20000),
    height: z.number().int().min(0).max(20000),
  }),
  sourceRoutes: z
    .array(z.object({ id: z.string(), route: z.string().max(2000) }))
    .default([]),
  layers: z
    .array(
      z.object({
        sourceId: z.string(),
        id: z.string(),
        parentId: z.string().nullable(),
        visible: z.boolean(),
        bounds: z
          .object({
            x: z.number(),
            y: z.number(),
            width: z.number(),
            height: z.number(),
          })
          .nullable(),
        position: z.array(z.number()).length(3),
        rotation: z.array(z.number()).length(3),
        scale: z.array(z.number()).length(3),
      }),
    )
    .default([]),
  layerWarnings: z.array(z.string()).default([]),
  focused: z.boolean(),
  visible: z.boolean(),
  inspection: InspectionSchema.default(defaultInspection),
});
export type ViewState = z.infer<typeof ViewStateSchema>;
export type ViewContext = ViewState & {
  version: 1;
  viewId: string;
  connected: boolean;
  updatedAt: string;
  lastInteractionAt: string;
  sourceRoutes: { id: string; route: string }[];
};
export type ViewRequest = {
  id: string;
  type: string;
  time?: number;
  mode?: "source" | "camera";
  sourceId?: string;
  sceneId?: string;
  trackId?: string | null;
  cameraId?: string;
  revision?: string;
  timeoutMs?: number;
};
