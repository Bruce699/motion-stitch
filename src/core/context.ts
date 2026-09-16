import { z } from "zod";
export const InspectionSchema = z.object({
  zoom: z.number().min(0.1).max(12),
  panX: z.number().finite(),
  panY: z.number().finite(),
  orbitX: z.number().finite(),
  orbitY: z.number().finite(),
});
export type Inspection = z.infer<typeof InspectionSchema>;
export const defaultInspection = (): Inspection => ({
  zoom: 1,
  panX: 0,
  panY: 0,
  orbitX: 0,
  orbitY: 0,
});
export const ViewStateSchema = z.object({
  sceneId: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().max(80).default("Browser"),
  requestedTime: z.number().finite().min(0),
  presentedTime: z.number().finite().min(0),
  playing: z.boolean(),
  mode: z.enum(["source", "camera"]),
  sourceId: z.string().nullable().default(null),
  selection: z.array(z.string().max(200)).max(100),
  ready: z.boolean(),
  error: z.string().max(3000).nullable(),
  documentRevision: z.string(),
  displayedRevision: z.string().nullable(),
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
};
