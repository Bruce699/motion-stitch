// node scripts/verify-activity.mjs <immutable runtime directory> <label> [hidden,visible,lost]
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { build } from "esbuild";
import electron from "electron";
const [runtimeArg, label = "candidate", cases = "hidden,visible,lost"] =
  process.argv.slice(2);
if (!runtimeArg || !/^[\w-]+$/.test(label))
  throw new Error("Provide a runtime directory and simple label");
const root = path.resolve(".tilt/perf-activity");
const project = path.join(root, `project-${label}`);
await fs.mkdir(project, { recursive: true });
for (const id of ["interface", "export"]) {
  const destination = path.join(project, "scenes", id);
  await fs.cp("scenes/interface", destination, { recursive: true });
  const file = path.join(destination, "scene.json");
  const scene = JSON.parse(await fs.readFile(file, "utf8"));
  Object.assign(scene, {
    id,
    duration: id === "interface" ? 120 : 0.8,
    tracks: [],
  });
  await fs.writeFile(file, JSON.stringify(scene, null, 2));
}
const harness = path.join(root, "verify-activity.cjs");
await build({
  entryPoints: ["scripts/verify-activity.ts"],
  outfile: harness,
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["electron"],
  target: "node22",
});
const child = spawn(
  electron,
  [harness, path.resolve(runtimeArg), project, label, cases],
  { stdio: "inherit", env: { ...process.env, ELECTRON_RUN_AS_NODE: "" } },
);
child.on("exit", (code) => process.exit(code ?? 1));
