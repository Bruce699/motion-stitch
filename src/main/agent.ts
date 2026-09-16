import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { request, project } from "./client";
const server = new McpServer({ name: "tilt", version: "0.1.0" });
const tool = (
  name: string,
  description: string,
  schema: Record<string, any>,
  command: (args: any) => Record<string, unknown>,
) =>
  server.registerTool(
    name,
    { description, inputSchema: schema },
    async (args) => {
      try {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(await request(command(args)), null, 2),
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: String(e) }],
        };
      }
    },
  );
tool(
  "tilt_state",
  "Read scene, revision, source bindings and render jobs. Read project AGENTS.md and the scene-authoring skill before changing a scene.",
  {},
  () => ({ type: "state" }),
);
tool("tilt_files", "List files in the active scene.", {}, () => ({
  type: "list_files",
}));
tool(
  "tilt_read_file",
  "Read a scene-relative text file and its hash.",
  { path: z.string() },
  (a) => ({ type: "read_file", ...a }),
);
tool(
  "tilt_write_file",
  "Write scene code or source assets. Pass the hash from the last read to prevent overwriting someone else. scene.json uses tilt_replace_scene.",
  { path: z.string(), content: z.string(), hash: z.string().optional() },
  (a) => ({ type: "write_file", ...a }),
);
tool(
  "tilt_replace_scene",
  "Persist a complete version-1 scene document. revision from tilt_state is required.",
  { scene: z.record(z.string(), z.unknown()), revision: z.string() },
  (a) => ({ type: "replace_scene", ...a }),
);
tool(
  "tilt_set_parameter",
  "Persist one custom scene parameter. The editor and this tool use the same command.",
  {
    key: z.string(),
    value: z.union([
      z.number(),
      z.string(),
      z.boolean(),
      z.tuple([z.number(), z.number(), z.number()]),
    ]),
  },
  (a) => ({ type: "set_parameter", ...a }),
);
tool(
  "tilt_inspect",
  "Inspect data-tilt-id subjects in the real browser source, including bounds and text.",
  {},
  () => ({ type: "inspect" }),
);
tool(
  "tilt_seek",
  "Pause and seek the scene to an absolute time in seconds.",
  { time: z.number() },
  (a) => ({ type: "seek", ...a }),
);
tool(
  "tilt_capture",
  "Render and save a PNG at an exact time; returns a local path for visual inspection.",
  { time: z.number() },
  (a) => ({ type: "capture", ...a }),
);
tool(
  "tilt_render",
  "Freeze current scene and enqueue a resumable MP4 render. Reuse requestId when retrying.",
  { requestId: z.string() },
  (a) => ({ type: "export", ...a }),
);
tool(
  "tilt_jobs",
  "List background render status and output locations.",
  {},
  () => ({ type: "jobs" }),
);
tool(
  "tilt_cancel",
  "Cancel a render without publishing a video.",
  { id: z.string() },
  (a) => ({ type: "cancel", ...a }),
);
tool(
  "tilt_resume",
  "Resume a stopped render from its frozen inputs and saved frames.",
  { id: z.string() },
  (a) => ({ type: "resume", ...a }),
);
tool(
  "tilt_open",
  "Open a scene from this project by folder ID.",
  { id: z.string() },
  (a) => ({ type: "open", ...a }),
);
server.registerResource(
  "tilt-project",
  "tilt://project",
  { description: "Tilt project path" },
  async (uri) => ({ contents: [{ uri: uri.href, text: project }] }),
);
server.connect(new StdioServerTransport()).catch((e) => {
  console.error(e);
  process.exit(1);
});
