import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import electron from "electron";

// Isolated source-host verification; never connects to the user's editor runtime.
const output = path.resolve(".tilt/checks/source-hosting.cjs");
await fs.mkdir(path.dirname(output), { recursive: true });
await build({
  entryPoints: ["scripts/verify-source-hosting.ts"],
  outfile: output,
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["electron", "esbuild"],
  target: "node22",
});
const child = spawn(electron, [output], {
  stdio: "inherit",
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
});
child.once("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.once("exit", (code) => process.exit(code ?? 1));
