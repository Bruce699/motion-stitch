import { TrackSchema } from "./tracks";
import { z } from "zod";
import { CameraSettingsSchema } from "./camera";
import {
  CaptureSettingsSchema,
  MAX_CANVAS_EDGE,
  MAX_CANVAS_PIXELS,
} from "./quality";
import { ParameterSchema } from "./parameters";
export { ParameterSchema } from "./parameters";

export const FRAME_RATES = [30, 60] as const;
export const DEFAULT_FRAME_RATE = 60;

const localPath = z
  .string()
  .min(1)
  .refine(
    (v) => !v.startsWith("/") && !v.split(/[\\/]/).includes(".."),
    "Use a path inside the scene",
  );
export const LayerSpecSchema = z.object({
  id: z
    .string()
    .regex(/^[a-zA-Z][\w-]*$/)
    .refine((id) => id !== "base", "base is reserved"),
  label: z.string().max(100).optional(),
  selector: z.string().min(1).max(1000),
  padding: z.number().int().min(0).max(256).default(8),
  optional: z.boolean().default(false),
});
export type LayerSpec = z.infer<typeof LayerSpecSchema>;
/** The command runs as trusted scene code; the imported browser remains sandboxed. */
export const SourceServerSchema = z.object({
  executable: z
    .string()
    .min(1)
    .max(500)
    .refine(
      (value) =>
        !value.startsWith("/") &&
        !value.includes("\\") &&
        !value.split("/").some((part) => part === ".." || part === ""),
      "Use a command name or an executable inside the server directory",
    ),
  args: z.array(z.string().max(4096)).max(64).default([]),
  cwd: localPath,
  url: z
    .string()
    .min(1)
    .max(2048)
    .refine((value) => {
      try {
        if (!/^http:\/\/127\.0\.0\.1:\{port\}(?:\/|$)/.test(value))
          return false;
        if ((value.match(/\{port\}/g) ?? []).length !== 1) return false;
        const url = new URL(value.replace("{port}", "12345"));
        return (
          url.protocol === "http:" &&
          url.hostname === "127.0.0.1" &&
          url.port === "12345" &&
          !url.username &&
          !url.password &&
          !url.hash
        );
      } catch {
        return false;
      }
    }, "Use http://127.0.0.1:{port}/ followed by the app route"),
  export: z.literal("packaged").optional(),
});
export type SourceServer = z.infer<typeof SourceServerSchema>;
export const SceneSchema = z
  .object({
    version: z.literal(1),
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1).max(100),
    duration: z.number().min(0.1).max(600),
    fps: z
      .number()
      .refine(
        (fps) => FRAME_RATES.some((rate) => rate === fps),
        "Frame rate must be 30 or 60",
      )
      .default(DEFAULT_FRAME_RATE),
    size: z.object({
      width: z.number().int().min(64).max(MAX_CANVAS_EDGE),
      height: z.number().int().min(64).max(MAX_CANVAS_EDGE),
    }),
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    entry: localPath.default("scene.ts"),
    camera: CameraSettingsSchema.optional(),
    capture: CaptureSettingsSchema.optional(),
    render: z
      .object({ encoding: z.enum(["pipelined", "checkpoint"]) })
      .strict()
      .optional(),
    sources: z
      .array(
        z
          .object({
            id: z.string().regex(/^[a-zA-Z][\w-]*$/),
            kind: z.literal("web"),
            entry: localPath.optional(),
            url: z.string().url().optional(),
            server: SourceServerSchema.optional(),
            readyTimeoutMs: z.number().int().min(100).max(120000).optional(),
            sampleTimeoutMs: z.number().int().min(100).max(120000).optional(),
            width: z.number().int().min(64).max(4096),
            height: z.number().int().min(64).max(4096),
            sampling: z.enum(["static", "controlled"]).default("static"),
            layers: z.array(LayerSpecSchema).max(32).default([]),
          })
          .refine(
            (s) => [s.entry, s.url, s.server].filter(Boolean).length === 1,
            "Specify exactly one of entry, url or server",
          ),
      )
      .max(8),
    parameters: z.record(z.string().regex(/^[a-zA-Z][\w-]*$/), ParameterSchema),
    tracks: z.array(TrackSchema).default([]),
  })
  .superRefine((s, ctx) => {
    if (s.size.width * s.size.height > MAX_CANVAS_PIXELS)
      ctx.addIssue({
        code: "custom",
        message:
          "Canvas must fit within 4K (4096 px per edge and 4096 × 2160 total pixels)",
      });
    if (
      s.camera?.sourceId &&
      !s.sources.some((source) => source.id === s.camera!.sourceId)
    )
      ctx.addIssue({
        code: "custom",
        message: "Camera source must name a scene source",
      });
    for (const source of s.sources)
      if (new Set(source.layers.map((l) => l.id)).size !== source.layers.length)
        ctx.addIssue({
          code: "custom",
          message: `Layer IDs must be unique in ${source.id}`,
        });
    if (new Set(s.sources.map((x) => x.id)).size !== s.sources.length)
      ctx.addIssue({ code: "custom", message: "Source IDs must be unique" });
    if (s.size.width % 2 || s.size.height % 2)
      ctx.addIssue({
        code: "custom",
        message: "Output dimensions must be even for MP4 encoding",
      });
    if (new Set(s.tracks.map((t) => t.id)).size !== s.tracks.length)
      ctx.addIssue({ code: "custom", message: "Track IDs must be unique" });
    for (const t of s.tracks)
      if (t.parameterKeys.some((key) => !s.parameters[key]))
        ctx.addIssue({
          code: "custom",
          message: `Track ${t.id} references an unknown parameter`,
        });
    for (const t of s.tracks) {
      const fail = (message: string) =>
        ctx.addIssue({ code: "custom", message: `Track ${t.id}: ${message}` });
      if (t.parentId) {
        const parent = s.tracks.find((p) => p.id === t.parentId);
        if (!parent || parent.kind !== "group")
          fail("parent must name a group");
        else if (t.start < parent.start || t.end > parent.end)
          fail("timing must stay inside its group");
        const seen = new Set([t.id]);
        let next = parent;
        while (next) {
          if (seen.has(next.id)) {
            fail("group hierarchy cannot contain a cycle");
            break;
          }
          seen.add(next.id);
          next = s.tracks.find((p) => p.id === next!.parentId);
        }
      }
      for (const target of t.targets ?? []) {
        if (
          target.kind === "layer" &&
          !s.sources.some(
            (source) =>
              source.id === target.sourceId &&
              source.layers.some((layer) => layer.id === target.layerId),
          )
        )
          fail("target must name a declared source layer");
      }
    }
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
  history?: {
    canUndo: boolean;
    canRedo: boolean;
    pendingEdit: { id: string; label: string; kind: string } | null;
    entries: {
      id: string;
      revision: string;
      label: string;
      actor: string;
      at: string;
      current: boolean;
    }[];
  };
  origin?: string;
  view?: import("./context").ViewContext | null;
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
