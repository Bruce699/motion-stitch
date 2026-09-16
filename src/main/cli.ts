import { request, project } from "./client";
import fs from "node:fs/promises";
import path from "node:path";
const argv = process.argv.slice(2);
const [action] = argv;
const args: string[] = [];
const options: Record<string, unknown> = {};
for (let i = 1; i < argv.length; i++) {
  if (argv[i] === "--view") options.viewId = argv[++i];
  else if (argv[i] === "--scene") options.sceneId = argv[++i];
  else if (argv[i] === "--fresh") options.fresh = true;
  else args.push(argv[i]);
}
const commands: Record<string, () => Record<string, unknown>> = {
  state: () => ({ type: "state" }),
  context: () => ({ type: "context" }),
  history: () => ({ type: "history" }),
  undo: () => ({ type: "undo" }),
  redo: () => ({ type: "redo" }),
  inspect: () => ({ type: "inspect" }),
  files: () => ({ type: "list_files" }),
  seek: () => ({ type: "seek", time: Number(args[0]) }),
  view: () => ({ type: "view", mode: args[0], sourceId: args[1] }),
  capture: () => ({
    type: "capture",
    ...(args[0] !== undefined ? { time: Number(args[0]) } : {}),
  }),
  set: () => ({ type: "set_parameter", key: args[0], value: Number(args[1]) }),
  play: () => ({ type: "play" }),
  pause: () => ({ type: "pause" }),
  render: () => ({ type: "export", requestId: args[0] }),
  jobs: () => ({ type: "jobs" }),
  resume: () => ({ type: "resume", id: args[0] }),
  cancel: () => ({ type: "cancel", id: args[0] }),
  begin: () => ({
    type: "edit_begin",
    label: args[0] || "Agent edit",
    revision: args[1],
  }),
  apply: () => ({ type: "edit_apply", id: args[0] }),
  discard: () => ({ type: "edit_cancel", id: args[0] }),
  desktop: () => ({ type: "desktop" }),
  stop: () => ({ type: "shutdown" }),
  command: () => JSON.parse(args.join(" ")),
};
async function main() {
  try {
    if (action === "context" && !options.fresh && !options.viewId) {
      console.log(
        await fs.readFile(path.join(project, ".tilt", "context.json"), "utf8"),
      );
      return;
    }
    if (!commands[action])
      throw new Error(
        "Usage: npm run cli -- state | context [--fresh] | inspect | files | seek <seconds> | view <source|camera> | capture [seconds] | set <key> <value> | history | undo | redo | begin [label] [revision] | apply <id> | discard <id> | render | jobs | resume <id> | cancel <id> | desktop | stop | command <json>\nTarget a viewer with --view <id> or a scene with --scene <id>.",
      );
    console.log(
      JSON.stringify(
        await request({ ...commands[action](), ...options }),
        null,
        2,
      ),
    );
  } catch (e) {
    console.error(String(e));
    process.exitCode = 1;
  }
}
void main();
