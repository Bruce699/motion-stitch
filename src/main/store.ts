import fs from "node:fs/promises";
import { watch, type FSWatcher } from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import {
  DEFAULT_FRAME_RATE,
  SceneSchema,
  type SceneDocument,
} from "../core/schema";
import { atomicWrite, hash, readJSON, safePath } from "./files";
import { SceneHistory } from "./history";

export class SceneStore extends EventEmitter {
  scene!: SceneDocument;
  revision = "";
  codeRevision = 0;
  error: string | null = null;
  id = "";
  watcher?: FSWatcher;
  journal!: SceneHistory;
  private timer?: NodeJS.Timeout;
  private sourceHash = "";
  private queue: Promise<unknown> = Promise.resolve();
  constructor(public root: string) {
    super();
  }
  get directory() {
    return path.join(this.root, "scenes", this.id);
  }
  exclusive<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(fn, fn);
    this.queue = next.catch(() => {});
    return next;
  }
  async list() {
    const out = [];
    for (const d of await fs.readdir(path.join(this.root, "scenes"), {
      withFileTypes: true,
    })) {
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
    return this.exclusive(async () => {
      if (!/^[a-z0-9-]+$/.test(id)) throw new Error("Invalid scene ID");
      this.watcher?.close();
      clearTimeout(this.timer);
      this.id = id;
      this.journal = new SceneHistory(
        this.directory,
        path.join(this.root, ".tilt", "history", id),
      );
      await this.journal.init();
      await this.refresh(false);
      if (!this.scene) {
        const entries = this.journal.ledger.entries;
        for (let i = entries.length - 1; i >= 0; i--) {
          try {
            const dir = await this.journal.materialize(entries[i].revision);
            this.scene = SceneSchema.parse(
              await readJSON(path.join(dir, "scene.json")),
            );
            break;
          } catch {}
        }
      }
      if (!this.scene) throw new Error(this.error || "No valid scene document");
      this.watcher = watch(
        this.directory,
        { recursive: true },
        (_event, file) => {
          if (
            !file ||
            file.endsWith(".tmp") ||
            file.split("/").some((p) => p.startsWith("."))
          )
            return;
          clearTimeout(this.timer);
          this.timer = setTimeout(() => {
            void this.exclusive(() => this.refresh()).catch((e) => {
              this.error = String(e);
              this.emit("change");
            });
          }, 180);
        },
      );
      this.emit("change");
    });
  }
  private async refresh(observe = true) {
    if (observe && !this.journal.group) await this.journal.observe();
    const group = this.journal.group;
    if (group?.kind === "agent") {
      if (!this.scene) {
        const dir = await this.journal.materialize(group.base);
        this.scene = SceneSchema.parse(
          await readJSON(path.join(dir, "scene.json")),
        );
      }
      this.revision = this.journal.revision;
      this.emit("change");
      return;
    }
    try {
      const document = SceneSchema.parse(
        await readJSON(path.join(this.directory, "scene.json")),
      );
      if (document.id !== this.id)
        throw new Error("Scene ID must match its folder");
      this.scene = document;
      this.error = null;
    } catch (e) {
      this.error = String(e);
    }
    this.revision = group
      ? hash(JSON.stringify(await this.journal.collect()))
      : this.journal.revision;
    const files = this.journal.head?.files || {};
    const sourceHash = hash(
      JSON.stringify(
        Object.entries(files).filter(([name]) => name !== "scene.json"),
      ),
    );
    if (sourceHash !== this.sourceHash) {
      this.sourceHash = sourceHash;
      this.codeRevision++;
    }
    this.emit("change");
  }
  async sync() {
    return this.exclusive(() => this.refresh());
  }
  async edit(
    change: (s: SceneDocument) => void,
    expected?: string,
    actor = "editor",
  ) {
    return this.exclusive(async () => {
      const group = this.journal.group;
      if (group && (group.actor !== actor || group.kind !== "gesture"))
        throw new Error(
          `Scene has an open edit: ${group.id}. Apply or cancel it first.`,
        );
      if (!group) await this.journal.observe();
      if (expected && expected !== this.journal.revision) {
        await this.refresh(false);
        throw new Error("Scene changed on disk. Refresh before replacing it.");
      }
      const disk = SceneSchema.parse(
        await readJSON(path.join(this.directory, "scene.json")),
      );
      const next = structuredClone(disk);
      change(next);
      const parsed = SceneSchema.parse(next);
      if (parsed.id !== this.id) throw new Error("Scene ID cannot change");
      if (JSON.stringify(parsed) !== JSON.stringify(disk))
        await atomicWrite(
          path.join(this.directory, "scene.json"),
          JSON.stringify(parsed, null, 2) + "\n",
        );
      if (!group) await this.journal.observe("Scene settings", actor);
      await this.refresh(false);
      return this.scene;
    });
  }
  async history(direction: "undo" | "redo", expected?: string) {
    return this.exclusive(async () => {
      if (expected && expected !== this.journal.revision)
        throw new Error(
          "Revision conflict. Read state before changing history.",
        );
      await this.journal.move(direction);
      await this.refresh(false);
      return this.scene;
    });
  }
  async begin(
    label: string,
    actor: string,
    expected?: string,
    kind: "agent" | "gesture" = "agent",
    paths?: string[],
  ) {
    return this.exclusive(async () => {
      const group = await this.journal.begin(
        label,
        actor,
        expected,
        kind,
        paths,
      );
      this.emit("change");
      return group;
    });
  }
  private assertEditOwner(id: string, actor?: string) {
    const group = this.journal.group;
    if (!group || group.id !== id) throw new Error("Edit group does not match");
    if (actor !== undefined && group.actor !== actor)
      throw new Error(
        `Edit ${id} belongs to ${group.actor}. Use its original actor identity; do not adopt another agent's edit.`,
      );
  }
  async apply(id: string, actor?: string) {
    return this.exclusive(async () => {
      this.assertEditOwner(id, actor);
      const doc = SceneSchema.parse(
        await readJSON(path.join(this.directory, "scene.json")),
      );
      if (doc.id !== this.id) throw new Error("Scene ID must match its folder");
      await this.journal.apply(id);
      await this.refresh(false);
      return { revision: this.revision };
    });
  }
  /** Preserve the last valid value when its viewer closes mid-gesture. */
  async finishGesture(actor: string) {
    return this.exclusive(async () => {
      const group = this.journal.group;
      if (!group || group.kind !== "gesture" || group.actor !== actor)
        return false;
      const doc = SceneSchema.parse(
        await readJSON(path.join(this.directory, "scene.json")),
      );
      if (doc.id !== this.id) throw new Error("Scene ID must match its folder");
      await this.journal.apply(group.id);
      await this.refresh(false);
      return true;
    });
  }
  async cancel(id: string, actor?: string) {
    return this.exclusive(async () => {
      this.assertEditOwner(id, actor);
      await this.journal.cancel(id);
      await this.refresh(false);
      return { revision: this.revision };
    });
  }
  async readFile(relative: string) {
    return fs.readFile(await safePath(this.directory, relative), "utf8");
  }
  async writeFile(
    relative: string,
    content: string,
    expectedHash?: string | null,
    actor = "agent",
  ) {
    return this.exclusive(async () => {
      const file = await safePath(this.directory, relative, true);
      const group = this.journal.group;
      if (group && (group.actor !== actor || group.kind !== "agent"))
        throw new Error(
          `Scene has an open edit owned by ${group.actor}: ${group.id}`,
        );
      const normalized = path.relative(await fs.realpath(this.directory), file);
      if (group?.paths && !group.paths.includes(normalized))
        throw new Error(
          "File is outside the declared edit paths: " + normalized,
        );
      let current: Buffer | undefined;
      try {
        current = await fs.readFile(file);
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error;
      }
      if (expectedHash === null && current !== undefined)
        throw new Error("File already exists; read it and supply its hash");
      if (
        typeof expectedHash === "string" &&
        (!current || hash(current) !== expectedHash)
      )
        throw new Error("File changed; read it before writing again");
      if (!group) await this.journal.observe();
      await atomicWrite(file, content);
      if (!group) await this.journal.observe("Write " + normalized, actor);
      await this.refresh();
      return { path: relative, hash: hash(content) };
    });
  }
  async previewDirectory() {
    return this.journal.materialize();
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
    await fs.mkdir(dir, { recursive: true });
    const doc = SceneSchema.parse({
      version: 1,
      id: slug,
      name,
      fps: DEFAULT_FRAME_RATE,
      duration: 8,
      size: this.scene?.size ?? { width: 1920, height: 1080 },
      background: "#000000",
      camera: { projection: "orthographic", preset: "front", side: "right" },
      sources: [],
      parameters: {},
      tracks: [],
      clips: [],
    });
    await atomicWrite(
      path.join(dir, "scene.ts"),
      `export default function createComposition() { return { sample() {} }; }\n`,
    );
    await atomicWrite(
      path.join(dir, "scene.json"),
      JSON.stringify(doc, null, 2) + "\n",
    );
    return { id: slug, name };
  }
}
