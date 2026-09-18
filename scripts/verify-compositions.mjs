import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { build } from "esbuild";
import electron from "electron";
const project = path.resolve(
  ".tilt/checks/compositions",
  new Date().toISOString().replace(/[:.]/g, "-"),
);
const sourceDir = path.join(project, "scenes/dashboard");
await fs.mkdir(path.join(sourceDir, "source"), { recursive: true });
await fs.cp("dist", path.join(project, "runtime"), { recursive: true });
await fs.writeFile(
  path.join(sourceDir, "scene.json"),
  JSON.stringify({
    version: 1,
    id: "dashboard",
    name: "Dashboard",
    duration: 5,
    fps: 30,
    size: { width: 640, height: 360 },
    background: "#14202c",
    sources: [
      {
        id: "ui",
        kind: "web",
        entry: "source/index.html",
        width: 640,
        height: 360,
        sampling: "controlled",
      },
    ],
    parameters: { tint: { type: "color", label: "Tint", value: "#86d7b0" } },
    exposedParameters: ["tint"],
    tracks: [],
  }),
);
await fs.writeFile(
  path.join(sourceDir, "scene.ts"),
  `export default function({THREE,world,camera,surfaces}) { const plane=new THREE.Mesh(new THREE.PlaneGeometry(7.844,4.412),new THREE.MeshBasicMaterial({map:surfaces.ui}));world.add(plane);return {sample({time,cameraId}) { camera.position.set(cameraId!=='main' ? .1 * time : 0,0,7);camera.lookAt(0,0,0); }}; }`,
);
await fs.writeFile(
  path.join(sourceDir, "source/index.html"),
  `<!doctype html><html><style>*{box-sizing:border-box}body{margin:0;background:#14202c;color:white;font:20px system-ui;padding:24px}h1{font-size:24px}.cards{display:flex;gap:12px}.card{background:#253849;border-radius:12px;padding:20px;flex:1}.value{font-size:34px;color:#86d7b0}.bar{height:70px;background:#86d7b0;border-radius:8px;margin-top:24px}</style><h1>Dashboard</h1><div class=cards><div class=card>Revenue<div class=value>$24,680</div></div><div class=card>Orders<div class=value>184</div></div></div><div class=bar></div><script>window.tiltSource={sample({time,parameters}){document.querySelector('.bar').style.width=(80+time*80)+'px';document.querySelector('.bar').style.background=parameters.tint;document.querySelector('h1').textContent='Dashboard · '+time.toFixed(2)+' s';}};</script></html>`,
);
await build({
  entryPoints: ["scripts/verify-compositions.ts"],
  outfile: path.join(project, "verify.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["electron"],
});
console.log(JSON.stringify({ project }));
const child = spawn(electron, [path.join(project, "verify.cjs"), project], {
  stdio: "inherit",
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
});
child.on("exit", (code) => process.exit(code ?? 1));
