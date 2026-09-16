import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  shell,
  dialog,
  nativeImage,
} from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import {
  SceneSchema,
  values,
  type Command,
  type SceneDocument,
  type RenderJob,
} from "../core/schema";
import { SceneStore } from "./store";
import { Jobs } from "./jobs";
import { WebSource, deadline } from "./source";
import { serve } from "./server";
import {
  alive,
  atomicWrite,
  hash,
  manifest,
  readJSON,
  safePath,
} from "./files";

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i < 0 ? undefined : process.argv[i + 1];
};
const root = path.resolve(arg("--project") || process.cwd());
const runtime = __dirname;
const coordinator = process.argv.includes("--coordinator");
const jobId = arg("--job");
app.setName("Tilt");
if (coordinator || jobId) {
  app.setPath(
    "userData",
    path.join(root, ".tilt", jobId ? `worker-${jobId}` : "coordinator"),
  );
  app.dock?.hide();
} else app.setPath("userData", path.join(root, ".tilt", "electron"));
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
const jobs = new Jobs(
  root,
  runtime,
  process.execPath,
  process.versions.electron!,
);
let editor: BrowserWindow | undefined;
let origin = "";
let store: SceneStore;
let frozen: SceneDocument | undefined;
let frozenDirectory = "";
let sources: WebSource[] = [];
let preparedKey = "";
let preparing: Promise<any> | null = null;
let compiled = "";
let activity = "idle";
const scene = () => frozen || store.scene;
const sceneDir = () => frozenDirectory || store.directory;
const moduleDir = path.join(root, ".tilt", "modules");
let currentFrame = 0;

