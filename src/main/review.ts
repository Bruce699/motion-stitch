import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { BrowserWindow } from "electron";
import {
  ReviewRequestSchema,
  detailRect,
  reviewTimes,
  type ReviewRequest,
} from "../core/review";
import { SceneSchema, type SceneDocument } from "../core/schema";
import {
  validateCompositionGraph,
  type CompositionGraph,
} from "../core/compositions";
import { frameForReceiver } from "../core/frame-transfer";
import { atomicWrite, hash, readJSON, safePath } from "./files";
import { SceneSession, compileScene, type SessionStore } from "./scene-session";
import type { SceneStore } from "./store";
import { WebSource, deadline } from "./source";
import { sourceFingerprint } from "./source-fingerprint";
import { validatePackagedSource } from "./source-host";
import { serve } from "./server";
import { PNGEncoder } from "./png-encoder";

type FrozenEntry = {
  scene: SceneDocument;
  revision: string;
  directory: string;
  module: string;
};
type Snapshot = {
  sceneId: string;
  revision: string;
  key: string;
  runtimeHash: string;
  entries: Record<string, FrozenEntry>;
};
type Frame = {
  time: number;
  path: string;
  contextPath: string;
  context: any;
  elapsedMs: number;
};
type Artifact = {
  path: string;
  label: string;
  kind: "overview" | "detail" | "motion";
};
type Review = {
  version: 1;
  id: string;
  sceneId: string;
  revision: string;
  snapshot: Snapshot;
  compareTo?: string;
  cameraId?: string;
  times: number[];
  focus: string[];
  frames: Frame[];
  artifacts: Artifact[];
  elapsedMs: number;
  createdAt: string;
  motion?: {
    phase: "queued" | "rendering" | "complete" | "failed";
    start: number;
    end: number;
    fps: number;
    path?: string;
    error?: string;
    elapsedMs?: number;
    renderedFrames?: number;
    totalFrames?: number;
    artifactIndex?: number;
  };
};

/** A private renderer using the same engine and browser-source path as exports. */
class ReviewRenderer {
  private window?: BrowserWindow;
  private server?: Awaited<ReturnType<typeof serve>>;
  private snapshot?: Snapshot;
  private sessions = new Map<
    string,
    { store: SessionStore & { module: string }; session: SceneSession }
  >();
  private disposed = false;
  constructor(
    private root: string,
    private runtime: Promise<string>,
  ) {
    void runtime.catch(() => {});
  }
  private async ensure() {
    if (this.disposed) throw new Error("Review renderer stopped");
    if (this.window && !this.window.isDestroyed()) return;
    this.server ??= await serve({
      ui: path.join(await this.runtime, "review-ui"),
      scene: () => this.root,
      modules: path.join(this.root, ".tilt", "modules"),
      token: randomBytes(32).toString("hex"),
      command: async (c) => {
        if (!this.snapshot) throw new Error("No review snapshot");
        if (c.type === "prepare") {
          const graph: CompositionGraph = {};
          for (const id of Object.keys(this.snapshot.entries))
            graph[id] = await this.sessions.get(id)!.session.prepare();
          return {
            ...graph[this.snapshot.sceneId],
            compositions: graph,
            key: this.snapshot.key,
          };
        }
        if (c.type === "frame") {
          const entry = this.sessions.get(String(c.sceneId));
          const time = Number(c.time);
          if (
            !entry ||
            !Number.isFinite(time) ||
            time < 0 ||
            time > entry.store.scene.duration
          )
            throw new Error("Invalid frozen frame");
          return frameForReceiver(
            await entry.session.frame(
              time,
              c.revision as string | undefined,
              1,
              c.overrides as any,
            ),
            c.knownImages,
          );
        }
        throw new Error("Review renderer is read only");
      },
    });
    this.window = new BrowserWindow({
      show: false,
      width: 640,
      height: 360,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
        offscreen: true,
      },
    });
    this.window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    this.window.webContents.on("will-navigate", (e, url) => {
      if (new URL(url).origin !== this.server!.origin) e.preventDefault();
    });
    await this.window.loadURL(this.server.origin);
    await deadline(
      (async () => {
        while (
          !(await this.window!.webContents.executeJavaScript(
            "Boolean(window.__tiltReview)",
          ))
        )
          await new Promise((r) => setTimeout(r, 20));
      })(),
      15000,
      "Review renderer startup",
    );
  }
  async load(snapshot: Snapshot, cameraId?: string) {
    await this.ensure();
    if (this.snapshot?.key !== snapshot.key) {
      await this.call("dispose");
      for (const [id, entry] of this.sessions)
        if (!snapshot.entries[id]) {
          await entry.session.dispose();
          this.sessions.delete(id);
        }
      for (const [id, frozen] of Object.entries(snapshot.entries)) {
        let entry = this.sessions.get(id);
        if (!entry) {
          const store = {
            root: this.root,
            id,
            scene: frozen.scene,
            revision: frozen.revision,
            codeRevision: 0,
            error: null,
            module: frozen.module,
            previewDirectory: async () => frozen.directory,
          };
          const session = new SceneSession(store, this.server!.origin, {
            compile: async () => store.module,
            fingerprint: sourceFingerprint,
            createSource: (...args) => new WebSource(...args),
          });
          entry = { store, session };
          this.sessions.set(id, entry);
        } else {
          Object.assign(entry.store, {
            scene: frozen.scene,
            revision: frozen.revision,
            codeRevision: entry.store.codeRevision + 1,
            module: frozen.module,
            previewDirectory: async () => frozen.directory,
          });
        }
      }
      this.snapshot = snapshot;
    }
    await this.call("prepare", cameraId);
  }
  call(method: string, ...args: any[]): Promise<any> {
    if (!this.window || this.window.isDestroyed())
      throw new Error("Review renderer unavailable");
    return deadline(
      this.window.webContents.executeJavaScript(
        `window.__tiltReview[${JSON.stringify(method)}](...${JSON.stringify(args)})`,
      ),
      60000,
      `Review ${method}`,
    );
  }
  async dispose() {
    this.disposed = true;
    if (this.window && !this.window.isDestroyed()) this.window.destroy();
    await Promise.allSettled(
      [...this.sessions.values()].map((s) => s.session.dispose()),
    );
    this.sessions.clear();
    this.server?.close();
    this.server = undefined;
  }
}

