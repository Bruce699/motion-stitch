import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import electron from "electron";
const output = path.resolve(".tilt/checks/source-preview");
await fs.mkdir(path.join(output, "ui"), { recursive: true });
await fs.mkdir(path.join(output, "modules"), { recursive: true });
await fs.writeFile(
  path.join(output, "ui/index.html"),
  '<!doctype html><style>html,body{margin:0;width:100%;height:100%;background:#0a0a0a}#stage{position:relative;width:100%;height:100%}canvas{width:100%;height:100%}</style><div id="stage"></div><script type="module" src="viewer.js"></script>',
);
await Promise.all([
  build({
    entryPoints: ["scripts/verify-source-preview-viewer.ts"],
    outfile: path.join(output, "ui/viewer.js"),
    bundle: true,
    platform: "browser",
    format: "esm",
    target: "es2022",
  }),
  build({
    entryPoints: ["scripts/verify-source-preview.ts"],
    outfile: path.join(output, "main.cjs"),
    bundle: true,
    platform: "node",
    format: "cjs",
    external: ["electron", "esbuild"],
    target: "node22",
  }),
]);
const child = spawn(electron, [path.join(output, "main.cjs")], {
  stdio: "inherit",
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
});
child.on("exit", (code) => process.exit(code ?? 1));
