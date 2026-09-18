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
import { frameForReceiver } from "../core/frame-transfer";
import { sampleSources } from "./frame-preparation";
import { sourceFingerprint } from "./source-fingerprint";
import {
  validateCompositionGraph,
  type CompositionGraph,
} from "../core/compositions";
import {
  SceneSession,
  compileScene as compileSceneModule,
} from "./scene-session";
import { validatePackagedSource } from "./source-host";
import { PNGEncoder, mp4EncodingArguments } from "./png-encoder";
import { startRuntime } from "./runtime-host";
import { Jobs } from "./jobs";
import { WebSource, deadline } from "./source";
import { captureQuality } from "../core/quality";
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

const frozenCompositions = new Map<
  string,
  { scene: SceneDocument; directory: string; module: string }
>();
const frozenSessions = new Map<string, SceneSession>();
async function frozenSession(id: string) {
  let session = frozenSessions.get(id);
  if (!session) {
    const entry = frozenCompositions.get(id);
    if (!entry) throw new Error("Composition was not frozen: " + id);
    session = new SceneSession(
      {
        root,
        id,
        scene: entry.scene,
        revision: "frozen",
        codeRevision: 0,
        error: null,
        previewDirectory: async () => entry.directory,
      },
      origin,
      {
        compile: async () => entry.module,
        fingerprint: sourceFingerprint,
        createSource: (...args) => new WebSource(...args),
      },
    );
    frozenSessions.set(id, session);
  }
  return session;
}
let frozen: SceneDocument | undefined;
let frozenDirectory = "";
let sources: WebSource[] = [];
let preparedKey = "";
let preparing: Promise<any> | null = null;
let compiled = "";
let activity = "idle";
const scene = () => {
  if (!frozen) throw new Error("No render snapshot");
  return frozen;
};
const sceneDir = () => frozenDirectory;
const moduleDir = path.join(root, ".tilt", "modules");
let currentFrame = 0;

