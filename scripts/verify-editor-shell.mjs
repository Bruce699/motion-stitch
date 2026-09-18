import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { build } from "esbuild";
import electron from "electron";
const directory = path.resolve(
  ".tilt/checks/editor-shell",
  new Date().toISOString().replace(/[:.]/g, "-"),
);
const project = path.join(directory, "Dashboard project");
const scene = path.join(project, "scenes", "dashboard");
await fs.mkdir(scene, { recursive: true });
await fs.cp("tests/fixtures/transfer-source", path.join(scene, "source"), {
  recursive: true,
});
await fs.cp("dist", path.join(directory, "runtime"), { recursive: true });
await fs.writeFile(
  path.join(scene, "scene.json"),
  JSON.stringify({
    version: 1,
    id: "dashboard",
    name: "Dashboard",
    duration: 8,
    fps: 60,
    size: { width: 1280, height: 720 },
    background: "#101820",
    sources: [
      {
        id: "ui",
        kind: "web",
        entry: "source/index.html",
        width: 1000,
        height: 640,
        sampling: "controlled",
      },
    ],
    parameters: {},
    tracks: [
      {
        id: "move",
        label: "Camera move",
        color: "#94b7a6",
        start: 0,
        end: 8,
        keys: [0, 8],
      },
    ],
  }),
);
await fs.writeFile(
  path.join(scene, "scene.ts"),
  `export default function({THREE,world,camera}) { const mesh=new THREE.Mesh(new THREE.BoxGeometry(3,1.5,.1),new THREE.MeshBasicMaterial({color:'#94b7a6'}));world.add(mesh);return {sample({time}) {mesh.rotation.y=time/10; camera.position.set(0,0,7);camera.lookAt(0,0,0);}};}`,
);
await build({
  entryPoints: ["scripts/verify-editor-shell.ts"],
  outfile: path.join(directory, "verify.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["electron"],
});
console.log(JSON.stringify({ directory }));
const child = spawn(electron, [path.join(directory, "verify.cjs"), directory], {
  stdio: "inherit",
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "",
    TILT_PROJECTS_DIRECTORY: path.join(directory, "library"),
  },
});
child.on("exit", (code) => process.exit(code ?? 1));
