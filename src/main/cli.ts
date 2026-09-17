import fs from "node:fs/promises";
import { client } from "./client";
import { parseCLI } from "../core/cli";
import { parseAgentCommand } from "../core/commands";

async function main() {
  const parsed = parseCLI(process.argv.slice(2));
  if (parsed.help) {
    console.log(parsed.help);
    return;
  }
  if (parsed.action === "watch") {
    const abort = new AbortController();
    const stop = () => abort.abort();
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    let received = 0;
    try {
      for await (const event of client.watch(parsed.options, abort.signal)) {
        console.log(JSON.stringify(event));
        if (parsed.count && ++received >= parsed.count) break;
      }
    } finally {
      abort.abort();
      process.off("SIGINT", stop);
      process.off("SIGTERM", stop);
    }
    return;
  }
  let command: { type: string; [key: string]: unknown } | undefined =
    parsed.command;
  if (parsed.action === "write" || parsed.action === "replace-scene") {
    if (!parsed.inputFile)
      throw new Error(
        "Supply a local input file; use --hash new only when creating a new scene file",
      );
    const content = await fs.readFile(parsed.inputFile, "utf8");
    command = parseAgentCommand(
      parsed.action === "write"
        ? { type: "write_file", path: parsed.path, content, ...parsed.options }
        : {
            type: "replace_scene",
            scene: JSON.parse(content),
            ...parsed.options,
          },
    );
  }
  if (!command) throw new Error("Missing command");
  const result =
    command.type === "context" &&
    !command.fresh &&
    !command.viewId &&
    !command.sceneId
      ? await client.snapshot()
      : await client.request(command);
  console.log(JSON.stringify(result, null, 2));
}
main().catch((error) => {
  console.error(String(error));
  process.exitCode = 1;
});