export class Reviews {
  private queue: Promise<unknown> = Promise.resolve();
  private renderer: ReviewRenderer;
  private motionRenderer?: ReviewRenderer;
  private motionQueue: Promise<unknown> = Promise.resolve();
  private frozenRuntime: Promise<{ directory: string; hash: string }>;
  private stopped = false;
  constructor(
    private root: string,
    private runtime: string,
    private getStore: (id: string) => Promise<SceneStore>,
  ) {
    // Pin assets at runtime startup: rebuilding dist must not change an in-flight review.
    this.frozenRuntime = this.pinRuntime();
    void this.frozenRuntime.catch(() => {});
    this.renderer = new ReviewRenderer(
      root,
      this.frozenRuntime.then((r) => r.directory),
    );
  }
  private async pinRuntime() {
    const [backend, script, html] = await Promise.all([
      fs.readFile(path.join(this.runtime, "main.cjs")),
      fs.readFile(path.join(this.runtime, "review-ui/review.js")),
      fs.readFile(path.join(this.runtime, "review-ui/index.html")),
    ]);
    const digest = hash(Buffer.concat([backend, script, html]));
    const directory = path.join(this.root, ".tilt/review-runtime", digest);
    await atomicWrite(path.join(directory, "review-ui/review.js"), script);
    await atomicWrite(path.join(directory, "review-ui/index.html"), html);
    return { directory, hash: digest };
  }
  private get directory() {
    return path.join(this.root, ".tilt", "reviews");
  }
  private async freeze(sceneId: string, expected?: string): Promise<Snapshot> {
    const entries: Record<string, FrozenEntry> = {};
    const visit = async (id: string) => {
      if (entries[id]) return;
      const store = await this.getStore(id);
      await store.sync();
      if (store.error) throw new Error(store.error);
      if (store.journal.group)
        throw new Error(`Apply the open edit in ${id} before review`);
      if (id === sceneId && expected && expected !== store.revision)
        throw new Error("Review revision changed; read state and retry");
      const revision = store.revision,
        directory = await store.journal.materialize(revision);
      const scene = SceneSchema.parse(
        await readJSON(path.join(directory, "scene.json")),
      );
      if (scene.sources.some((s) => s.url))
        throw new Error(
          "Frozen review requires local sources; live URLs cannot be compared reliably",
        );
      for (const source of scene.sources)
        await validatePackagedSource(source, directory);
      entries[id] = {
        scene,
        revision,
        directory,
        module: await compileScene(this.root, directory, scene),
      };
      for (const clip of scene.clips ?? []) await visit(clip.compositionId);
    };
    await visit(sceneId);
    for (const entry of Object.values(entries)) {
      const store = await this.getStore(entry.scene.id);
      await store.sync();
      if (store.revision !== entry.revision || store.journal.group)
        throw new Error(
          "Composition graph changed while freezing review; retry",
        );
    }
    validateCompositionGraph(
      sceneId,
      Object.fromEntries(
        Object.entries(entries).map(([id, e]) => [id, e.scene]),
      ),
    );
    const runtimeHash = (await this.frozenRuntime).hash;
    const key = hash(
      JSON.stringify([
        runtimeHash,
        Object.entries(entries).map(([id, e]) => [id, e.revision, e.module]),
      ]),
    );
    return {
      sceneId,
      revision: entries[sceneId].revision,
      key,
      runtimeHash,
      entries,
    };
  }
  private async save(review: Review) {
    await atomicWrite(
      path.join(this.directory, review.id, "review.json"),
      JSON.stringify(review, null, 2),
    );
  }
  private read(id: string): Promise<Review> {
    if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error("Invalid review ID");
    return readJSON(path.join(this.directory, id, "review.json"));
  }
  private async png(file: string, data: string) {
    if (!data.startsWith("data:image/png;base64,"))
      throw new Error("Review did not return PNG pixels");
    await atomicWrite(file, Buffer.from(data.slice(22), "base64"));
  }
  private async data(file: string) {
    const relative = path.relative(this.directory, file);
    const checked = await safePath(this.directory, relative);
    return (
      "data:image/png;base64," + (await fs.readFile(checked)).toString("base64")
    );
  }
  async status(id: string, includeImages = false, artifactIndices?: number[]) {
    const review = await this.read(id);
    if (
      review.motion &&
      ["queued", "rendering"].includes(review.motion.phase) &&
      !this.activeMotion.has(id)
    ) {
      review.motion.phase = "failed";
      review.motion.error =
        "Runtime restarted during motion review; request a new review";
      await this.save(review);
    }
    const { snapshot, ...result } = review;
    const indices =
      artifactIndices ?? review.artifacts.slice(0, 4).map((_, i) => i);
    if (indices.some((i) => !review.artifacts[i]))
      throw new Error("Unknown review artifact index");
    const inlineImages = includeImages
      ? await Promise.all(
          indices.map(async (i) => {
            const a = review.artifacts[i];
            return {
              label: a.label,
              mimeType: "image/png",
              data: (await this.data(a.path)).slice(22),
            };
          }),
        )
      : undefined;
    return {
      ...result,
      frames: review.frames.map(({ context, ...frame }) => ({
        ...frame,
        camera: context.camera,
        sourceQuality: context.sourceQuality,
        warnings: context.warnings,
        clippedLayers: context.projected
          .filter((p: any) => p.clipped)
          .map((p: any) => p.id),
      })),
      graphRevisions: Object.fromEntries(
        Object.entries(snapshot.entries).map(([id, e]) => [id, e.revision]),
      ),
      outputSize: snapshot.entries[review.sceneId].scene.size,
      motionQuality: review.motion
        ? "Full scene render, downsampled to fit 1920×1080; H.264 motion preview"
        : undefined,
      inlineArtifactIndices: includeImages ? indices : undefined,
      manifestPath: path.join(this.directory, id, "review.json"),
      inlineImages,
    };
  }
  review(sceneId: string, input: ReviewRequest) {
    const task = this.queue.then(() =>
      this.create(sceneId, ReviewRequestSchema.parse(input)),
    );
    this.queue = task.catch(() => {});
    return task;
  }
  private async create(sceneId: string, input: ReviewRequest) {
    if (this.stopped) throw new Error("Reviews stopped");
    const started = performance.now(),
      snapshot = await this.freeze(sceneId, input.revision);
    const scene = snapshot.entries[sceneId].scene;
    const baseline = input.compareTo
      ? await this.read(input.compareTo)
      : undefined;
    if (
      baseline &&
      (baseline.sceneId !== sceneId ||
        baseline.snapshot.runtimeHash !== snapshot.runtimeHash)
    )
      throw new Error(
        "Compare reviews from the same composition and runtime build",
      );
    if (
      baseline &&
      JSON.stringify(baseline.snapshot.entries[sceneId].scene.size) !==
        JSON.stringify(scene.size)
    )
      throw new Error("Comparison requires the same output dimensions");
    const cameraId = input.cameraId ?? baseline?.cameraId;
    if (baseline && cameraId !== baseline.cameraId)
      throw new Error("Comparison requires the same camera selection");
    const times = reviewTimes(
      input.times ?? baseline?.times,
      scene.duration,
      scene.fps,
    );
    if (baseline)
      reviewTimes(
        times,
        baseline.snapshot.entries[sceneId].scene.duration,
        scene.fps,
      );
    if (input.motion && input.motion.end > scene.duration)
      throw new Error("Motion interval exceeds composition duration");
    for (const focus of input.focus) {
      const [sourceId, layerId] = focus.split("/");
      if (
        !scene.sources
          .find((s) => s.id === sourceId)
          ?.layers.some((l) => l.id === layerId)
      )
        throw new Error("Unknown focus layer: " + focus);
    }
    const review: Review = {
      version: 1,
      id: randomUUID(),
      sceneId,
      revision: snapshot.revision,
      snapshot,
      compareTo: baseline?.id,
      cameraId,
      times,
      focus: input.focus,
      frames: [],
      artifacts: [],
      elapsedMs: 0,
      createdAt: new Date().toISOString(),
    };
    const dir = path.join(this.directory, review.id);
    const oldFrames: Frame[] = [];
    if (baseline) {
      for (const time of times) {
        const cached = baseline.frames.find((f) => f.time === time);
        if (cached) oldFrames.push(cached);
        else {
          await this.renderer.load(baseline.snapshot, cameraId);
          const start = performance.now(),
            frame = await this.renderer.call("frame", time),
            file = path.join(dir, `before-${oldFrames.length}.png`);
          await this.png(file, frame.data);
          const contextPath = file.replace(".png", ".json");
          await atomicWrite(contextPath, JSON.stringify(frame.context));
          oldFrames.push({
            time,
            path: file,
            contextPath,
            context: frame.context,
            elapsedMs: performance.now() - start,
          });
        }
      }
    }
    await this.renderer.load(snapshot, cameraId);
    for (const [i, time] of times.entries()) {
      const start = performance.now(),
        frame = await this.renderer.call("frame", time),
        file = path.join(dir, `frame-${i}.png`),
        contextPath = path.join(dir, `frame-${i}.json`);
      await this.png(file, frame.data);
      await atomicWrite(
        contextPath,
        JSON.stringify(
          {
            revision: snapshot.revision,
            graphKey: snapshot.key,
            time,
            ...frame.context,
          },
          null,
          2,
        ),
      );
      review.frames.push({
        time,
        path: file,
        contextPath,
        context: frame.context,
        elapsedMs: performance.now() - start,
      });
    }
    // Small pages stay legible in image-capable agents with downsampling limits.
    for (let offset = 0; offset < times.length; offset += 4) {
      const items = [];
      for (let i = offset; i < Math.min(times.length, offset + 4); i++) {
        if (baseline)
          items.push({
            data: await this.data(oldFrames[i].path),
            label: `Before · ${times[i].toFixed(3)}s · ${baseline.revision.slice(0, 8)}`,
          });
        items.push({
          data: await this.data(review.frames[i].path),
          label: `${baseline ? "After" : scene.name} · ${times[i].toFixed(3)}s · ${review.revision.slice(0, 8)}`,
        });
      }
      const file = path.join(dir, `overview-${offset / 4}.png`);
      await this.png(file, await this.renderer.call("sheet", items, 2));
      review.artifacts.push({
        path: file,
        kind: "overview",
        label: baseline
          ? "Matched times: before on left, after on right"
          : "Time-ordered composition frames",
      });
    }
    for (const focus of input.focus)
      for (const [i, frame] of review.frames.entries()) {
        const current = frame.context.projected.find(
          (p: any) => p.id === focus,
        );
        const before = oldFrames[i]?.context.projected.find(
          (p: any) => p.id === focus,
        );
        const rect = detailRect(
          [current?.bounds, before?.bounds].filter(Boolean),
          scene.size.width,
          scene.size.height,
        );
        if (!rect) continue;
        const items = [];
        if (baseline)
          items.push({
            data: await this.renderer.call(
              "crop",
              await this.data(oldFrames[i].path),
              rect,
            ),
            label: `Before · ${focus} · ${frame.time.toFixed(3)}s · 1:1`,
          });
        items.push({
          data: await this.renderer.call(
            "crop",
            await this.data(frame.path),
            rect,
          ),
          label: `${baseline ? "After" : "Detail"} · ${focus} · ${frame.time.toFixed(3)}s · 1:1`,
        });
        const file = path.join(
          dir,
          `detail-${focus.replace("/", "-")}-${i}.png`,
        );
        await this.png(
          file,
          await this.renderer.call("sheet", items, items.length, rect.width),
        );
        review.artifacts.push({
          path: file,
          kind: "detail",
          label: `${focus} at ${frame.time}s; native-pixel window ${JSON.stringify(rect)} (may show only part of a large layer)`,
        });
      }
    review.elapsedMs = performance.now() - started;
    if (input.motion) review.motion = { ...input.motion, phase: "queued" };
    if (input.motion) this.activeMotion.add(review.id);
    await this.save(review);
    if (input.motion) {
      const task = this.motionQueue.then(() => this.renderMotion(review));
      this.motionQueue = task.catch(() => {});
    }
    return this.status(review.id, input.includeImages);
  }
  private activeMotion = new Set<string>();
  private async renderMotion(review: Review) {
    const motion = review.motion!,
      started = performance.now();
    let encoder: PNGEncoder | undefined;
    try {
      if (this.stopped) throw new Error("Review runtime stopped");
      this.motionRenderer ??= new ReviewRenderer(
        this.root,
        this.frozenRuntime.then((r) => r.directory),
      );
      motion.phase = "rendering";
      await this.save(review);
      await this.motionRenderer.load(review.snapshot, review.cameraId);
      const count = Math.ceil((motion.end - motion.start) * motion.fps);
      motion.totalFrames = count;
      motion.renderedFrames = 0;
      const strip: { data: string; label: string }[] = [];
      const stripFrames = new Set(
        Array.from({ length: Math.min(6, count) }, (_, i) =>
          Math.round((i * (count - 1)) / Math.max(1, Math.min(6, count) - 1)),
        ),
      );
      const output = path.join(this.directory, review.id, "motion.mp4"),
        temporary = output.replace(".mp4", ".partial.mp4");
      encoder = new PNGEncoder(motion.fps, count, temporary);
      for (let i = 0; i < count; i++) {
        if (this.stopped) throw new Error("Review runtime stopped");
        const data: string = await this.motionRenderer.call(
          "motionFrame",
          motion.start + i / motion.fps,
        );
        await encoder.write(Buffer.from(data.slice(22), "base64"));
        if (stripFrames.has(i))
          strip.push({
            data,
            label: `${(motion.start + i / motion.fps).toFixed(3)}s · motion preview`,
          });
        motion.renderedFrames = i + 1;
        if (i % 15 === 0) await this.save(review);
      }
      await encoder.finish();
      await fs.rename(temporary, output);
      const stripPath = path.join(
        this.directory,
        review.id,
        "motion-strip.png",
      );
      await this.png(
        stripPath,
        await this.motionRenderer.call("sheet", strip, 3, 480),
      );
      motion.artifactIndex = review.artifacts.length;
      review.artifacts.push({
        path: stripPath,
        label:
          "Six timed motion samples; video is needed to judge continuous rhythm",
        kind: "motion",
      });
      motion.phase = "complete";
      motion.path = output;
      motion.elapsedMs = performance.now() - started;
    } catch (error) {
      await encoder?.abort();
      motion.phase = "failed";
      motion.error = String(error);
    } finally {
      this.activeMotion.delete(review.id);
      await this.save(review);
    }
  }
  async dispose() {
    this.stopped = true;
    await Promise.allSettled([
      this.renderer.dispose(),
      this.motionRenderer?.dispose(),
    ]);
    await Promise.allSettled([this.queue, this.motionQueue]);
  }
}
