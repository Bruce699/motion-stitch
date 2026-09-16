import { z } from "zod";

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
    sourceId: z
      .string()
      .regex(/^[a-zA-Z][\w-]*$/)
      .optional(),
  })
  .strict();
export type CameraSettings = z.infer<typeof CameraSettingsSchema>;
export const defaultCamera = (): CameraSettings =>
  CameraSettingsSchema.parse({});

const CameraPatchSchema = z
  .object({
    projection: CameraSettingsSchema.shape.projection
      .removeDefault()
      .optional(),
    preset: CameraSettingsSchema.shape.preset.removeDefault().optional(),
    side: CameraSettingsSchema.shape.side.removeDefault().optional(),
    sourceId: CameraSettingsSchema.shape.sourceId,
  })
  .strict();
export function withCameraPatch(
  current: CameraSettings | undefined,
  patch: unknown,
): CameraSettings {
  return CameraSettingsSchema.parse({
    ...current,
    ...CameraPatchSchema.parse(patch),
  });
}
