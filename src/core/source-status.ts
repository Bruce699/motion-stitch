import { z } from "zod";

/** Plain data: safe to report to agents without exposing process environment/logs. */
const elapsed = z.number().finite().nonnegative().optional();
export const SourceStatusSchema = z.object({
  sourceId: z.string(),
  phase: z.enum([
    "created",
    "hosting",
    "loading",
    "ready",
    "sampling",
    "failed",
    "disposed",
  ]),
  adapter: z.object({ ready: z.boolean(), sample: z.boolean() }).nullable(),
  requestedTime: z.number().finite().optional(),
  preparedTime: z.number().finite().optional(),
  reused: z.boolean(),
  timings: z.object({
    hostMs: elapsed,
    loadMs: elapsed,
    readyMs: elapsed,
    adapterMs: elapsed,
    paintMs: elapsed,
    captureMs: elapsed,
    totalMs: elapsed,
  }),
  captures: z.number().int().nonnegative(),
  capturedBytes: z.number().int().nonnegative(),
  error: z.object({ stage: z.string(), message: z.string() }).optional(),
});
export type SourceStatus = z.infer<typeof SourceStatusSchema>;
