import { build } from "esbuild";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import electron from "electron";
const out = ".tilt/checks/depth-of-field";
await fs.mkdir(out, { recursive: true });
await fs.writeFile(
  `${out}/index.html`,
  '<!doctype html><style>body{margin:0}</style><script defer src="fixture.js"></script>',
);
await build({
  entryPoints: ["tests/fixtures/depth-of-field-renderer.ts"],
  outfile: `${out}/fixture.js`,
  bundle: true,
  platform: "browser",
  format: "iife",
});
await build({
  entryPoints: ["scripts/verify-depth-of-field.ts"],
  outfile: `${out}/check.cjs`,
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["electron"],
});
const child = spawn(electron, [`${out}/check.cjs`], {
  stdio: "inherit",
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
});
child.on("exit", (code) => process.exit(code ?? 1));
