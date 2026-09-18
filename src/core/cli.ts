import { parseAgentCommand } from "./commands";

export const cliHelp = [
  "Tilt agent CLI",
  "  context [--fresh] | views | state [--fresh] | capabilities",
  "  skills | skill <name> [file] | guide <catalogue-path>",
  "  Start authoring with skills; load workspace-context and motion-design as relevant.",
  "  watch [--count N] | wait-for-change <cursor> [--timeout MS]",
  "  seek <seconds> | play | pause | view <source|camera> [sourceId]",
  "  select-track <id|none> | wait-for-frame <revision> [--timeout MS] | capture [seconds]",
  "  set <key> <JSON-or-text> | set-camera <JSON> | set-track <id> <JSON>",
  "  set-setting <key> <JSON-or-text> | replace-scene <local-json-file> --revision REV",
  "  files | read <path> | write <path> <local-text-file> --hash <HASH|new>",
  "  begin <label> <revision> [--paths '[\"scene.ts\"]'] | apply <id> | discard <id>",
  "  history | undo | redo | open <sceneId> | create <name>",
  "  render [requestId] | jobs | cancel <jobId> | resume <jobId>",
  '  review [\'{"times":[0,2],"focus":["ui/payment"]}\'] | review-status <id>',
  "  command '<JSON>' | desktop | stop",
  "Targets: --scene ID --view ID --actor ID; guarded edits: --revision REV",
  "Remote connection: TILT_URL + runtime-injected TILT_TOKEN. No local fallback.",
].join("\n");
const parseValue = (text: string | undefined) => {
  if (text === undefined) throw new Error("Missing value");
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};
export function parseCLI(argv: string[]): {
  action: string;
  help?: string;
  count?: number;
  path?: string;
  inputFile?: string;
  options?: Record<string, unknown>;
  command?: { type: string; [key: string]: unknown };
} {
  const action = argv[0] || "help";
  const args: string[] = [];
  const options: Record<string, unknown> = {};
  let count: number | undefined;
  for (let i = 1; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--fresh") {
      options.fresh = true;
      continue;
    }
    if (!flag.startsWith("--")) {
      args.push(flag);
      continue;
    }
    if (
      ![
        "--view",
        "--scene",
        "--actor",
        "--revision",
        "--hash",
        "--paths",
        "--count",
        "--timeout",
      ].includes(flag)
    )
      throw new Error("Unknown option: " + flag);
    const value = argv[++i];
    if (value === undefined || value.startsWith("--"))
      throw new Error("Missing value for " + flag);
    if (flag === "--count") {
      count = Number(value);
      if (!Number.isInteger(count) || count < 1)
        throw new Error("--count must be a positive integer");
    } else if (flag === "--paths") options.paths = JSON.parse(value);
    else if (flag === "--timeout") options.timeoutMs = Number(value);
    else if (flag === "--hash") options.hash = value === "new" ? null : value;
    else
      options[
        (
          {
            "--view": "viewId",
            "--scene": "sceneId",
            "--actor": "actorId",
            "--revision": "revision",
          } as Record<string, string>
        )[flag]
      ] = value;
  }
  const commands: Record<string, () => Record<string, unknown>> = {
    state: () => ({ type: "state" }),
    context: () => ({ type: "context" }),
    views: () => ({ type: "views" }),
    capabilities: () => ({ type: "capabilities" }),
    skills: () => ({ type: "guidance" }),
    skill: () => {
      if (!args[0] || !/^[a-z0-9-]+$/.test(args[0])) throw new Error("Supply a skill name from skills");
      const file = args[1] || "SKILL.md";
      if (file.startsWith("/") || file.includes("\\") || file.split("/").some(part => !part || part === "." || part === "..")) throw new Error("Invalid skill file path");
      return { type: "guidance", path: `.agents/skills/${args[0]}/${file}` };
    },
    guide: () => {
      if (!args[0]) throw new Error("Supply a document path from skills");
      return { type: "guidance", path: args[0] };
    },
    history: () => ({ type: "history" }),
    undo: () => ({ type: "undo" }),
    redo: () => ({ type: "redo" }),
    inspect: () => ({ type: "inspect" }),
    files: () => ({ type: "list_files" }),
    read: () => ({ type: "read_file", path: args[0] }),
    seek: () => ({ type: "seek", time: Number(args[0]) }),
    play: () => ({ type: "play" }),
    pause: () => ({ type: "pause" }),
    view: () => ({
      type: "view",
      mode: args[0],
      ...(args[1] ? { sourceId: args[1] } : {}),
    }),
    capture: () => ({
      type: "capture",
      ...(args[0] !== undefined ? { time: Number(args[0]) } : {}),
    }),
    review: () => ({ type: "review", ...(args[0] ? JSON.parse(args[0]) : {}) }),
    "review-status": () => ({ type: "review_status", id: args[0] }),
    set: () => ({
      type: "set_parameter",
      key: args[0],
      value: parseValue(args[1]),
    }),
    "set-camera": () => ({ type: "set_camera", patch: JSON.parse(args[0]) }),
    "set-track": () => ({
      type: "set_track",
      id: args[0],
      timing: JSON.parse(args[1]),
    }),
    "set-setting": () => ({
      type: "set_setting",
      key: args[0],
      value: parseValue(args[1]),
    }),
    "select-track": () => ({
      type: "select_track",
      id: args[0] === "none" ? null : args[0],
    }),
    "wait-for-frame": () => ({ type: "wait_for_frame", revision: args[0] }),
    "wait-for-change": () => ({ type: "wait_for_change", since: args[0] }),
    render: () => ({
      type: "export",
      requestId: args[0] || crypto.randomUUID(),
    }),
    jobs: () => ({ type: "jobs" }),
    resume: () => ({ type: "resume", id: args[0] }),
    cancel: () => ({ type: "cancel", id: args[0] }),
    begin: () => ({
      type: "edit_begin",
      label: args[0] || "Agent edit",
      ...(args[1] ? { revision: args[1] } : {}),
    }),
    apply: () => ({ type: "edit_apply", id: args[0] }),
    discard: () => ({ type: "edit_cancel", id: args[0] }),
    open: () => ({ type: "open", id: args[0] }),
    create: () => ({ type: "create", name: args[0] }),
    command: () => JSON.parse(args.join(" ")),
  };
  if (["help", "--help", "-h"].includes(action))
    return { action, help: cliHelp };
  if (action === "watch") {
    if (
      Object.keys(options).some(
        (key) => !["viewId", "sceneId", "actorId"].includes(key),
      )
    )
      throw new Error("watch accepts only viewer/scene targets and --count");
    return { action, options, count };
  }
  if (count !== undefined) throw new Error("--count is only valid for watch");
  if (action === "write")
    return { action, options, path: args[0], inputFile: args[1] };
  if (action === "replace-scene")
    return { action, options, inputFile: args[0] };
  if (action === "desktop" || action === "stop")
    return {
      action,
      command: { type: action === "stop" ? "shutdown" : "desktop", ...options },
    };
  if (!Object.hasOwn(commands, action))
    throw new Error("Unknown command: " + action + "\n" + cliHelp);
  return {
    action,
    command: parseAgentCommand({ ...commands[action](), ...options }),
  };
}
