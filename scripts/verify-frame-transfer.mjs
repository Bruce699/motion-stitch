import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import electron from "electron";

// Standalone integration benchmark; never connects to the editor's runtime.
// Run: node scripts/verify-frame-transfer.mjs
// Optional: TILT_BENCH_DENSITIES=3,4 TILT_BENCH_FRAMES=32
//           TILT_BENCH_TRIALS=3 TILT_BENCH_CHANGING=1
// --build-only bundles the harness without opening Electron or running captures.
const output = path.resolve(".tilt/checks/frame-transfer");
await fs.mkdir(path.join(output, "ui"), { recursive: true });
await fs.mkdir(path.join(output, "modules"), { recursive: true });
await fs.writeFile(
  path.join(output, "ui/index.html"),
  '<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#111}canvas{display:block}</style><script type="module" src="viewer.js"></script>',
);
await Promise.all([
  build({
    entryPoints: ["scripts/verify-frame-transfer-viewer.ts"],
    outfile: path.join(output, "ui/viewer.js"),
    bundle: true,
    platform: "browser",
    format: "esm",
    target: "es2022",
  }),
  build({
    entryPoints: ["tests/fixtures/transfer-scene.ts"],
    outfile: path.join(output, "modules/scene.js"),
    bundle: true,
    platform: "browser",
    format: "esm",
    target: "es2022",
  }),
  build({
    entryPoints: ["scripts/verify-frame-transfer.ts"],
    outfile: path.join(output, "main.cjs"),
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node22",
    external: ["electron"],
  }),
]);
if (!process.argv.includes("--build-only")) {
  const child = spawn(electron, [path.join(output, "main.cjs")], {
    stdio: "inherit",
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
  });
  child.on("error", (error) => {
    console.error(error);
    process.exitCode = 1;
  });
  child.on("exit", (code) => process.exit(code ?? 1));
}
