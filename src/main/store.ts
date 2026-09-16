import fs from "node:fs/promises";
import { watch, type FSWatcher } from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { SceneSchema, type SceneDocument } from "../core/schema";
import { atomicWrite, hash, readJSON, safePath } from "./files";

export class SceneStore extends EventEmitter {
  scene!: SceneDocument;
  revision = "";
  codeRevision = 0;
  error: string | null = null;
  id = "";
  watcher?: FSWatcher;
  private timer?: NodeJS.Timeout;
  private sourceDirty = false;
  private undo: SceneDocument[] = [];
  private redo: SceneDocument[] = [];
  private queue: Promise<unknown> = Promise.resolve();
  constructor(public root: string) {
    super();
  }
  get directory() {
    return path.join(this.root, "scenes", this.id);
  }
  async list() {
    const all = await fs.readdir(path.join(this.root, "scenes"), {
      withFileTypes: true,
    });
    const out = [];
    for (const d of all) {
      if (!d.isDirectory() || d.name.startsWith(".")) continue;
      try {
        const s = SceneSchema.parse(
          await readJSON(path.join(this.root, "scenes", d.name, "scene.json")),
        );
        out.push({ id: d.name, name: s.name });
      } catch {}
    }
    return out;
  }
  async open(id: string) {
    return this.exclusive(() => this.load(id));
  }
  private async load(id: string) {
    if (!/^[a-z0-9-]+$/.test(id)) throw new Error("Invalid scene ID");
    const scene = SceneSchema.parse(
      await readJSON(path.join(this.root, "scenes", id, "scene.json")),
    );
    if (scene.id !== id) throw new Error("Scene ID must match its folder");
    this.watcher?.close();
    clearTimeout(this.timer);
    this.sourceDirty = false;
    this.id = id;
    this.scene = scene;
    this.revision = hash(JSON.stringify(scene));
    this.codeRevision++;
    this.error = null;
    this.undo = [];
    this.redo = [];
    this.watcher = watch(
      this.directory,
      { recursive: true },
      (_event, file) => {
        if (
          !file ||
          file.includes(".tmp") ||
          file.split("/").some((x) => x.startsWith("."))
        )
          return;
        if (file !== "scene.json") this.sourceDirty = true;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          const changed = this.sourceDirty ? "source" : "scene.json";
          this.sourceDirty = false;
          void this.exclusive(() => this.refresh(changed));
        }, 120);
      },
    );
    this.emit("change");
  }
  private exclusive<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(fn, fn);
    this.queue = next.catch(() => {});
    return next;
  }
  private async refresh(file: string) {
    try {
      const s = SceneSchema.parse(
        await readJSON(path.join(this.directory, "scene.json")),
      );
      if (s.id !== this.id) throw new Error("Scene ID must match its folder");
      const rev = hash(JSON.stringify(s));
      if (rev !== this.revision) {
        this.undo.push(this.scene);
        this.redo = [];
        this.scene = s;
        this.revision = rev;
      }
      if (file !== "scene.json") this.codeRevision++;
      this.error = null;
    } catch (e) {
      this.error = String(e);
    }
    this.emit("change");
  }
  async edit(change: (scene: SceneDocument) => void, expected?: string) {
    return this.exclusive(async () => {
      const disk = SceneSchema.parse(
        await readJSON(path.join(this.directory, "scene.json")),
      );
      const diskRev = hash(JSON.stringify(disk));
      if (expected && expected !== diskRev)
        throw new Error("Scene changed on disk. Refresh before replacing it.");
      const next = structuredClone(disk);
      change(next);
      const parsed = SceneSchema.parse(next);
      if (parsed.id !== this.id) throw new Error("Scene ID cannot change");
      this.undo.push(disk);
      this.undo = this.undo.slice(-100);
      this.redo = [];
      await this.persist(parsed);
      return this.scene;
    });
  }
  private async persist(scene: SceneDocument) {
    await atomicWrite(
      path.join(this.directory, "scene.json"),
      JSON.stringify(scene, null, 2) + "\n",
    );
    this.scene = scene;
    this.revision = hash(JSON.stringify(scene));
    this.error = null;
    this.emit("change");
  }
  async history(direction: "undo" | "redo") {
    return this.exclusive(async () => {
      const disk = SceneSchema.parse(
        await readJSON(path.join(this.directory, "scene.json")),
      );
      if (hash(JSON.stringify(disk)) !== this.revision) {
        await this.refresh("scene.json");
        throw new Error("External edit loaded. Try undo again.");
      }
      const from = direction === "undo" ? this.undo : this.redo;
      const to = direction === "undo" ? this.redo : this.undo;
      const next = from.pop();
      if (next) {
        to.push(this.scene);
        await this.persist(next);
      }
      return this.scene;
    });
  }
  async readFile(relative: string) {
    return fs.readFile(await safePath(this.directory, relative), "utf8");
  }
  async writeFile(relative: string, content: string, expectedHash?: string) {
    return this.exclusive(async () => {
      if (relative === "scene.json")
        throw new Error("Use replace_scene with its revision for scene.json");
      const file = await safePath(this.directory, relative, true);
      if (expectedHash) {
        const current = await fs.readFile(file, "utf8");
        if (hash(current) !== expectedHash)
          throw new Error("File changed; read it before writing again");
      }
      await atomicWrite(file, content);
      return { path: relative, hash: hash(content) };
    });
  }
  async create(name: string) {
    const slug =
      (name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "scene") +
      "-" +
      randomUUID().slice(0, 8);
    const dir = path.join(this.root, "scenes", slug);
    await fs.cp(path.join(this.root, "scenes", "interface"), dir, {
      recursive: true,
      filter: (s) => !s.includes("node_modules"),
    });
    const scene = SceneSchema.parse(
      await readJSON(path.join(dir, "scene.json")),
    );
    scene.id = slug;
    scene.name = name;
    await atomicWrite(
      path.join(dir, "scene.json"),
      JSON.stringify(scene, null, 2) + "\n",
    );
    await this.open(slug);
    return scene;
  }
}
