import { request } from "./client";
const [action, ...args] = process.argv.slice(2);
const commands: Record<string, () => Record<string, unknown>> = {
  state: () => ({ type: "state" }),
  inspect: () => ({ type: "inspect" }),
  files: () => ({ type: "list_files" }),
  seek: () => ({ type: "seek", time: Number(args[0]) }),
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
  command: () => JSON.parse(args.join(" ")),
};
async function main() {
  try {
    if (!commands[action])
      throw new Error(
        "Usage: npm run cli -- state | inspect | files | seek <seconds> | capture [seconds] | set <key> <value> | render | jobs | resume <id> | cancel <id> | command <json>",
      );
    console.log(JSON.stringify(await request(commands[action]()), null, 2));
  } catch (e) {
    console.error(String(e));
    process.exitCode = 1;
  }
}
void main();
