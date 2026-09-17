import { z } from "zod";

const nonnegative = z.number().finite().nonnegative();
/** CPU wall times. renderSubmitMs measures submission, never GPU/display completion. */
export const RenderMetricsSchema = z.object({
  time: nonnegative,
  revision: z.string().optional(),
  queueMs: nonnegative,
  sourceMs: nonnegative,
  decodeMs: nonnegative,
  sceneMs: nonnegative,
  renderSubmitMs: nonnegative,
  totalMs: nonnegative,
  decodedImages: nonnegative,
  reusedImages: nonnegative,
  transferredBytes: nonnegative,
  residentSurfaceBytes: nonnegative,
  sourceCaptureBytes: nonnegative,
  renderTargetBytes: nonnegative,
  residentManagedBytes: nonnegative,
  peakSurfaceBytes: nonnegative,
  surfaceBudgetBytes: nonnegative,
});
export type RenderMetrics = z.infer<typeof RenderMetricsSchema>;
export const DEFAULT_SURFACE_BUDGET_MB = 2048;

/** Decoded RGBA plus a mipmapped RGBA GPU texture. Browser/driver allocations are additional. */
export function surfaceResidentBytes(width: number, height: number) {
  return Math.ceil(width * height * 4 * (1 + 4 / 3));
}
