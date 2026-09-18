import { app, BrowserWindow, nativeImage } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import assert from "node:assert/strict";
const [project] = process.argv.slice(2);
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const read = async (file: string) =>
  JSON.parse(await fs.readFile(file, "utf8"));
const wait = async (fn: () => Promise<any>, label: string, timeout = 45000) => {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    const value = await fn();
    if (value) return value;
    await delay(100);
  }
  throw new Error("Timed out: " + label);
};
app.setPath("userData", path.join(project, "viewer"));
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.dock?.hide();
app.on("window-all-closed", () => {});
let host: ReturnType<typeof spawn>, win: BrowserWindow, session: any;
const command = async (body: object) => {
  const r = await fetch(session.origin + "/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify(body),
  });
  const result = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(result));
  return result;
};
const js = (code: string) => win.webContents.executeJavaScript(code);
const click = async (text: string) => {
  assert.ok(
    await js(
      `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b)return false;b.click();return true;})()`,
    ),
    "button " + text,
  );
  await delay(100);
};
const setInput = async (label: string, value: string) =>
  js(
    `(()=>{const input=document.querySelector('input[aria-label=${JSON.stringify(label)}]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
  );
const ready = async () =>
  wait(async () => {
    const expected = await command({ type: "state" });
    const c = await command({ type: "context", fresh: true }).catch(() => null);
    return (
      c?.active?.connected &&
      c.active.ready &&
      !c.active.error &&
      c.active.sceneId === expected.scene.id &&
      c.active.displayedRevision === expected.revision &&
      c.active.displayedDependencyRevision === expected.dependencyRevision &&
      c.active
    );
  }, "presented frame");
async function capture(time: number, label: string) {
  const c = await command({ type: "capture", time });
  await fs.copyFile(c.path, path.join(project, label + ".png"));
  return fs.readFile(c.path);
}
async function main() {
  await app.whenReady();
  const log = await fs.open(path.join(project, "runtime.log"), "a");
  host = spawn(
    process.execPath,
    [path.join(project, "runtime/main.cjs"), "--project", project, "--browser"],
    {
      stdio: ["ignore", log.fd, log.fd],
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
    },
  );
  session = await wait(async () => {
    try {
      const s = await read(path.join(project, ".tilt/session.json"));
      return s.pid === host.pid && s;
    } catch {
      return false;
    }
  }, "runtime");
  const errors: string[] = [];
  win = new BrowserWindow({
    show: false,
    width: 1440,
    height: 960,
    webPreferences: { backgroundThrottling: false },
  });
  win.webContents.on("console-message", (e) => {
    if (e.level === "error" && !e.message.includes("ERR_INTERNET_DISCONNECTED"))
      errors.push(e.message);
  });
  await win.loadURL(session.origin);
  await ready();
  // Create a second camera through the user-facing control.
  await click("Add camera");
  const source = await wait(async () => {
    const s = await command({ type: "state", sceneId: "dashboard" });
    return s.scene.cameras?.length && s.scene;
  }, "new camera");
  const detail = source.cameras[0].id;
  await command({
    type: "camera_metadata",
    sceneId: "dashboard",
    cameraId: detail,
    name: "Detail",
  });
  await command({
    type: "set_camera",
    sceneId: "dashboard",
    cameraId: detail,
    patch: { zoom: 1.6, panX: 0.1 },
  });
  await command({ type: "view", mode: "camera", cameraId: "main" });
  const wide = await capture(1.25, "source-wide");
  await command({ type: "view", mode: "camera", cameraId: detail });
  const close = await capture(1.25, "source-detail");
  assert.notDeepEqual(wide, close);
  assert.equal(
    (await command({ type: "state", sceneId: "dashboard" })).scene
      .defaultCameraId,
    undefined,
    "preview must not set output",
  );
  // Create another composition in the project panel.
  await js(`document.querySelector('[aria-label="New composition"]').click()`);
  await setInput("New composition name", "Final Edit");
  await click("Create");
  const edit = await wait(async () => {
    const s = await command({ type: "state" });
    return s.scene.name === "Final Edit" && s.scene;
  }, "create/open composition");
  await ready();
  await command({
    type: "set_setting",
    sceneId: edit.id,
    key: "size",
    value: { width: 640, height: 360 },
  });
  await command({
    type: "set_setting",
    sceneId: edit.id,
    key: "fps",
    value: 30,
  });
  await command({
    type: "set_setting",
    sceneId: edit.id,
    key: "duration",
    value: 2,
  });
  await ready();
  await js(`document.querySelector('[aria-label="Insert Dashboard"]').click()`);
  let state = await wait(async () => {
    const s = await command({ type: "state" });
    return s.scene.clips?.length && s;
  }, "insert composition");
  await ready();
  const first = state.scene.clips[0].id;
  await command({ type: "set_clip", id: first, patch: { sourceIn: 1 } });
  await command({ type: "select_track", id: first });
  await command({ type: "seek", time: 1 });
  await click("Split");
  state = await wait(async () => {
    const s = await command({ type: "state" });
    return s.scene.clips?.length === 2 && s;
  }, "split");
  const second = state.scene.clips[1].id;
  assert.equal(state.scene.clips[1].sourceIn, 2, "split preserves continuity");
  await command({
    type: "set_clip",
    id: second,
    patch: { sourceIn: 4, cameraId: detail },
  });
  await command({ type: "select_track", id: second });
  await ready();
  const a = await capture(0.25, "edit-wide");
  const b = await capture(1.25, "edit-detail");
  assert.notDeepEqual(a, b);
  assert.deepEqual(
    await capture(0.25, "edit-wide-backward"),
    a,
    "backward seek is repeatable",
  );
  const atCut = await capture(1, "cut");
  assert.notDeepEqual(atCut, a);
  // Independently override one use and prove the other and source remain unchanged.
  await command({
    type: "clip_parameter",
    id: second,
    key: "tint",
    value: "#fa8d7f",
  });
  await ready();
  const overridden = await capture(1.25, "edit-override");
  assert.notDeepEqual(overridden, b);
  assert.deepEqual(await capture(0.25, "edit-first-unaffected"), a);
  assert.equal(
    (await command({ type: "state", sceneId: "dashboard" })).scene.parameters
      .tint.value,
    "#86d7b0",
  );
  await command({ type: "undo" });
  await ready();
  assert.deepEqual(await capture(1.25, "edit-undo"), b);
  await command({ type: "redo" });
  await ready();
  assert.deepEqual(await capture(1.25, "edit-redo"), overridden);
  // Shared-source update invalidates the containing composition.
  await command({
    type: "clip_parameter",
    id: second,
    key: "tint",
    reset: true,
  });
  await command({
    type: "set_parameter",
    sceneId: "dashboard",
    key: "tint",
    value: "#80adf5",
  });
  await ready();
  await delay(300);
  await ready();
  const updatedA = await capture(0.25, "edit-source-update-a");
  const updatedB = await capture(1.25, "edit-source-update-b");
  assert.notDeepEqual(updatedA, a);
  assert.notDeepEqual(updatedB, b);
  await command({ type: "select_track", id: second });
  await delay(150);
  await fs.writeFile(
    path.join(project, "editor.png"),
    (await win.webContents.capturePage()).toPNG(),
  );
  // A fresh viewer resolves the persisted graph and overrides.
  await win.loadURL(session.origin);
  await ready();
  assert.deepEqual(await capture(1.25, "edit-reload"), updatedB);
  // Freeze the graph, then modify its source before export completes.
  const job = await command({
    type: "export",
    requestId: "composition-verification",
  });
  const frozen = await read(
    path.join(
      project,
      ".tilt/jobs",
      job.id,
      "compositions/dashboard/scene/scene.json",
    ),
  );
  assert.equal(frozen.parameters.tint.value, "#80adf5");
  await command({
    type: "set_parameter",
    sceneId: "dashboard",
    key: "tint",
    value: "#ffffff",
  });
  const finished = await wait(
    async () => {
      const jobs = await command({ type: "jobs" });
      const j = jobs.find((j: any) => j.id === job.id);
      if (j?.phase === "failed") throw new Error(j.error);
      return j?.phase === "complete" && j;
    },
    "nested export",
    180000,
  );
  assert.equal(finished.total, 60);
  assert.equal(finished.width, 640);
  assert.equal(finished.height, 360);
  // Reject indirect cycles without altering the source document.
  await assert.rejects(
    command({
      type: "add_clip",
      sceneId: "dashboard",
      compositionId: edit.id,
      start: 0,
    }),
    /contain themselves/,
  );
  assert.deepEqual(errors, []);
  // Inspect a decoded frame from the actual MP4: it must retain the frozen blue tint.
  const videoFrame = path.join(project, "export-frame.png");
  await promisify(execFile)("ffmpeg", [
    "-v",
    "error",
    "-ss",
    "1.25",
    "-i",
    finished.output,
    "-frames:v",
    "1",
    videoFrame,
  ]);
  const bitmap = nativeImage.createFromPath(videoFrame).toBitmap();
  const offset = (290 * 640 + 320) * 4;
  const pixel = [bitmap[offset + 2], bitmap[offset + 1], bitmap[offset]];
  assert.ok(
    Math.abs(pixel[0] - 128) < 8 &&
      Math.abs(pixel[1] - 173) < 8 &&
      Math.abs(pixel[2] - 245) < 8,
    "export retains frozen tint: " + pixel,
  );
  // A second nesting level renders the same image and forwards an exposed control.
  await command({ type: "open", id: edit.id });
  await ready();
  await command({
    type: "clip_parameter",
    id: second,
    key: "tint",
    expose: true,
  });
  const exposed = (await command({ type: "state" })).scene.exposedParameters[0];
  const outer = (await command({ type: "create", name: "Nested Edit" })).scene;
  await ready();
  await command({
    type: "set_setting",
    key: "size",
    value: { width: 640, height: 360 },
  });
  await command({ type: "set_setting", key: "duration", value: 2 });
  await command({ type: "add_clip", compositionId: edit.id, start: 0 });
  await ready();
  const outerClip = (await command({ type: "state" })).scene.clips[0];
  await command({
    type: "clip_parameter",
    id: outerClip.id,
    key: exposed,
    value: "#fb9b80",
  });
  await ready();
  const twice = await capture(1.25, "nested-twice");
  await command({
    type: "clip_parameter",
    id: outerClip.id,
    key: exposed,
    value: "#8cd7b0",
  });
  await ready();
  assert.notDeepEqual(await capture(1.25, "nested-forwarded-control"), twice);
  assert.deepEqual(errors, []);
  const report = {
    project,
    editId: edit.id,
    cameraId: detail,
    checks: [
      "UI create camera",
      "UI create composition",
      "UI insert and split",
      "camera preview isolation",
      "source ranges",
      "exact cut",
      "backward seek",
      "override isolation",
      "undo/redo",
      "shared source invalidation",
      "reload",
      "frozen nested export",
      "export pixels",
      "two nesting levels",
      "forwarded nested control",
      "cycle rejection",
    ],
    export: finished,
    errors,
  };
  await fs.writeFile(
    path.join(project, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
  win.destroy();
  await command({ type: "shutdown" });
  await log.close();
}
main().then(
  () => app.exit(0),
  async (error) => {
    console.error(error);
    if (win && !win.isDestroyed())
      await fs.writeFile(
        path.join(project, "failure.png"),
        (await win.webContents.capturePage()).toPNG(),
      );
    win?.destroy();
    host?.kill("SIGTERM");
    app.exit(1);
  },
);
