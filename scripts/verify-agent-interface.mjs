import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { build } from "esbuild";
import electron from "electron";

const root = process.cwd();
const output = path.join(root, ".tilt/checks/agent-interface");
const project = path.join(output, "project");
await fs.mkdir(output, { recursive: true });
await fs.rm(project, { recursive: true, force: true });
await fs.mkdir(project, { recursive: true });
await fs.cp(path.join(root, "dist"), path.join(project, "runtime"), {
  recursive: true,
});
await fs.symlink(
  path.join(root, "node_modules"),
  path.join(project, "node_modules"),
  "dir",
);
const scene = {
  version: 1,
  id: "interface",
  name: "Agent interface fixture",
  duration: 4,
  fps: 60,
  size: { width: 640, height: 360 },
  background: "#101010",
  entry: "scene.ts",
  sources: [
    {
      id: "ui",
      kind: "web",
      entry: "source/index.html",
      width: 640,
      height: 360,
      sampling: "static",
    },
  ],
  parameters: {
    scale: {
      type: "number",
      label: "Scale",
      value: 1,
      min: 0.5,
      max: 2,
      step: 0.1,
    },
  },
  tracks: [
    {
      id: "lift",
      label: "Lift card",
      kind: "animation",
      start: 1,
      end: 3,
      keys: [],
      color: "#6699ff",
      parameterKeys: ["scale"],
    },
  ],
};
for (const id of ["interface", "second"]) {
  const directory = path.join(project, "scenes", id);
  await fs.mkdir(path.join(directory, "source"), { recursive: true });
  await fs.writeFile(
    path.join(directory, "scene.json"),
    JSON.stringify(
      {
        ...scene,
        id,
        name: id === "interface" ? scene.name : "Second fixture",
      },
      null,
      2,
    ),
  );
  await fs.writeFile(
    path.join(directory, "source/index.html"),
    '<!doctype html><style>body{margin:0;background:#eef1f6;font:28px system-ui;color:#1d2630;display:grid;place-items:center;height:100vh}.card{padding:40px;border-radius:20px;background:white;box-shadow:0 8px 24px #0001}</style><div class="card" data-tilt-id="card">Agent interface fixture</div>',
  );
  await fs.writeFile(
    path.join(directory, "scene.ts"),
    "export default ({THREE,world,camera,surfaces}) => { camera.position.z=4; const mesh=new THREE.Mesh(new THREE.PlaneGeometry(4,2.25),new THREE.MeshBasicMaterial({map:surfaces.ui}));world.add(mesh);return {sample({time,parameters}){mesh.position.y=Math.sin(time)*.15;mesh.scale.setScalar(parameters.scale)},dispose(){mesh.geometry.dispose();mesh.material.dispose()}} }",
  );
}
await build({
  entryPoints: ["scripts/verify-agent-interface.ts"],
  outfile: path.join(output, "main.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  external: ["electron", "esbuild"],
});
const env = { ...process.env, ELECTRON_RUN_AS_NODE: "" };
delete env.PORTLESS_URL;
delete env.PORT;
delete env.TILT_URL;
delete env.TILT_TOKEN;
delete env.TILT_VIEW;
delete env.TILT_SCENE;
const child = spawn(electron, [path.join(output, "main.cjs"), project, root], {
  stdio: "inherit",
  env,
});
child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code) => process.exit(code ?? 1));
