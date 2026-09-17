import { build } from "esbuild";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import electron from "electron";
const out = ".tilt/checks/review";
await fs.mkdir(out, { recursive: true });
await build({
  entryPoints: ["scripts/verify-review.ts"],
  outfile: `${out}/check.cjs`,
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["electron", "esbuild"],
});
const child = spawn(electron, [`${out}/check.cjs`], {
  stdio: "inherit",
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
});
child.on("exit", (code) => process.exit(code ?? 1));
