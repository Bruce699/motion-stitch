import { z } from "zod";

export const ReviewOptions = {
  revision: z.string().min(1).optional(),
  compareTo: z.string().uuid().optional(),
  times: z.array(z.number().finite().min(0)).min(1).max(12).optional(),
  focus: z
    .array(z.string().regex(/^[\w-]+\/[\w-]+$/))
    .max(4)
    .default([]),
  cameraId: z.string().min(1).optional(),
  motion: z
    .object({
      start: z.number().finite().min(0),
      end: z.number().finite().min(0),
      fps: z.union([z.literal(30), z.literal(60)]).default(30),
    })
    .strict()
    .refine(
      (v) => v.end > v.start && v.end - v.start <= 4,
      "Motion review must span more than zero and at most four seconds",
    )
    .optional(),
  includeImages: z.boolean().default(false),
};
export const ReviewRequestSchema = z.object(ReviewOptions).strict();
export type ReviewRequest = z.infer<typeof ReviewRequestSchema>;
export type ReviewRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Keep before/after at identical output coordinates; never magnify raster pixels. */
export function detailRect(
  bounds: ReviewRect[],
  width: number,
  height: number,
  cap = 960,
): ReviewRect | null {
  const visible = bounds.filter(
    (b) =>
      b.width > 0 &&
      b.height > 0 &&
      b.x < width &&
      b.y < height &&
      b.x + b.width > 0 &&
      b.y + b.height > 0,
  );
  if (!visible.length) return null;
  const left = Math.max(0, Math.min(...visible.map((b) => b.x)));
  const top = Math.max(0, Math.min(...visible.map((b) => b.y)));
  const right = Math.min(width, Math.max(...visible.map((b) => b.x + b.width)));
  const bottom = Math.min(
    height,
    Math.max(...visible.map((b) => b.y + b.height)),
  );
  const w = Math.min(width, cap, Math.ceil(right - left + 48));
  const h = Math.min(height, cap, Math.ceil(bottom - top + 48));
  return {
    x: Math.max(0, Math.min(width - w, Math.round((left + right - w) / 2))),
    y: Math.max(0, Math.min(height - h, Math.round((top + bottom - h) / 2))),
    width: w,
    height: h,
  };
}

export function reviewTimes(
  times: number[] | undefined,
  duration: number,
  fps: number,
) {
  const result = times ?? [
    0,
    duration * 0.25,
    duration * 0.5,
    Math.max(0, duration - 1 / fps),
  ];
  if (result.some((t) => t < 0 || t > duration || !Number.isFinite(t)))
    throw new Error("Review time is outside the frozen composition");
  return [...new Set(result)];
}

export function reviewToolContent(result: any) {
  const { inlineImages = [], ...metadata } = result;
  return [
    { type: "text" as const, text: JSON.stringify(metadata, null, 2) },
    ...inlineImages.flatMap(
      (item: { label: string; data: string; mimeType: string }) => [
        { type: "text" as const, text: item.label },
        { type: "image" as const, mimeType: item.mimeType, data: item.data },
      ],
    ),
  ];
}
