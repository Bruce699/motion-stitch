import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  agentCommands,
  parseAgentCommand,
  commandCatalogue,
} from "../core/commands";
import { request, project, actorId } from "./client";
import { reviewToolContent } from "../core/review";

const server = new McpServer({ name: "tilt", version: "0.2.0" });
for (const [type, definition] of Object.entries(agentCommands)) {
  server.registerTool(
    definition.name,
    {
      description: definition.description,
      inputSchema: definition.schema.shape,
      annotations: { readOnlyHint: definition.readOnly },
    },
    async (args) => {
      try {
        if (type === "review" || type === "review_status") {
          const result = await request(parseAgentCommand({ type, ...args, ...(type === "review" ? { includeImages: true } : {}) }));
          return { content: reviewToolContent(result) };
        }
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                await request(parseAgentCommand({ type, ...args })),
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: String(error) }],
        };
      }
    },
  );
}
server.registerResource(
  "tilt-project",
  "tilt://project",
  { description: "Connection mode and agent identity; never credentials" },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          project: process.env.TILT_URL ? undefined : project,
          mode: process.env.TILT_URL ? "remote" : "local",
          actorId,
        }),
      },
    ],
  }),
);
server.registerResource(
  "tilt-context",
  "tilt://context",
  {
    description:
      "Current viewer context. For an acknowledged observation use tilt_context with fresh:true; wait for changes with its cursor.",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(await request({ type: "context" })),
      },
    ],
  }),
);
server.registerResource(
  "tilt-capabilities",
  "tilt://capabilities",
  { description: "Shared command schemas and descriptions" },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(commandCatalogue()),
      },
    ],
  }),
);
server.connect(new StdioServerTransport()).catch((error) => {
  console.error(error);
  process.exit(1);
});
