import { build } from "esbuild";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import electron from "electron";

// Real Chromium + Three.js renderer, isolated from user scenes and runtime.
const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-surface-harness-"));
const output = path.resolve(".tilt/checks/runtime-surfaces");
await fs.mkdir(output, { recursive: true });
await fs.mkdir(path.join(root, "ui"), { recursive: true });
await fs.mkdir(path.join(root, "source"), { recursive: true });
await fs.writeFile(
  path.join(root, "ui/index.html"),
  '<!doctype html><style>body{margin:0;background:#111}canvas{display:block}</style><script type="module" src="/viewer.js"></script>',
);
await fs.writeFile(
  path.join(root, "source/index.html"),
  '<!doctype html><style>body{margin:0}</style><div id="root"></div><script src="/index.js"></script>',
);
await fs.writeFile(
  path.join(root, "ui/scene.js"),
  `export default ({world,camera,createLayeredSource})=>{const source=createLayeredSource("react",{width:4});world.add(source.group);camera.position.z=6;return {sample({time}){source.group.rotation.y=Math.sin(time)*.13;source.get("card").object.position.z=.05;source.get("label").object.position.z=.12;}};}`,
);
await Promise.all([
  build({
    entryPoints: ["tests/fixtures/runtime-refactor-react.tsx"],
    outfile: path.join(root, "source/index.js"),
    bundle: true,
    platform: "browser",
    format: "iife",
    define: { "process.env.NODE_ENV": '"production"' },
  }),
  build({
    entryPoints: ["scripts/verify-runtime-surfaces-viewer.ts"],
    outfile: path.join(root, "ui/viewer.js"),
    bundle: true,
    platform: "browser",
    format: "esm",
    target: "es2022",
  }),
  build({
    entryPoints: ["scripts/verify-runtime-surfaces.ts"],
    outfile: path.join(root, "main.cjs"),
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node22",
    external: ["electron"],
  }),
]);
const child = spawn(electron, [path.join(root, "main.cjs")], {
  stdio: "inherit",
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "",
    TILT_SURFACE_ROOT: root,
    TILT_SURFACE_OUTPUT: output,
  },
});
const code = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code) => resolve(code ?? 1));
});
await fs.rm(root, { recursive: true, force: true });
process.exitCode = code;
