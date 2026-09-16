import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Integration check against the running local app. Does not change authored scene files.
// Creates a render job, interrupts only that job's verified worker PID, cancels and resumes it.
const root = process.cwd();
const client = new Client({ name: "tilt-verification", version: "1.0.0" });
await client.connect(
  new StdioClientTransport({
    command: "node",
    args: [path.join(root, "dist/agent.cjs")],
    env: { ...process.env, TILT_PROJECT: root },
  }),
);
const tool = async (name, args = {}) => {
  const r = await client.callTool({ name, arguments: args });
  if (r.isError) throw new Error(r.content[0].text);
  return JSON.parse(r.content[0].text);
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (id, predicate) => {
  const until = Date.now() + 90000;
  while (Date.now() < until) {
    const j = (await tool("tilt_jobs")).find((x) => x.id === id);
    if (predicate(j)) return j;
    if (j.phase === "failed") throw new Error(j.error);
    await pause(100);
  }
  throw new Error("Timed out waiting for job");
};
try {
  const { tools } = await client.listTools();
  assert.ok(tools.length >= 14);
  const state = await tool("tilt_state");
  assert.equal(state.scene.version, 1);
  const subjects = await tool("tilt_inspect");
  assert.ok(subjects.some((s) => s.subjects.length > 0));
  const file = await tool("tilt_read_file", { path: "scene.ts" });
  assert.ok(file.hash && file.content.includes("sample"));
  const requestId = "verify-" + Date.now();
  const [a, b] = await Promise.all([
    tool("tilt_render", { requestId }),
    tool("tilt_render", { requestId }),
  ]);
  assert.equal(a.id, b.id);
  console.log(
    JSON.stringify({
      mcpTools: tools.length,
      subjectCount: subjects[0].subjects.length,
      idempotentSubmission: true,
      job: a.id,
    }),
  );
  const running = await waitFor(
    a.id,
    (j) => j.phase === "capturing" && j.frame >= 8,
  );
  const framePath = path.join(
    root,
    ".tilt",
    "jobs",
    a.id,
    "frames",
    "000000.png",
  );
  const firstHash = createHash("sha256")
    .update(await fs.readFile(framePath))
    .digest("hex");
  const command = execFileSync(
    "ps",
    ["-p", String(running.pid), "-o", "command="],
    { encoding: "utf8" },
  );
  assert.ok(
    command.includes("--job " + a.id),
    "Only kill the worker created by this check",
  );
  process.kill(running.pid, "SIGKILL");
  const interrupted = await waitFor(a.id, (j) => j.phase === "interrupted");
  console.log(JSON.stringify({ interruptedAt: interrupted.frame }));
  await tool("tilt_resume", { id: a.id });
  await waitFor(
    a.id,
    (j) => j.phase === "capturing" && j.frame > interrupted.frame + 8,
  );
  await tool("tilt_cancel", { id: a.id });
  const cancelled = await waitFor(a.id, (j) => j.phase === "cancelled");
  assert.equal(cancelled.output, undefined);
  console.log(
    JSON.stringify({ cancelledAt: cancelled.frame, noPublishedOutput: true }),
  );
  await tool("tilt_resume", { id: a.id });
  const complete = await waitFor(a.id, (j) => j.phase === "complete");
  const savedHash = createHash("sha256")
    .update(await fs.readFile(framePath))
    .digest("hex");
  assert.equal(savedHash, firstHash);
  const probe = JSON.parse(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "stream=width,height,nb_frames,r_frame_rate",
        "-of",
        "json",
        complete.output,
      ],
      { encoding: "utf8" },
    ),
  ).streams[0];
  assert.equal(Number(probe.nb_frames), complete.total);
  assert.equal(probe.width, complete.width);
  assert.equal(probe.height, complete.height);
  console.log(
    JSON.stringify({
      resumed: true,
      preservedExistingFrame: true,
      phase: complete.phase,
      probe,
      output: complete.output,
    }),
  );
} finally {
  await client.close();
}