async function compileScene(
  document: SceneDocument = scene(),
  directory = sceneDir(),
) {
  return compileSceneModule(root, directory, document);
}
async function prepare() {
  const s = scene();
  const directory = sceneDir();
  const key = JSON.stringify([s.id, s.entry, s.sources, 0]);
  if (
    key === preparedKey &&
    sources.every(
      (source) => !["failed", "disposed"].includes(source.diagnostics.phase),
    )
  )
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
      (spec) =>
        new WebSource(
          spec,
          origin,
          "source",
          directory,
          captureQuality(s.size, spec, s.capture).density,
        ),
    );
    try {
      const results = await Promise.allSettled(
        next.map((source) => source.ready()),
      );
      const failed = results.find((result) => result.status === "rejected");
      if (failed?.status === "rejected") throw failed.reason;
    } catch (e) {
      await Promise.all(next.map((s) => s.dispose()));
      throw e;
    }
    await Promise.all(sources.map((s) => s.dispose()));
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
  return sampleSources(
    sources,
    time,
    values(scene()),
    scene().sources.map((spec) =>
      captureQuality(scene().size, spec, scene().capture),
    ),
    "frozen",
  );
}
async function state() {
  return {
    scenes: [{ id: scene().id, name: scene().name }],
    scene: scene(),
    revision: "frozen",
    codeRevision: 0,
    path: sceneDir(),
    error: null,
    jobs: jobId ? [] : await jobs.list(),
  };
}
async function command(c: Command): Promise<any> {
  if (!c || typeof c.type !== "string")
    throw new Error("Command requires a type");
  if (c.type === "state") return state();
  if (c.type === "prepare") {
    if (!frozenCompositions.size) return prepare();
    const compositions: CompositionGraph = {};
    for (const id of frozenCompositions.keys())
      compositions[id] = await (await frozenSession(id)).prepare();
    return { ...compositions[scene().id], compositions };
  }
  if (c.type === "frame") {
    const time = Number(c.time);
    const document =
      frozenCompositions.get(String(c.sceneId ?? scene().id))?.scene ?? scene();
    if (!Number.isFinite(time) || time < 0 || time > document.duration)
      throw new Error("Invalid time");
    currentFrame = time;
    const result = frozenCompositions.size
      ? await (
          await frozenSession(document.id)
        ).frame(time, "frozen", Number(c.captureZoom ?? 1), c.overrides as any)
      : await sample(time);
    return c.includeContext
      ? frameForReceiver(result, c.knownImages)
      : result.images;
  }
  throw new Error("Frozen workers are read only");
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
  await startRuntime(root, runtime, jobs, process.argv.includes("--browser"));
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
      // Claim the queued run before spawning. A later queued state can then only
      // be a fresh resume request and must survive this worker's cleanup/exit.
      job.phase = "capturing";
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
      if (
        !["complete", "cancelled", "failed", "queued"].includes(latest.phase)
      ) {
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
  let encoder: PNGEncoder | undefined;
  let cancelEncoder: ReturnType<typeof setInterval> | undefined;
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
    for (const spec of frozen.sources)
      await validatePackagedSource(spec, frozenDirectory);
    await fs.mkdir(moduleDir, { recursive: true });
    await fs.copyFile(
      path.join(dir, "scene.js"),
      path.join(moduleDir, job.id + ".js"),
    );
    try {
      const ids = await readJSON<string[]>(path.join(dir, "compositions.json"));
      frozenCompositions.set(frozen.id, {
        scene: frozen,
        directory: frozenDirectory,
        module: path.join(moduleDir, job.id + ".js"),
      });
      for (const id of ids) {
        if (!/^[a-z0-9-]+$/.test(id))
          throw new Error("Invalid frozen composition ID");
        const directory = path.join(dir, "compositions", id, "scene");
        const scene = SceneSchema.parse(
          await readJSON(path.join(directory, "scene.json")),
        );
        const module = path.join(moduleDir, job.id + "-" + id + ".js");
        await fs.copyFile(
          path.join(dir, "compositions", id, "scene.js"),
          module,
        );
        for (const spec of scene.sources)
          await validatePackagedSource(spec, directory);
        frozenCompositions.set(id, { scene, directory, module });
      }
      validateCompositionGraph(
        frozen.id,
        Object.fromEntries(
          [...frozenCompositions].map(([id, entry]) => [id, entry.scene]),
        ),
      );
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error;
    }
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
    const temp = path.join(dir, "output.partial.mp4");
    if ((frozen.render?.encoding ?? "pipelined") === "pipelined") {
      encoder = new PNGEncoder(job.fps, job.total, temp);
      cancelEncoder = setInterval(() => {
        void cancelled()
          .then((cancel) => {
            if (cancel) void encoder?.abort();
          })
          .catch(() => {});
      }, 250);
    }
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
      let png: Buffer | undefined;
      try {
        png = await fs.readFile(file);
        const im = nativeImage.createFromBuffer(png);
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
            png = Buffer.from(data.split(",")[1], "base64");
            const image = nativeImage.createFromBuffer(png);
            const size = image.getSize();
            if (size.width !== job.width || size.height !== job.height)
              throw new Error("Rendered frame has unexpected dimensions");
            await atomicWrite(file, png);
            rendered = true;
          } catch (e) {
            if (attempt === 2) throw e;
          }
        }
      }
      if (encoder) await encoder.write(png!);
      job.frame = i + 1;
      await jobs.update(job);
    }
    if (await cancelled()) throw new Error("Cancelled");
    job.phase = "encoding";
    await jobs.update(job);
    if (encoder) await encoder.finish();
    else
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
          ...mp4EncodingArguments(job.total, temp),
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
      Number(probe.nb_read_frames) !== job.total ||
      (() => {
        const [n, d] = String(probe.r_frame_rate).split("/").map(Number);
        return n / d !== job.fps;
      })()
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
    clearInterval(cancelEncoder);
    await encoder?.abort();
    await Promise.all(sources.map((s) => s.dispose()));
    await Promise.all(
      [...frozenSessions.values()].map((session) => session.dispose()),
    );
    frozenSessions.clear();
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
  /* The project runtime outlives its viewers. */
});
