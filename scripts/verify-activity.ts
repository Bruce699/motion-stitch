import { app, BrowserWindow } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import assert from "node:assert/strict";
const [runtime, project, label, casesArgument] = process.argv.slice(2);
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const json = async (file: string) =>
  JSON.parse(await fs.readFile(file, "utf8"));
async function waitFor(
  read: () => Promise<any>,
  label: string,
  timeout = 60000,
): Promise<any> {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const result = await read();
    if (result) return result;
    await delay(50);
  }
  throw new Error(`Timed out: ${label}`);
}
app.setPath("userData", path.join(project, ".tilt", "activity-test-viewer"));
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.on("window-all-closed", () => {});
app.dock?.hide();
let viewer: BrowserWindow | undefined;
let host: ReturnType<typeof spawn> | undefined;
let session: any;
const observations: any[] = [];
const activityPath = path.join(project, ".tilt", "activity.json");
const command = async (body: object) => {
  const response = await fetch(session.origin + "/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as any;
  if (!response.ok || result.error) throw new Error(JSON.stringify(result));
  return result;
};
async function startViewer() {
  viewer = new BrowserWindow({
    width: 1000,
    height: 760,
    show: false,
    webPreferences: {
      backgroundThrottling: true,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  viewer.showInactive();
  await viewer.loadURL(session.origin);
  await waitFor(async () => {
    const context = await command({ type: "context" });
    return (
      context.active?.ready &&
      !context.active.error &&
      context.active.connected &&
      context.active
    );
  }, "viewer ready");
  await command({ type: "play" });
  await waitFor(
    async () => (await json(activityPath)).activity === "play",
    "play lease",
  );
}
async function exportCase(kind: string, repeat: number) {
  if (!viewer || viewer.isDestroyed()) await startViewer();
  else {
    viewer.showInactive();
    await command({ type: "play" });
    await waitFor(
      async () => (await json(activityPath)).activity === "play",
      "play lease",
    );
  }
  const prior = await json(activityPath);
  if (kind === "hidden") viewer!.hide();
  if (kind === "lost") {
    viewer!.webContents.forcefullyCrashRenderer();
    viewer!.destroy();
    viewer = undefined;
  }
  await delay(kind === "hidden" ? 1200 : 100);
  const visibility = viewer
    ? await viewer.webContents.executeJavaScript(
        "({hidden:document.hidden,focused:document.hasFocus()})",
      )
    : null;
  if (kind === "hidden") assert.equal(visibility.hidden, true);
  if (kind === "visible") assert.equal(visibility.hidden, false);
  const activity = await json(activityPath);
  const started = performance.now();
  const job = await command({
    type: "export",
    sceneId: "export",
    requestId: randomUUID(),
  });
  const jobFile = path.join(project, ".tilt", "jobs", job.id, "job.json");
  const progress: any[] = [];
  let lastFrame = -1;
  const complete = await waitFor(
    async () => {
      const current = await json(jobFile);
      if (current.frame !== lastFrame) {
        progress.push({
          frame: current.frame,
          at: performance.now() - started,
          activity: await json(activityPath),
        });
        lastFrame = current.frame;
      }
      if (["failed", "interrupted", "cancelled"].includes(current.phase))
        throw new Error(current.error || current.phase);
      return current.phase === "complete" && current;
    },
    "export complete",
    120000,
  );
  const totalMs = performance.now() - started;
  const framesDir = path.join(path.dirname(jobFile), "frames");
  const hashes: string[] = [];
  for (const frame of (await fs.readdir(framesDir))
    .filter((file) => file.endsWith(".png"))
    .sort())
    hashes.push(
      createHash("sha256")
        .update(await fs.readFile(path.join(framesDir, frame)))
        .digest("hex"),
    );
  assert.equal(hashes.length, 24);
  const result = {
    kind,
    repeat,
    jobId: job.id,
    visibility,
    priorActivity: prior,
    activity,
    totalMs,
    workerMs: complete.elapsedMs,
    captureSpanMs:
      progress.at(-1).at - progress.find((entry) => entry.frame > 0).at,
    progress,
    hashes,
    output: complete.output,
  };
  observations.push(result);
  console.log(
    JSON.stringify({
      label,
      kind,
      repeat,
      visibility,
      activity: activity.activity,
      workerMs: result.workerMs,
      totalMs,
      captureSpanMs: result.captureSpanMs,
    }),
  );
  await fs.writeFile(
    path.join(project, "results.json"),
    JSON.stringify({ label, runtime, observations }, null, 2),
  );
}
async function main() {
  await app.whenReady();
  const log = await fs.open(path.join(project, "runtime.log"), "a");
  host = spawn(
    process.execPath,
    [path.join(runtime, "main.cjs"), "--project", project, "--browser"],
    {
      stdio: ["ignore", log.fd, log.fd],
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
    },
  );
  session = await waitFor(async () => {
    try {
      const found = await json(path.join(project, ".tilt", "session.json"));
      return found.pid === host!.pid && found;
    } catch {
      return false;
    }
  }, "runtime ready");
  try {
    for (const kind of casesArgument.split(",")) {
      assert.ok(["hidden", "visible", "lost"].includes(kind));
      for (let repeat = 0; repeat < (kind === "hidden" ? 3 : 1); repeat++)
        await exportCase(kind, repeat);
    }
  } finally {
    viewer?.destroy();
    await command({ type: "shutdown" }).catch(() => {});
    await log.close();
  }
}
main().then(
  () => app.exit(0),
  (error) => {
    console.error(error);
    viewer?.destroy();
    host?.kill("SIGTERM");
    app.exit(1);
  },
);
