import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { build } from "esbuild";
import electron from "electron";
const label = process.argv[2] || "candidate";
if (!/^[\w-]+$/.test(label)) throw new Error("Use a simple label");
const project = path.resolve(".tilt/checks/editor-scrubbing", label);
await fs.mkdir(project, { recursive: true });
await fs.cp("scenes/interface", path.join(project, "scenes/interface"), {
  recursive: true,
});
await fs.cp("dist", path.join(project, "runtime"), { recursive: true });
await build({
  entryPoints: ["scripts/verify-editor-scrubbing.ts"],
  outfile: path.join(project, "verify.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["electron"],
});
const child = spawn(electron, [path.join(project, "verify.cjs"), project], {
  stdio: "inherit",
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
});
child.on("exit", (code) => process.exit(code ?? 1));