async function compileScene(
  document: SceneDocument = scene(),
  directory = sceneDir(),
) {
  const { build } = await import("esbuild");
  const entry = await safePath(directory, document.entry);
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    target: "es2022",
    sourcemap: "inline",
    logLevel: "silent",
    nodePaths: [path.join(root, "node_modules")],
  });
  const output = result.outputFiles[0].contents;
  const file = path.join(moduleDir, hash(Buffer.from(output)) + ".js");
  await atomicWrite(file, Buffer.from(output));
  return file;
}
async function prepare() {
  const s = scene();
  const directory = sceneDir();
  const key = JSON.stringify([
    s.id,
    s.entry,
    s.sources,
    store?.codeRevision || 0,
  ]);
  if (key === preparedKey)
    return { url: `${origin}/modules/${path.basename(compiled)}`, scene: s };
  if (preparing) {
    await preparing;
    return prepare();
  }
  preparing = (async () => {
    const module = jobId
      ? path.join(moduleDir, jobId + ".js")
      : await compileScene(s, directory);
    const next = s.sources.map(
      (spec) => new WebSource(spec, origin, "source", directory),
    );
    try {
      await Promise.all(next.map((source) => source.ready()));
    } catch (e) {
      next.forEach((s) => s.dispose());
      throw e;
    }
    sources.forEach((s) => s.dispose());
    sources = next;
    compiled = module;
    preparedKey = key;
    return { url: `${origin}/modules/${path.basename(module)}`, scene: s };
  })();
  try {
    return await preparing;
  } finally {
    preparing = null;
  }
}
async function sample(time: number) {
  await prepare();
  const images: Record<string, string> = {};
  for (const source of sources)
    images[source.spec.id] = await source.sample(time, values(scene()));
  return images;
}
async function state() {
  return {
    scenes: frozen
      ? [{ id: frozen.id, name: frozen.name }]
      : await store.list(),
    scene: scene(),
    revision: store?.revision || "frozen",
    codeRevision: store?.codeRevision || 0,
    path: sceneDir(),
    error: store?.error || null,
    jobs: jobId ? [] : await jobs.list(),
  };
}
async function command(c: Command): Promise<any> {
  if (!c || typeof c.type !== "string")
    throw new Error("Command requires a type");
  if (c.type === "state") return state();
  if (c.type === "prepare") return prepare();
  if (c.type === "frame") {
    const time = Number(c.time);
    if (!Number.isFinite(time) || time < 0 || time > scene().duration)
      throw new Error("Invalid time");
    currentFrame = time;
    return sample(time);
  }
  if (jobId) throw new Error("Frozen workers are read only");
  switch (c.type) {
    case "set_parameter":
      return store.edit((s) => {
        const p = s.parameters[String(c.key)];
        if (!p) throw new Error("Unknown parameter");
        p.value = Number(c.value);
      });
    case "set_setting":
      return store.edit((s) => {
        if (c.key === "name") s.name = String(c.value);
        else if (c.key === "duration") {
          s.duration = Number(c.value);
          s.tracks = s.tracks.map((t) => ({
            ...t,
            start: Math.min(t.start, s.duration - 0.01),
            end: Math.min(t.end, s.duration),
            keys: t.keys.filter((k) => k <= s.duration),
          }));
        } else if (c.key === "fps") s.fps = Number(c.value);
        else if (c.key === "background") s.background = String(c.value);
        else throw new Error("Unknown setting");
      });
    case "replace_scene": {
      if (typeof c.revision !== "string")
        throw new Error("Expected revision is required");
      const s = SceneSchema.parse(c.scene);
      return store.edit((doc) => Object.assign(doc, s), c.revision);
    }
    case "undo":
    case "redo":
      return store.history(c.type);
    case "open":
      await store.open(String(c.id));
      return state();
    case "create":
      await store.create(String(c.name || "Untitled"));
      return state();
    case "read_file": {
      const content = await store.readFile(String(c.path));
      return { content, hash: hash(content) };
    }
    case "write_file":
      return store.writeFile(
        String(c.path),
        String(c.content),
        c.hash as string | undefined,
      );
    case "list_files":
      return Object.keys(await manifest(sceneDir()));
    case "inspect":
      await prepare();
      return Promise.all(
        sources.map(async (s) => ({
          source: s.spec.id,
          subjects: await s.inspect(),
        })),
      );
    case "seek": {
      const time = Number(c.time);
      if (!Number.isFinite(time) || time < 0 || time > scene().duration)
        throw new Error("Invalid time");
      editor?.webContents.send("tilt:transport", { time, playing: false });
      return { time };
    }
    case "play":
    case "pause":
      editor?.webContents.send("tilt:transport", {
        playing: c.type === "play",
      });
      return { playing: c.type === "play" };
    case "capture": {
      if (!editor) throw new Error("Editor is not open");
      const time = c.time === undefined ? currentFrame : Number(c.time);
      if (!Number.isFinite(time) || time < 0 || time > scene().duration)
        throw new Error("Invalid time");
      const data = await deadline(
        editor.webContents.executeJavaScript(
          `window.__tiltCapture(${JSON.stringify(time)})`,
        ),
        60000,
        "Frame capture",
      );
      const file = path.join(root, ".tilt", "captures", `${Date.now()}.png`);
      await atomicWrite(file, Buffer.from(data.split(",")[1], "base64"));
      return { path: file, time };
    }
    case "reveal":
      shell.showItemInFolder(path.join(sceneDir(), "scene.json"));
      return {};
    case "reveal_job": {
      const j = await jobs.get(String(c.id));
      if (j.output) shell.showItemInFolder(j.output);
      return {};
    }
    case "export": {
      if (store.error) throw new Error("Fix the scene file before rendering");
      const snapshot = structuredClone(scene());
      const directory = sceneDir();
      return jobs.submit(
        snapshot,
        directory,
        () => compileScene(snapshot, directory),
        String(c.requestId || randomBytes(16).toString("hex")),
      );
    }
    case "jobs":
      return jobs.list();
    case "cancel":
      return jobs.cancel(String(c.id));
    case "resume":
      return jobs.resume(String(c.id));
    case "activity":
      activity = String(c.activity);
      await atomicWrite(
        path.join(root, ".tilt", "activity.json"),
        JSON.stringify({ activity, at: Date.now() }),
      );
      return {};
    default:
      throw new Error(`Unknown command: ${c.type}`);
  }
}

