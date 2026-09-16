import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { atomicWrite, hash, manifest, readJSON, safePath } from "./files";

export type FileMap = Record<string, string>;
export type Checkpoint = {
  id: string;
  revision: string;
  files: FileMap;
  label: string;
  actor: string;
  at: string;
};
export type EditGroup = {
  id: string;
  base: string;
  label: string;
  actor: string;
  kind: "agent" | "gesture";
  paths?: string[];
  startedAt: string;
};
type Ledger = {
  version: 1;
  cursor: number;
  entries: Checkpoint[];
  group?: EditGroup;
};
type Pending = { expected: FileMap; target: FileMap; next: Ledger };
const digest = (files: FileMap) => hash(JSON.stringify(files));

/** Content-addressed file history, independent of the viewer and of Git. */
export class SceneHistory {
  ledger: Ledger = { version: 1, cursor: -1, entries: [] };
  constructor(
    public sceneDir: string,
    public directory: string,
  ) {}
  get head() {
    return this.ledger.entries[this.ledger.cursor];
  }
  get group() {
    return this.ledger.group;
  }
  get revision() {
    return this.head?.revision || "";
  }
  private get index() {
    return path.join(this.directory, "index.json");
  }
  async init() {
    await fs.mkdir(path.join(this.directory, "blobs"), { recursive: true });
    try {
      this.ledger = await readJSON(this.index);
    } catch (e: any) {
      if (e.code !== "ENOENT") throw e;
    }
    try {
      const pending = await readJSON<Pending>(
        path.join(this.directory, "pending.json"),
      );
      await this.install(pending, true);
    } catch (e: any) {
      if (e.code !== "ENOENT") throw e;
    }
    if (!this.group) await this.observe("Files on opening", "filesystem");
  }
  private async save() {
    await atomicWrite(this.index, JSON.stringify(this.ledger, null, 2) + "\n");
  }
  async collect(): Promise<FileMap> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const before = await manifest(this.sceneDir);
      let stable = true;
      for (const [relative, sha] of Object.entries(before)) {
        const blob = path.join(this.directory, "blobs", sha);
        try {
          await fs.access(blob);
        } catch {
          const bytes = await fs.readFile(
            await safePath(this.sceneDir, relative),
          );
          if (hash(bytes) !== sha) {
            stable = false;
            break;
          }
          await atomicWrite(blob, bytes);
        }
      }
      const after = await manifest(this.sceneDir);
      if (stable && digest(before) === digest(after)) return after;
    }
    throw new Error("Files are still changing. Wait for the save to finish.");
  }
  async observe(label = "File edit", actor = "filesystem") {
    if (this.group) return this.head;
    const files = await this.collect();
    const revision = digest(files);
    if (revision === this.revision) return this.head;
    const entry: Checkpoint = {
      id: randomUUID(),
      revision,
      files,
      label,
      actor,
      at: new Date().toISOString(),
    };
    this.ledger.entries = this.ledger.entries.slice(0, this.ledger.cursor + 1);
    this.ledger.entries.push(entry);
    this.ledger.cursor = this.ledger.entries.length - 1;
    await this.save();
    return entry;
  }
  async begin(
    label: string,
    actor: string,
    expected?: string,
    kind: "agent" | "gesture" = "agent",
    paths?: string[],
  ) {
    if (this.group)
      throw new Error(`An edit is already open: ${this.group.id}`);
    await this.observe();
    if (expected && expected !== this.revision)
      throw new Error(
        "Revision conflict. Read the current scene before beginning an edit.",
      );
    for (const relative of paths || [])
      await safePath(this.sceneDir, relative, true);
    const group: EditGroup = {
      id: randomUUID(),
      base: this.revision,
      label,
      actor,
      kind,
      paths,
      startedAt: new Date().toISOString(),
    };
    this.ledger.group = group;
    await this.save();
    return group;
  }
  async apply(id: string) {
    const group = this.group;
    if (!group || group.id !== id) throw new Error("Edit group does not match");
    const current = await this.collect();
    if (group.paths) {
      const changed = new Set(
        [...Object.keys(this.head.files), ...Object.keys(current)].filter(
          (p) => this.head.files[p] !== current[p],
        ),
      );
      for (const p of changed)
        if (!group.paths.includes(p))
          throw new Error(`Edit touched an undeclared file: ${p}`);
    }
    this.ledger.group = undefined;
    try {
      return await this.observe(group.label, group.actor);
    } catch (e) {
      this.ledger.group = group;
      throw e;
    } finally {
      await this.save();
    }
  }
  async cancel(id: string) {
    if (this.group?.id !== id) throw new Error("Edit group does not match");
    const expected = await this.collect();
    const next = structuredClone(this.ledger);
    delete next.group;
    if (this.group.paths)
      for (const name of new Set([
        ...Object.keys(expected),
        ...Object.keys(this.head.files),
      ]))
        if (
          expected[name] !== this.head.files[name] &&
          !this.group.paths.includes(name)
        )
          throw new Error(`Cancel would overwrite an undeclared file: ${name}`);
    await this.restore({ expected, target: this.head.files, next });
  }
  async move(direction: "undo" | "redo") {
    if (this.group)
      throw new Error(`Finish edit ${this.group.id} before ${direction}`);
    const disk = await this.collect();
    if (digest(disk) !== this.revision) {
      await this.observe("External file edit", "filesystem");
      throw new Error(
        "External changes were checkpointed. Review them before undoing.",
      );
    }
    const cursor = this.ledger.cursor + (direction === "undo" ? -1 : 1);
    if (cursor < 0 || cursor >= this.ledger.entries.length) return;
    const next = structuredClone(this.ledger);
    next.cursor = cursor;
    await this.restore({
      expected: disk,
      target: next.entries[cursor].files,
      next,
    });
  }
  private async restore(pending: Pending) {
    await atomicWrite(
      path.join(this.directory, "pending.json"),
      JSON.stringify(pending),
    );
    await this.install(pending, false);
  }
  private async install(pending: Pending, recovering: boolean) {
    const disk = await manifest(this.sceneDir);
    for (const name of new Set([
      ...Object.keys(pending.expected),
      ...Object.keys(pending.target),
      ...Object.keys(disk),
    ])) {
      const current = disk[name];
      if (
        current !== pending.expected[name] &&
        (!recovering || current !== pending.target[name])
      )
        throw new Error(`History conflict in ${name}; files were left intact`);
    }
    for (const name of new Set([
      ...Object.keys(pending.expected),
      ...Object.keys(pending.target),
    ])) {
      const file = await safePath(this.sceneDir, name, true);
      const target = pending.target[name];
      let current: string | undefined;
      try {
        current = hash(await fs.readFile(file));
      } catch (e: any) {
        if (e.code !== "ENOENT") throw e;
      }
      if (current !== pending.expected[name] && current !== target)
        throw new Error(`History conflict in ${name}`);
      if (current === target) continue;
      if (target)
        await atomicWrite(
          file,
          await fs.readFile(path.join(this.directory, "blobs", target)),
        );
      else await fs.rm(file, { force: true });
    }
    this.ledger = pending.next;
    await this.save();
    await fs.rm(path.join(this.directory, "pending.json"), { force: true });
  }
  async materialize(revision = this.revision) {
    const checkpoint = this.ledger.entries.find((e) => e.revision === revision);
    if (!checkpoint) throw new Error("Unknown revision");
    const target = path.join(this.directory, "previews", revision);
    const marker = path.join(target, ".complete");
    try {
      await fs.access(marker);
      return target;
    } catch {}
    await fs.mkdir(target, { recursive: true });
    for (const [relative, sha] of Object.entries(checkpoint.files))
      await atomicWrite(
        await safePath(target, relative, true),
        await fs.readFile(path.join(this.directory, "blobs", sha)),
      );
    await atomicWrite(marker, "ready");
    return target;
  }
  summary() {
    return {
      canUndo: this.ledger.cursor > 0,
      canRedo: this.ledger.cursor < this.ledger.entries.length - 1,
      pendingEdit: this.group || null,
      entries: this.ledger.entries.map((e, i) => ({
        id: e.id,
        revision: e.revision,
        label: e.label,
        actor: e.actor,
        at: e.at,
        current: i === this.ledger.cursor,
      })),
    };
  }
}
