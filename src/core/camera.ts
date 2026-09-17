import { z } from "zod";

export const DepthOfFieldSchema = z
  .object({
    enabled: z.boolean().default(false),
    // Signed scene-unit offset from the source origin's camera-facing plane.
    // Positive moves focus toward the camera.
    focusPlane: z.number().finite().min(-1000).max(1000).default(0),
    blur: z.number().finite().min(0).max(1).default(0.35),
  })
  .strict();
export type DepthOfFieldSettings = z.infer<typeof DepthOfFieldSchema>;
export const defaultDepthOfField = (): DepthOfFieldSettings =>
  DepthOfFieldSchema.parse({});

/** Named values retain the exact math; degree labels are projected edge angles. */
export const CAMERA_STOPS = {
  front: { label: "Front", elevation: Math.PI / 2, azimuth: 0 },
  diagonal15: {
    label: "15°",
    elevation: Math.asin(Math.tan(Math.PI / 12)),
    azimuth: Math.PI / 4,
  },
  isometric: {
    label: "30°",
    elevation: Math.atan(1 / Math.sqrt(2)),
    azimuth: Math.PI / 4,
  },
  diagonal45: { label: "45°", elevation: Math.PI / 2, azimuth: Math.PI / 4 },
} as const;
export const CameraSettingsSchema = z
  .object({
    projection: z.enum(["perspective", "orthographic"]).default("perspective"),
    preset: z
      .enum(["front", "diagonal15", "isometric", "diagonal45"])
      .default("isometric"),
    side: z.enum(["left", "right"]).default("right"),
    rotation: z.number().finite().min(-180).max(180).optional(),
    elevation: z.number().finite().min(0).max(90).optional(),
    roll: z.number().finite().min(-180).max(180).optional(),
    zoom: z.number().finite().min(0.1).max(12).optional(),
    panX: z.number().finite().optional(),
    panY: z.number().finite().optional(),
    depthOfField: DepthOfFieldSchema.optional(),
    sourceId: z
      .string()
      .regex(/^[a-zA-Z][\w-]*$/)
      .optional(),
  })
  .strict();
export type CameraSettings = z.infer<typeof CameraSettingsSchema>;
export const defaultCamera = (): CameraSettings =>
  CameraSettingsSchema.parse({});

export function cameraAngles(settings: CameraSettings) {
  const stop = CAMERA_STOPS[settings.preset];
  return {
    rotation:
      settings.rotation ??
      ((stop.azimuth * 180) / Math.PI) * (settings.side === "left" ? -1 : 1),
    elevation: settings.elevation ?? (stop.elevation * 180) / Math.PI,
  };
}

const CameraPatchSchema = z
  .object({
    projection: CameraSettingsSchema.shape.projection
      .removeDefault()
      .optional(),
    preset: CameraSettingsSchema.shape.preset.removeDefault().optional(),
    side: CameraSettingsSchema.shape.side.removeDefault().optional(),
    rotation: CameraSettingsSchema.shape.rotation,
    elevation: CameraSettingsSchema.shape.elevation,
    roll: CameraSettingsSchema.shape.roll,
    zoom: CameraSettingsSchema.shape.zoom,
    panX: CameraSettingsSchema.shape.panX,
    panY: CameraSettingsSchema.shape.panY,
    depthOfField: z
      .object({
        enabled: DepthOfFieldSchema.shape.enabled.removeDefault().optional(),
        focusPlane: DepthOfFieldSchema.shape.focusPlane
          .removeDefault()
          .optional(),
        blur: DepthOfFieldSchema.shape.blur.removeDefault().optional(),
      })
      .strict()
      .optional(),
    sourceId: CameraSettingsSchema.shape.sourceId,
  })
  .strict();
export function withCameraPatch(
  current: CameraSettings | undefined,
  patch: unknown,
): CameraSettings {
  const parsed = CameraPatchSchema.parse(patch);
  const next = {
    ...current,
    ...parsed,
    ...(parsed.depthOfField
      ? {
          depthOfField: { ...current?.depthOfField, ...parsed.depthOfField },
        }
      : {}),
  };
  // A named stop restores its exact math, including after a custom angle.
  if (parsed.preset !== undefined) {
    delete next.rotation;
    delete next.elevation;
  } else if (parsed.side !== undefined) delete next.rotation;
  return CameraSettingsSchema.parse(next);
}