async function setupServer() {
  await fs.mkdir(moduleDir, { recursive: true });
  const token = randomBytes(32).toString("hex");
  const http = await serve({
    ui: path.join(runtime, "ui"),
    scene: sceneDir,
    modules: moduleDir,
    token,
    command,
  });
  origin = http.origin;
  ipcMain.handle("tilt:command", (event, c) => {
    if (event.sender.id !== editor?.webContents.id)
      throw new Error("Unknown renderer");
    return command(c);
  });
  if (!jobId) {
    const file = path.join(root, ".tilt", "session.json");
    await atomicWrite(
      file,
      JSON.stringify({ origin, token, pid: process.pid, project: root }),
    );
    await fs.chmod(file, 0o600);
  }
  return http;
}
function windowOptions(show: boolean) {
  return {
    width: 1440,
    height: 960,
    minWidth: 1000,
    minHeight: 680,
    show,
    title: "Tilt",
    backgroundColor: "#191919",
    titleBarStyle: "hiddenInset" as const,
    trafficLightPosition: { x: 18, y: 17 },
    webPreferences: {
      preload: path.join(runtime, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
    },
  };
}

async function runEditor() {
  if (!app.requestSingleInstanceLock({ root })) {
    app.quit();
    return;
  }
  app.on("second-instance", () => {
    editor?.show();
    editor?.focus();
  });
  store = new SceneStore(root);
  const list = await store.list();
  if (!list.length) throw new Error("No valid scenes found");
  await store.open(list.find((s) => s.id === "interface")?.id || list[0].id);
  const http = await setupServer();
  editor = new BrowserWindow(windowOptions(true));
  editor.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  editor.webContents.on("will-navigate", (event) => event.preventDefault());
  editor.webContents.on("console-message", (_event, level, message) => {
    if (level >= 2) console.error("[renderer]", message);
  });
  store.on("change", () => editor?.webContents.send("tilt:change"));
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "Tilt",
        submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }],
      },
      {
        label: "File",
        submenu: [
          {
            label: "New Scene",
            accelerator: "CmdOrCtrl+N",
            click: () => void store.create("Untitled"),
          },
          {
            label: "Reveal Scene",
            accelerator: "CmdOrCtrl+Shift+R",
            click: () =>
              shell.showItemInFolder(path.join(sceneDir(), "scene.json")),
          },
        ],
      },
      {
        label: "Edit",
        submenu: [
          {
            label: "Undo",
            accelerator: "CmdOrCtrl+Z",
            click: () => void store.history("undo"),
          },
          {
            label: "Redo",
            accelerator: "CmdOrCtrl+Shift+Z",
            click: () => void store.history("redo"),
          },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "selectAll" },
        ],
      },
      {
        label: "View",
        submenu: [
          { role: "reload" },
          { role: "toggleDevTools" },
          { role: "togglefullscreen" },
        ],
      },
    ]),
  );
  await editor.loadURL(origin);
  await jobs.reconcile();
  editor.on("closed", () => {
    editor = undefined;
    store.watcher?.close();
    sources.forEach((s) => s.dispose());
    http.server.close();
    app.quit();
  });
}

