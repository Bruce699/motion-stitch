import { z } from "zod";
import { ReviewOptions } from "./review";

// One public command vocabulary for the runtime, CLI discovery and MCP.
// Rendering/heartbeat messages are private runtime operations, not agent tools.
const id = z.string().min(1).max(200);
const sceneId = z.string().regex(/^[a-z0-9-]+$/);
const viewId = z.string().regex(/^[a-zA-Z0-9-]{1,80}$/);
const revision = z.string().min(1);
const time = z.number().finite().min(0);
const target = {
  sceneId: sceneId
    .optional()
    .describe("Scene folder ID; never an absolute path."),
  viewId: viewId
    .optional()
    .describe(
      "Pin a viewer from tilt_views. Omit to follow the active viewer.",
    ),
  actorId: id
    .optional()
    .describe("Stable agent/session identity for edit ownership and history."),
};
const timing = z.object({ start: time, end: time }).strict();
const value = z.union([
  z.number().finite(),
  z.string(),
  z.boolean(),
  z.tuple([z.number(), z.number()]),
  z.tuple([z.number(), z.number(), z.number()]),
]);
function command(
  name: string,
  description: string,
  shape: z.ZodRawShape = {},
  readOnly = false,
) {
  return {
    name,
    description,
    schema: z.object({ ...target, ...shape }).strict(),
    readOnly,
  };
}
export const agentCommands = {
  capabilities: command(
    "tilt_capabilities",
    "Discover the shared command schemas, runtime capabilities and workflow.",
    {},
    true,
  ),
  state: command(
    "tilt_state",
    "Read the authored scene, controls, tracks, file revision, pending edit, viewer and render jobs. Use fresh to observe current disk saves.",
    { fresh: z.boolean().optional() },
    true,
  ),
  views: command(
    "tilt_views",
    "List viewer IDs, scenes, connection status and interaction timestamps without moving a viewer.",
    {},
    true,
  ),
  context: command(
    "tilt_context",
    "Read viewer context including selection, visible timeline range and requested versus displayed frame. fresh requires acknowledgement from the selected connected viewer.",
    { fresh: z.boolean().optional() },
    true,
  ),
  wait_for_change: command(
    "tilt_wait_for_change",
    "Wait for context or scene changes after a cursor returned by context. Returns a complete snapshot on change or timeout; a restarted runtime also returns immediately.",
    {
      since: z.string(),
      timeoutMs: z.number().int().min(0).max(30000).default(10000),
    },
    true,
  ),
  inspect: command(
    "tilt_inspect",
    "Inspect semantic data-tilt-id subjects in the actual browser source, including bounds and text.",
    {},
    true,
  ),
  list_files: command(
    "tilt_files",
    "List files in the selected scene.",
    {},
    true,
  ),
  read_file: command(
    "tilt_read_file",
    "Read a scene-relative text file and its hash. Keep the hash for a guarded write.",
    { path: z.string().min(1) },
    true,
  ),
  write_file: command(
    "tilt_write_file",
    "Write a scene-relative text file. hash is required for existing files; null means create only. Owned edit groups must declare the path.",
    {
      path: z.string().min(1),
      content: z.string(),
      hash: z.string().nullable(),
    },
  ),
  replace_scene: command(
    "tilt_replace_scene",
    "Replace the scene document against the revision from state, preserving validation and history.",
    { scene: z.record(z.string(), z.unknown()), revision },
  ),
  set_parameter: command(
    "tilt_set_parameter",
    "Set one declared scene control through the same validation/history as the editor. Supply revision to reject concurrent changes.",
    { key: id, value, revision: revision.optional() },
  ),
  set_camera: command(
    "tilt_set_camera",
    "Patch authored camera settings through the shared camera contract.",
    { patch: z.record(z.string(), z.unknown()), revision: revision.optional() },
  ),
  set_track: command(
    "tilt_set_track",
    "Move or retime an animation/group; group changes retime descendants. Supply base timing or revision to reject stale edits.",
    { id, timing, base: timing.optional(), revision: revision.optional() },
  ),
  set_setting: command(
    "tilt_set_setting",
    "Set a scene setting with document validation and undo history.",
    {
      key: z.enum([
        "name",
        "background",
        "fps",
        "size",
        "width",
        "height",
        "density",
        "duration",
      ]),
      value: z.union([
        value,
        z
          .object({ width: z.number().finite(), height: z.number().finite() })
          .strict(),
      ]),
      revision: revision.optional(),
    },
  ),
  seek: command(
    "tilt_seek",
    "Pause a specific viewer and seek to absolute seconds. Returns only after that viewer presents the frame.",
    { time },
  ),
  play: command("tilt_play", "Start the selected viewer's own playback clock."),
  pause: command("tilt_pause", "Pause the selected viewer's playback clock."),
  view: command(
    "tilt_view",
    "Switch the selected viewer between camera and source inspection.",
    { mode: z.enum(["source", "camera"]), sourceId: id.optional() },
  ),
  select_track: command(
    "tilt_select_track",
    "Select an animation/group in the selected viewer, or clear selection with null.",
    { id: id.nullable() },
  ),
  wait_for_frame: command(
    "tilt_wait_for_frame",
    "Wait until the selected viewer has presented the expected revision. Does not move its playhead. Fails on superseding revisions or a timeout.",
    { revision, timeoutMs: z.number().int().min(1).max(15000).default(10000) },
    true,
  ),
  capture: command(
    "tilt_capture",
    "Pause and capture the selected viewer at an optional absolute time. Returns PNG and paired context locations for visual verification.",
    { time: time.optional() },
  ),
  review: command(
    "tilt_review",
    "Render a frozen composition without a viewer or moving its playhead. Returns labeled frames, before/after sheets and native-pixel detail crops. compareTo pins a prior review, times default to its times. focus uses sourceId/layerId. Optional motion renders asynchronously; use review_status. includeImages returns image bytes for vision clients.",
    ReviewOptions,
    true,
  ),
  review_status: command(
    "tilt_review_status",
    "Read a saved review and its motion preview status; never renders or moves a viewer.",
    { id: z.string().uuid(), includeImages: z.boolean().default(false), artifactIndices: z.array(z.number().int().min(0)).min(1).max(4).optional() },
    true,
  ),
  history: command(
    "tilt_history",
    "Read undo/redo history and the pending edit's owner, paths and base revision.",
    {},
    true,
  ),
  undo: command(
    "tilt_undo",
    "Undo one scene checkpoint; external changes and open edits must be resolved first.",
    { revision: revision.optional() },
  ),
  redo: command("tilt_redo", "Redo one scene checkpoint.", {
    revision: revision.optional(),
  }),
  edit_begin: command(
    "tilt_begin_edit",
    "Begin a coordinated edit at the revision from state. Keep the returned ID and actor identity; the previous complete scene remains visible until apply.",
    {
      label: z.string().min(1),
      revision: revision.optional(),
      paths: z.array(z.string().min(1)).optional(),
      kind: z.enum(["agent", "gesture"]).optional(),
    },
  ),
  edit_apply: command(
    "tilt_apply_edit",
    "Apply an edit owned by this actor after validating it. Unexpected paths fail explicitly.",
    { id },
  ),
  edit_cancel: command(
    "tilt_discard_edit",
    "Restore the base of an edit owned by this actor. Unexpected paths fail explicitly.",
    { id },
  ),
  open: command(
    "tilt_open",
    "Open an existing scene in the selected viewer and await its first frame.",
    { id: sceneId },
  ),
  create: command(
    "tilt_create",
    "Create a local scene from the starter scene and open it in the selected viewer if connected.",
    { name: z.string().min(1) },
  ),
  export: command(
    "tilt_render",
    "Freeze a scene and enqueue an MP4 render. Reuse requestId when retrying; inspect jobs for completion.",
    { requestId: id },
  ),
  jobs: command(
    "tilt_jobs",
    "List background render status and output locations.",
    {},
    true,
  ),
  cancel: command(
    "tilt_cancel",
    "Cancel a render job without publishing its video.",
    { id },
  ),
  resume: command(
    "tilt_resume",
    "Resume a render from its frozen inputs and saved frames.",
    { id },
  ),
} as const;
export type AgentCommandType = keyof typeof agentCommands;
export function parseAgentCommand(input: Record<string, unknown>): {
  type: string;
  [key: string]: unknown;
} {
  const { type, ...args } = input;
  const definition = agentCommands[type as AgentCommandType];
  if (!Object.hasOwn(agentCommands, String(type)))
    throw new Error("Unknown agent command: " + String(type));
  return { type: type as AgentCommandType, ...definition.schema.parse(args) };
}
export function commandCatalogue() {
  return Object.entries(agentCommands).map(([type, definition]) => ({
    type,
    tool: definition.name,
    description: definition.description,
    readOnly: definition.readOnly,
    inputSchema: z.toJSONSchema(definition.schema),
  }));
}
