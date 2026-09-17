import { build } from "esbuild";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

// Uses a separately built candidate runtime and a temporary project. No user jobs.
const index = process.argv.indexOf("--runtime");
if (index < 0)
  throw new Error("Pass --runtime /absolute/path/to/isolated/dist");
const runtime = path.resolve(process.argv[index + 1]);
await fs.access(path.join(runtime, "main.cjs"));
const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-export-harness-"));
await fs.symlink(path.resolve("node_modules"), path.join(root, "node_modules"));
await build({
  entryPoints: ["scripts/verify-runtime-export.ts"],
  outfile: path.join(root, "check.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  external: ["electron", "esbuild"],
});
const child = spawn(process.execPath, [path.join(root, "check.cjs")], {
  stdio: "inherit",
  env: {
    ...process.env,
    TILT_EXPORT_RUNTIME: runtime,
    TILT_EXPORT_OUTPUT: path.resolve(
      process.env.TILT_EXPORT_DOF === "1"
        ? ".tilt/checks/live-depth-of-field/export"
        : ".tilt/checks/runtime-export",
    ),
  },
});
const code = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code) => resolve(code ?? 1));
});
await fs.rm(root, { recursive: true, force: true });
process.exitCode = code;
