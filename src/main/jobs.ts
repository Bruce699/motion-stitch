import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import type { RenderJob, SceneDocument } from "../core/schema";
import { alive, atomicWrite, hash, manifest, readJSON } from "./files";
import { validatePackagedSource } from "./source-host";

export class Jobs {
  private submissions: Promise<unknown> = Promise.resolve();
  constructor(
    public root: string,
    public runtime: string,
    public electron: string,
    public electronVersion: string,
  ) {}
  get directory() {
    return path.join(this.root, ".tilt", "jobs");
  }
  async list() {
    await fs.mkdir(this.directory, { recursive: true });
    const jobs: RenderJob[] = [];
    for (const id of await fs.readdir(this.directory)) {
      try {
        const j = await readJSON<RenderJob>(
          path.join(this.directory, id, "job.json"),
        );
        jobs.push(j);
      } catch {}
    }
    return jobs.sort((a, b) => b.created.localeCompare(a.created));
  }
  async update(job: RenderJob) {
    job.updated = new Date().toISOString();
    await atomicWrite(
      path.join(this.directory, job.id, "job.json"),
      JSON.stringify(job, null, 2) + "\n",
    );
  }
  async submit(
    scene: SceneDocument,
    sceneDir: string,
    compile: () => Promise<string>,
    requestId: string,
  ) {
    const task = this.submissions.then(async () => {
      const existing = (await this.list()).find(
        (j) => j.requestId === requestId,
      );
      if (existing) return existing;
      if (scene.sources.some((s) => s.url))
        throw new Error(
          "Export needs local source files. Copy the app’s production build into the scene and set source.entry. A live URL cannot be frozen reliably.",
        );
      for (const source of scene.sources)
        await validatePackagedSource(source, sceneDir);
      const job: RenderJob = {
        version: 1,
        id: randomUUID(),
        requestId,
        sceneId: scene.id,
        sceneName: scene.name,
        phase: "preparing",
        frame: 0,
        total: Math.ceil(scene.duration * scene.fps),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        width: scene.size.width,
        height: scene.size.height,
        fps: scene.fps,
        duration: scene.duration,
        runtime: "",
        electronVersion: this.electronVersion,
      };
      await this.update(job);
      const dir = path.join(this.directory, job.id);
      try {
        const before = await manifest(sceneDir);
        const module = await compile();
        await fs.cp(sceneDir, path.join(dir, "scene"), {
          recursive: true,
          filter: (s) =>
            !path
              .relative(sceneDir, s)
              .split(path.sep)
              .some((n) => n.startsWith(".") || n === "node_modules"),
        });
        const after = await manifest(sceneDir);
        const frozen = await manifest(path.join(dir, "scene"));
        if (
          JSON.stringify(before) !== JSON.stringify(after) ||
          JSON.stringify(before) !== JSON.stringify(frozen)
        )
          throw new Error(
            "Source changed while freezing. Submit again after saving.",
          );
        await atomicWrite(
          path.join(dir, "scene", "scene.json"),
          JSON.stringify(scene, null, 2),
        );
        await fs.copyFile(module, path.join(dir, "scene.js"));
        const runtimeManifest = await manifest(this.runtime);
        const runtimeHash = hash(JSON.stringify(runtimeManifest)).slice(0, 20);
        const runtime = path.join(this.root, ".tilt", "runtimes", runtimeHash);
        try {
          await fs.access(path.join(runtime, "main.cjs"));
        } catch {
          await fs.cp(this.runtime, runtime, { recursive: true });
        }
        job.runtime = runtime;
        await atomicWrite(
          path.join(dir, "manifest.json"),
          JSON.stringify(
            {
              source: before,
              runtime: runtimeManifest,
              electron: this.electronVersion,
            },
            null,
            2,
          ),
        );
        job.phase = "queued";
        await this.update(job);
        await this.startCoordinator();
        return job;
      } catch (e) {
        job.phase = "failed";
        job.error = String(e);
        await this.update(job);
        throw e;
      }
    });
    this.submissions = task.catch(() => {});
    return task;
  }
  async startCoordinator() {
    const log = await fs.open(path.join(this.root, ".tilt", "render.log"), "a");
    const child = spawn(
      this.electron,
      [
        path.join(this.runtime, "main.cjs"),
        "--coordinator",
        "--project",
        this.root,
      ],
      {
        detached: true,
        stdio: ["ignore", log.fd, log.fd],
        env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
      },
    );
    child.unref();
    await log.close();
  }
  async cancel(id: string) {
    const j = await this.get(id);
    if (["complete", "cancelled"].includes(j.phase)) return j;
    await atomicWrite(path.join(this.directory, id, "cancel"), "cancel");
    if (!alive(j.pid)) {
      j.phase = "cancelled";
      await this.update(j);
    }
    return j;
  }
  async resume(id: string) {
    const j = await this.get(id);
    if (j.phase === "complete") return j;
    if (!j.runtime)
      throw new Error("This snapshot was not completed. Submit a new render.");
    if (alive(j.pid)) throw new Error("Render is still running");
    if (j.electronVersion !== this.electronVersion)
      throw new Error("This job requires its original Electron version");
    await fs.rm(path.join(this.directory, id, "cancel"), { force: true });
    j.phase = "queued";
    j.error = undefined;
    j.pid = undefined;
    await this.update(j);
    await this.startCoordinator();
    return j;
  }
  async get(id: string) {
    if (!/^[\w-]+$/.test(id)) throw new Error("Invalid job ID");
    return readJSON<RenderJob>(path.join(this.directory, id, "job.json"));
  }
  async reconcile() {
    for (const j of await this.list())
      if (
        ["capturing", "encoding", "queued"].includes(j.phase) &&
        !alive(j.pid)
      ) {
        j.phase = "queued";
        await this.update(j);
      }
    if ((await this.list()).some((j) => j.phase === "queued"))
      await this.startCoordinator();
  }
}
