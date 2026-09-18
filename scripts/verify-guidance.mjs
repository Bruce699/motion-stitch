import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { once } from "node:events";
import electron from "electron";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const exec = promisify(execFile);
const repository = process.cwd();
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-guidance-integration-"));
const project = path.join(temporary, "project");
const remoteCwd = path.join(temporary, "no-checkout");
const runtime = path.join(temporary, "runtime");
const env = { ...process.env, ELECTRON_RUN_AS_NODE: "", TILT_PROJECTS_DIRECTORY: path.join(temporary, "projects") };
for (const key of ["PORTLESS_URL", "PORT", "TILT_URL", "TILT_TOKEN", "TILT_PROJECT", "TILT_VIEW", "TILT_SCENE"]) delete env[key];
let host;
let mcp;
let hostLog = "";
try {
  await fs.mkdir(path.join(project, "scenes/interface"), { recursive: true });
  await fs.mkdir(remoteCwd);
  await fs.cp(path.join(repository, "dist"), runtime, { recursive: true });
  await fs.symlink(path.join(repository, "node_modules"), path.join(temporary, "node_modules"), "dir");
  await fs.copyFile(path.join(repository, "tests/fixtures/scene.json"), path.join(project, "scenes/interface/scene.json"));
  await fs.writeFile(path.join(project, "scenes/interface/scene.ts"), "export default () => ({sample(){}})");
  host = spawn(electron, [path.join(runtime, "main.cjs"), "--project", project, "--browser"], { env, stdio: ["ignore", "pipe", "pipe"] });
  host.stdout.on("data", chunk => { hostLog += chunk; });
  host.stderr.on("data", chunk => { hostLog += chunk; });
  host.on("error", error => { hostLog += String(error); });
  let session;
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const value = JSON.parse(await fs.readFile(path.join(project, ".tilt/session.json"), "utf8"));
      if (value.pid === host.pid) { session = value; break; }
    } catch {}
    if (host.exitCode !== null) throw new Error("Isolated runtime exited: " + hostLog);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.ok(session, "Isolated runtime did not start");
  const api = async body => {
    const response = await fetch(session.origin + "/api", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.token }, body: JSON.stringify(body) });
    const value = await response.json();
    if (!response.ok) throw new Error(value.error || String(response.status));
    return value;
  };
  const cli = async (args, remote = false) => {
    const result = await exec(process.execPath, [path.join(runtime, "cli.cjs"), ...args], {
      cwd: remote ? remoteCwd : project,
      env: remote ? { ...env, TILT_URL: session.origin, TILT_TOKEN: session.token } : env,
      maxBuffer: 4 * 1024 * 1024,
    });
    return JSON.parse(result.stdout);
  };
  const catalog = await api({ type: "guidance" });
  assert.deepEqual(await cli(["skills"]), catalog);
  assert.deepEqual(await cli(["skills"], true), catalog);
  const capabilities = await cli(["capabilities"], true);
  assert.deepEqual(capabilities.guidance, catalog);
  assert.ok(capabilities.commands.some(c => c.tool === "tilt_guidance" && c.readOnly));
  const entry = ".agents/skills/motion-design/SKILL.md";
  const document = await api({ type: "guidance", path: entry });
  assert.equal(document.content, await fs.readFile(path.join(repository, entry), "utf8"));
  assert.deepEqual(await cli(["skill", "motion-design"]), document);
  assert.deepEqual(await cli(["skill", "motion-design"], true), document);
  const timing = await cli(["skill", "motion-design", "guides/timing.md"], true);
  assert.equal(timing.content, await fs.readFile(path.join(repository, ".agents/skills/motion-design/guides/timing.md"), "utf8"));
  assert.equal((await cli(["guide", "docs/camera.md"], true)).content, await fs.readFile(path.join(repository, "docs/camera.md"), "utf8"));
  await assert.rejects(api({ type: "guidance", path: ".tilt/session.json" }), /Unknown guidance/);
  mcp = new Client({ name: "tilt-guidance-verification", version: "1.0.0" });
  await mcp.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(runtime, "agent.cjs")], cwd: remoteCwd, env: { ...env, TILT_URL: session.origin, TILT_TOKEN: session.token } }));
  assert.match(mcp.getInstructions(), /motion-design/);
  const tool = await mcp.callTool({ name: "tilt_guidance", arguments: { path: entry } });
  assert.deepEqual(JSON.parse(tool.content[0].text), document);
  const resource = await mcp.readResource({ uri: "tilt://guidance" });
  assert.deepEqual(JSON.parse(resource.contents[0].text), catalog);
  const caps = await mcp.readResource({ uri: "tilt://capabilities" });
  assert.deepEqual(JSON.parse(caps.contents[0].text), capabilities);
  assert.deepEqual(await fs.readdir(remoteCwd), []);
  const output = { skills: catalog.skills.length, documents: catalog.documents.length, version: catalog.version, localCLI: true, explicitEndpointCLIWithoutCheckout: true, MCPToolAndResourcesWithoutCheckout: true, sourceContentIdentical: true, linkedGuideAndContract: true, privatePathsRejected: true };
  await fs.mkdir(path.join(repository, ".tilt/checks/guidance"), { recursive: true });
  await fs.writeFile(path.join(repository, ".tilt/checks/guidance/verification.json"), JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} finally {
  if (mcp) await mcp.close();
  if (host && host.exitCode === null) {
    const exited = once(host, "exit");
    host.kill("SIGTERM");
    const kill = setTimeout(() => host.kill("SIGKILL"), 4000);
    await exited;
    clearTimeout(kill);
  }
  await fs.rm(temporary, { recursive: true, force: true });
}
