import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { GuidanceLibrary, projectAgentInstructions } from "../src/main/guidance";
import { parseCLI } from "../src/core/cli";
import { agentCommands, parseAgentCommand } from "../src/core/commands";

const exec = promisify(execFile);
test("installed guidance is byte-identical to source, follows linked guides and needs no project checkout", async t => {
  const runtime = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-guidance-"));
  t.after(() => fs.rm(runtime, { recursive: true, force: true }));
  await exec(process.execPath, ["scripts/build-guidance.mjs", path.join(runtime, "guidance.json")]);
  const library = new GuidanceLibrary(runtime);
  const catalogue = await library.catalogue();
  assert.equal(catalogue.skills.length, 7);
  const skill = catalogue.skills.find(s => s.name === "motion-design")!;
  assert.ok(skill.description.includes("choreography"));
  assert.equal(skill.files.filter(f => f.includes("/guides/")).length, 6);
  for (const item of catalogue.documents) {
    const document = await library.read(item.path);
    const source = await fs.readFile(item.path, "utf8");
    assert.equal(document.content, source, item.path);
    assert.equal(document.hash, createHash("sha256").update(source).digest("hex"));
    assert.equal(document.version, catalogue.version);
    for (const link of document.links) await library.read(link);
  }
  const entry = await library.read(skill.path);
  assert.equal(entry.links.length, 7);
  const adapter = await library.read(".agents/skills/motion-design/adapters/tilt.md");
  assert.ok(adapter.links.includes(".agents/skills/scene-authoring/SKILL.md"));
  assert.ok(adapter.links.includes("docs/camera.md"));
  assert.ok(!catalogue.documents.some(d => d.path.includes("skill-drafts") || d.path.includes("friction") || d.path.startsWith("references/")));
  for (const bad of ["../AGENTS.md", "/etc/passwd", ".tilt/session.json", "__proto__", "constructor", ".agents/skills/motion-design/../workspace-context/SKILL.md", "%2e%2e/AGENTS.md"])
    await assert.rejects(library.read(bad), /Unknown guidance/);
  await assert.rejects(new GuidanceLibrary(path.join(runtime, "missing")).catalogue(), /rebuild/);
});

test("CLI skill shortcuts and MCP/API use the same read-only command schema", () => {
  assert.deepEqual(parseCLI(["skills"]).command, { type: "guidance" });
  assert.deepEqual(parseCLI(["skill", "motion-design"]).command,
    parseAgentCommand({ type: "guidance", path: ".agents/skills/motion-design/SKILL.md" }));
  assert.deepEqual(parseCLI(["skill", "motion-design", "guides/timing.md"]).command,
    { type: "guidance", path: ".agents/skills/motion-design/guides/timing.md" });
  assert.deepEqual(parseCLI(["guide", "docs/camera.md"]).command, { type: "guidance", path: "docs/camera.md" });
  for (const args of [["skill"], ["guide"], ["skill", "../other"], ["skill", "motion-design", "../SKILL.md"]])
    assert.throws(() => parseCLI(args));
  assert.equal(agentCommands.guidance.readOnly, true);
  assert.equal(agentCommands.guidance.name, "tilt_guidance");
  assert.throws(() => parseAgentCommand({ type: "guidance", path: "", content: "write" }));
  assert.match(projectAgentInstructions("/Applications/Tilt's App/cli.cjs"), /'\\''/);
});