async function runCoordinator() {
  const lock = path.join(root, ".tilt", "coordinator.lock");
  try {
    const f = await fs.open(lock, "wx");
    await f.writeFile(String(process.pid));
    await f.close();
  } catch (e: any) {
    if (e.code !== "EEXIST") throw e;
    const pid = Number(await fs.readFile(lock, "utf8"));
    if (alive(pid)) {
      app.quit();
      return;
    }
    await fs.rm(lock, { force: true });
    return runCoordinator();
  }
  try {
    while (true) {
      const list = (await jobs.list())
        .filter((j) => j.phase === "queued")
        .reverse();
      if (!list.length) break;
      const job = list[0];
      job.pid = process.pid;
      await jobs.update(job);
      const log = await fs.open(
        path.join(jobs.directory, job.id, "worker.log"),
        "a",
      );
      const code = await new Promise<number | null>((resolve) => {
        const child = spawn(
          process.execPath,
          [
            path.join(job.runtime, "main.cjs"),
            "--job",
            job.id,
            "--project",
            root,
          ],
          {
            stdio: ["ignore", log.fd, log.fd],
            env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
          },
        );
        child.on("exit", resolve);
        child.on("error", () => resolve(-1));
      });
      await log.close();
      const latest = await jobs.get(job.id);
      if (!["complete", "cancelled", "failed"].includes(latest.phase)) {
        latest.phase = "interrupted";
        latest.error = `Worker exited (${code}). Resume to continue from saved frames.`;
        latest.pid = undefined;
        await jobs.update(latest);
      }
    }
  } finally {
    await fs.rm(lock, { force: true });
    // A submission arriving between the empty-queue check and unlock must not be stranded.
    if ((await jobs.list()).some((job) => job.phase === "queued"))
      await jobs.startCoordinator();
    app.quit();
  }
}
async function processTool(
  name: string,
  args: string[],
  cancel: () => Promise<boolean>,
) {
  let stderr = "";
  let stdout = "";
  const child = spawn(name, args, { stdio: ["ignore", "pipe", "pipe"] });
  child.stderr.on("data", (b) => (stderr += b.toString()));
  child.stdout.on("data", (b) => (stdout += b.toString()));
  const timer = setInterval(() => {
    void cancel().then((c) => {
      if (c) child.kill("SIGTERM");
    });
  }, 250);
  try {
    await new Promise<void>((resolve, reject) => {
      child.on("error", reject);
      child.on("exit", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`${name}: ${stderr.slice(-3000)}`)),
      );
    });
    return stdout;
  } finally {
    clearInterval(timer);
  }
}
async function runWorker() {
  const started = Date.now();
  const job = await jobs.get(jobId!);
  const dir = path.join(jobs.directory, job.id);
  const cancelled = async () => {
    try {
      await fs.access(path.join(dir, "cancel"));
      return true;
    } catch {
      return false;
    }
  };
  try {
    if (job.electronVersion !== process.versions.electron)
      throw new Error(
        "Electron runtime changed. Restore the original version to resume.",
      );
    job.pid = process.pid;
    job.phase = "capturing";
    await jobs.update(job);
    frozenDirectory = path.join(dir, "scene");
    frozen = SceneSchema.parse(
      await readJSON(path.join(frozenDirectory, "scene.json")),
    );
    await fs.mkdir(moduleDir, { recursive: true });
    await fs.copyFile(
      path.join(dir, "scene.js"),
      path.join(moduleDir, job.id + ".js"),
    );
    await setupServer();
    editor = new BrowserWindow({
      ...windowOptions(false),
      width: job.width,
      height: job.height,
      webPreferences: {
        ...windowOptions(false).webPreferences,
        offscreen: true,
      },
    });
    await editor.loadURL(origin + "/?render=1");
    await deadline(
      (async () => {
        while (
          !(await editor!.webContents.executeJavaScript(
            "Boolean(window.__tiltRender)",
          ))
        )
          await new Promise((r) => setTimeout(r, 100));
      })(),
      30000,
      "Render worker startup",
    );
    const frames = path.join(dir, "frames");
    await fs.mkdir(frames, { recursive: true });
    for (let i = 0; i < job.total; i++) {
      if (await cancelled()) throw new Error("Cancelled");
      try {
        let a = await readJSON<{ activity: string; at: number }>(
          path.join(root, ".tilt", "activity.json"),
        );
        while (Date.now() - a.at < 3000 && a.activity === "scrub") {
          if (await cancelled()) throw new Error("Cancelled");
          await new Promise((r) => setTimeout(r, 100));
          a = await readJSON(path.join(root, ".tilt", "activity.json"));
        }
        if (Date.now() - a.at < 3000 && a.activity === "play")
          await new Promise((r) => setTimeout(r, 500));
      } catch (e) {
        if (String(e).includes("Cancelled")) throw e;
      }
      const file = path.join(frames, String(i).padStart(6, "0") + ".png");
      let valid = false;
      try {
        const im = nativeImage.createFromBuffer(await fs.readFile(file));
        const size = im.getSize();
        valid = size.width === job.width && size.height === job.height;
      } catch {}
      if (!valid) {
        let rendered = false;
        for (let attempt = 0; attempt < 3 && !rendered; attempt++) {
          try {
            const data: string = await deadline(
              editor.webContents.executeJavaScript(
                `window.__tiltRender(${i / job.fps})`,
              ),
              60000,
              "Frame render",
            );
            await atomicWrite(file, Buffer.from(data.split(",")[1], "base64"));
            rendered = true;
          } catch (e) {
            if (attempt === 2) throw e;
          }
        }
      }
      job.frame = i + 1;
      await jobs.update(job);
    }
    if (await cancelled()) throw new Error("Cancelled");
    job.phase = "encoding";
    await jobs.update(job);
    const temp = path.join(dir, "output.partial.mp4");
    await processTool(
      "ffmpeg",
      [
        "-y",
        "-v",
        "error",
        "-framerate",
        String(job.fps),
        "-i",
        path.join(frames, "%06d.png"),
        "-frames:v",
        String(job.total),
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        temp,
      ],
      cancelled,
    );
    const probe = JSON.parse(
      await processTool(
        "ffprobe",
        [
          "-v",
          "error",
          "-select_streams",
          "v:0",
          "-count_frames",
          "-show_entries",
          "stream=width,height,nb_read_frames,r_frame_rate",
          "-of",
          "json",
          temp,
        ],
        cancelled,
      ),
    ).streams[0];
    if (
      probe.width !== job.width ||
      probe.height !== job.height ||
      Number(probe.nb_read_frames) !== job.total
    )
      throw new Error("Encoded video failed frame verification");
    await processTool(
      "ffmpeg",
      ["-v", "error", "-i", temp, "-f", "null", "-"],
      cancelled,
    );
    if (await cancelled()) throw new Error("Cancelled");
    const output = path.join(
      root,
      "exports",
      `${job.sceneId}-${job.id.slice(0, 8)}.mp4`,
    );
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.rename(temp, output);
    job.phase = "complete";
    job.output = output;
    job.error = undefined;
    job.elapsedMs = Date.now() - started;
    job.pid = undefined;
    await jobs.update(job);
  } catch (e) {
    job.phase = (await cancelled()) ? "cancelled" : "failed";
    job.error = String(e);
    job.pid = undefined;
    await jobs.update(job);
    console.error(e);
  } finally {
    sources.forEach((s) => s.dispose());
    editor?.destroy();
    app.quit();
  }
}

app
  .whenReady()
  .then(() =>
    coordinator ? runCoordinator() : jobId ? runWorker() : runEditor(),
  )
  .catch((e) => {
    console.error(e);
    if (!coordinator && !jobId)
      dialog.showErrorBox("Tilt could not start", String(e));
    app.exit(1);
  });
app.on("window-all-closed", () => {
  if (!coordinator && !jobId) app.quit();
});
