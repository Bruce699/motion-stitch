import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import electron from "electron";
const label = process.argv[2] || "current";
if (!/^[a-z0-9-]+$/.test(label)) throw new Error("Use a simple run label");
const out = path.resolve(".tilt/checks/scrubbing", label);
await fs.mkdir(path.join(out, "ui"), { recursive: true });
await fs.mkdir(path.join(out, "modules"), { recursive: true });
await fs.mkdir(path.join(out, "scene"), { recursive: true });
for (const file of ["scene.json", "scene.ts", "admin-order"])
  await fs.cp(
    path.join("scenes/interface", file),
    path.join(out, "scene", file),
    { recursive: true },
  );
await fs.writeFile(
  path.join(out, "ui/index.html"),
  '<meta charset="utf-8"><style>body{margin:0}canvas{width:818px;height:511px}</style><script type="module" src="viewer.js"></script>',
);
await Promise.all([
  build({
    entryPoints: ["scripts/verify-scrubbing-viewer.ts"],
    outfile: path.join(out, "ui/viewer.js"),
    bundle: true,
    format: "esm",
    platform: "browser",
  }),
  build({
    entryPoints: ["scenes/interface/scene.ts"],
    outfile: path.join(out, "modules/scene.js"),
    bundle: true,
    format: "esm",
    platform: "browser",
  }),
  build({
    entryPoints: ["scripts/verify-scrubbing.ts"],
    outfile: path.join(out, "main.cjs"),
    bundle: true,
    format: "cjs",
    platform: "node",
    external: ["electron"],
  }),
]);
const child = spawn(electron, [path.join(out, "main.cjs"), out], {
  stdio: "inherit",
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
});
child.on("exit", (code) => process.exit(code ?? 1));
