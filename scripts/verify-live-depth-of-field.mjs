import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { build } from "esbuild";
import electron from "electron";
const [label = "candidate", runtimeRoot = ".", sceneRoot = runtimeRoot] =
  process.argv.slice(2);
if (!/^[\w-]+$/.test(label)) throw new Error("Use a simple label");
const project = path.resolve(".tilt/checks/live-depth-of-field", label);
await fs.rm(project, { recursive: true, force: true });
await fs.mkdir(project, { recursive: true });
await fs.rm(path.join(project, "scenes"), { recursive: true, force: true });
const sceneDirectory = path.join(sceneRoot, "scenes/interface");
await fs.cp(sceneDirectory, path.join(project, "scenes/interface"), {
  recursive: true,
  filter: (p) =>
    !path
      .relative(sceneDirectory, p)
      .split(path.sep)
      .some((n) => n === "node_modules" || n.startsWith(".")),
});
await fs.cp(path.join(runtimeRoot, "dist"), path.join(project, "runtime"), {
  recursive: true,
});
const uiIndex = await fs.readFile(
  path.join(project, "runtime/ui/index.html"),
  "utf8",
);
const uiScript = uiIndex.match(/src="\.\/(assets\/[^"]+\.js)"/)?.[1];
const digest = async (p) =>
  createHash("sha256")
    .update(await fs.readFile(p))
    .digest("hex");
await fs.writeFile(
  path.join(project, "inputs.json"),
  JSON.stringify(
    {
      runtimeRoot: path.resolve(runtimeRoot),
      sceneRoot: path.resolve(sceneRoot),
      sourceDocumentSha256: await digest(
        path.join(sceneDirectory, "scene.json"),
      ),
      mainSha256: await digest(path.join(project, "runtime/main.cjs")),
      rendererScript: uiScript,
      rendererSha256: uiScript
        ? await digest(path.join(project, "runtime/ui", uiScript))
        : null,
    },
    null,
    2,
  ),
);
await build({
  entryPoints: ["scripts/verify-live-depth-of-field.ts"],
  outfile: path.join(project, "verify.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["electron"],
});
const child = spawn(
  electron,
  [path.join(project, "verify.cjs"), project, label],
  { stdio: "inherit", env: { ...process.env, ELECTRON_RUN_AS_NODE: "" } },
);
child.on("exit", (code) => process.exit(code ?? 1));
