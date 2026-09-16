import { z } from "zod";

export const MAX_CANVAS_EDGE = 4096;
export const MAX_CANVAS_PIXELS = 4096 * 2160;
export const MAX_CAPTURE_EDGE = 8192;
export const MAX_CAPTURE_PIXELS = 32 * 1024 * 1024;
export const CaptureSettingsSchema = z
  .object({
    density: z
      .union([z.literal("auto"), z.number().int().min(1).max(8)])
      .default("auto"),
  })
  .strict();
export type CaptureSettings = z.infer<typeof CaptureSettingsSchema>;
export const SourceQualitySchema = z.object({
  sourceId: z.string(),
  density: z.number().int().min(1).max(8),
  requestedDensity: z.number().int().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  limited: z.boolean(),
});
export type SourceQuality = z.infer<typeof SourceQualitySchema>;

/** CSS layout dimensions never change when capture density changes. */
export function captureQuality(
  size: { width: number; height: number },
  source: { id: string; width: number; height: number },
  capture?: CaptureSettings,
  inspectionZoom = 1,
): SourceQuality {
  const selected = capture?.density ?? "auto";
  // Two samples per output pixel at a full-frame fit; inspection can request more.
  const requestedDensity =
    selected === "auto"
      ? Math.max(
          1,
          Math.ceil(
            2 *
              Math.max(size.width / source.width, size.height / source.height) *
              Math.max(1, inspectionZoom),
          ),
        )
      : selected;
  const limit = Math.max(
    1,
    Math.floor(
      Math.min(
        8,
        MAX_CAPTURE_EDGE / Math.max(source.width, source.height),
        Math.sqrt(MAX_CAPTURE_PIXELS / (source.width * source.height)),
      ),
    ),
  );
  const density = Math.min(requestedDensity, limit);
  return {
    sourceId: source.id,
    density,
    requestedDensity,
    width: source.width * density,
    height: source.height * density,
    limited: density < requestedDensity,
  };
}

export const CANVAS_PRESETS = [
  { label: "720p", width: 1280, height: 720 },
  { label: "1080p", width: 1920, height: 1080 },
  { label: "4K", width: 3840, height: 2160 },
  { label: "Portrait", width: 1080, height: 1920 },
  { label: "Square", width: 2160, height: 2160 },
];
