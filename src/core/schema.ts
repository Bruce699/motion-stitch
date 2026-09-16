import { z } from "zod";

const localPath = z
  .string()
  .min(1)
  .refine(
    (v) => !v.startsWith("/") && !v.split(/[\\/]/).includes(".."),
    "Use a path inside the scene",
  );
export const ParameterSchema = z
  .object({
    label: z.string(),
    value: z.number().finite(),
    min: z.number().finite(),
    max: z.number().finite(),
    step: z.number().positive().default(0.01),
  })
  .refine(
    (p) => p.min < p.max && p.value >= p.min && p.value <= p.max,
    "Parameter value must be inside its range",
  );
export const SceneSchema = z
  .object({
    version: z.literal(1),
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1).max(100),
    duration: z.number().min(0.1).max(600),
    fps: z.number().int().min(1).max(120),
    size: z.object({
      width: z.number().int().min(64).max(7680),
      height: z.number().int().min(64).max(4320),
    }),
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    entry: localPath.default("scene.ts"),
    sources: z
      .array(
        z
          .object({
            id: z.string().regex(/^[a-zA-Z][\w-]*$/),
            kind: z.literal("web"),
            entry: localPath.optional(),
            url: z.string().url().optional(),
            width: z.number().int().min(64).max(4096),
            height: z.number().int().min(64).max(4096),
            sampling: z.enum(["static", "controlled"]).default("static"),
          })
          .refine(
            (s) => Boolean(s.entry) !== Boolean(s.url),
            "Specify either entry or url",
          ),
      )
      .max(8),
    parameters: z.record(z.string().regex(/^[a-zA-Z][\w-]*$/), ParameterSchema),
    tracks: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
          start: z.number().min(0),
          end: z.number().min(0),
          keys: z.array(z.number().min(0)).default([]),
        }),
      )
      .default([]),
  })
  .superRefine((s, ctx) => {
    if (new Set(s.sources.map((x) => x.id)).size !== s.sources.length)
      ctx.addIssue({ code: "custom", message: "Source IDs must be unique" });
    if (s.size.width % 2 || s.size.height % 2)
      ctx.addIssue({
        code: "custom",
        message: "Output dimensions must be even for MP4 encoding",
      });
    for (const t of s.tracks)
      if (
        t.start >= t.end ||
        t.end > s.duration ||
        t.keys.some((k) => k < t.start || k > t.end)
      )
        ctx.addIssue({
          code: "custom",
          message: `Track ${t.id} has invalid timing`,
        });
  });
export type SceneDocument = z.infer<typeof SceneSchema>;
export type SourceSpec = SceneDocument["sources"][number];
export type ProjectState = {
  scenes: { id: string; name: string }[];
  scene: SceneDocument;
  revision: string;
  codeRevision: number;
  path: string;
  error: string | null;
  jobs: RenderJob[];
};
export type RenderJob = {
  version: 1;
  id: string;
  sceneName: string;
  sceneId: string;
  requestId: string;
  phase:
    | "preparing"
    | "queued"
    | "capturing"
    | "encoding"
    | "complete"
    | "failed"
    | "interrupted"
    | "cancelled";
  frame: number;
  total: number;
  created: string;
  updated: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  pid?: number;
  error?: string;
  output?: string;
  runtime: string;
  electronVersion: string;
  elapsedMs?: number;
};
export type Command = { type: string; [key: string]: unknown };

export function values(scene: SceneDocument) {
  return Object.fromEntries(
    Object.entries(scene.parameters).map(([key, p]) => [key, p.value]),
  );
}
