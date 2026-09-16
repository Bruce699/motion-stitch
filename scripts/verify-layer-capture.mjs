import { build } from "esbuild";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import electron from "electron";
await fs.mkdir(".tilt/checks/react", { recursive: true });
await fs.writeFile(
  ".tilt/checks/react/index.html",
  '<!doctype html><style>body{margin:0;font:14px system-ui}</style><div id="root"></div><script defer src="index.js"></script>',
);
await build({
  entryPoints: ["tests/fixtures/layers-react.tsx"],
  outfile: ".tilt/checks/react/index.js",
  bundle: true,
  platform: "browser",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
await build({
  entryPoints: ["scripts/verify-layer-capture.ts"],
  outfile: ".tilt/checks/layers.cjs",
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["electron"],
  target: "node22",
});
const child = spawn(electron, [".tilt/checks/layers.cjs"], {
  stdio: "inherit",
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
});
child.on("exit", (code) => process.exit(code ?? 1));
