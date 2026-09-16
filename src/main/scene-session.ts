import path from "node:path";
import { hash, atomicWrite, safePath } from "./files";
import { WebSource } from "./source";
import { values, type SceneDocument } from "../core/schema";
import type { SceneStore } from "./store";

export async function compileScene(
  root: string,
  directory: string,
  document: SceneDocument,
) {
  const { build } = await import("esbuild");
  const result = await build({
    entryPoints: [await safePath(directory, document.entry)],
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    target: "es2022",
    sourcemap: "inline",
    logLevel: "silent",
    nodePaths: [path.join(root, "node_modules")],
  });
  const output = Buffer.from(result.outputFiles[0].contents);
  const file = path.join(root, ".tilt", "modules", hash(output) + ".js");
  await atomicWrite(file, output);
  return file;
}
export class SceneSession {
  private key = "";
  private compiled = "";
  private sources: WebSource[] = [];
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    public store: SceneStore,
    public origin: string,
  ) {}
  exclusive<T>(fn: () => Promise<T>): Promise<T> {
    const task = this.queue.then(fn, fn);
    this.queue = task.catch(() => {});
    return task;
  }
  private async ensure() {
    if (this.store.error) throw new Error(this.store.error);
    const doc = this.store.scene;
    const revision = this.store.revision;
    const codeRevision = this.store.codeRevision;
    const key = JSON.stringify([
      this.store.id,
      doc.entry,
      doc.sources,
      codeRevision,
    ]);
    if (key !== this.key) {
      const directory = await this.store.previewDirectory();
      const module = await compileScene(this.store.root, directory, doc);
      const next = doc.sources.map(
        (spec) => new WebSource(spec, this.origin, "source", directory),
      );
      try {
        await Promise.all(next.map((s) => s.ready()));
      } catch (e) {
        next.forEach((s) => s.dispose());
        throw e;
      }
      if (revision !== this.store.revision) {
        next.forEach((s) => s.dispose());
        throw new Error(
          "Scene revision changed; waiting for the current preview",
        );
      }
      const old = this.sources;
      this.sources = next;
      this.compiled = module;
      this.key = key;
      old.forEach((s) => s.dispose());
    }
    return {
      url: `${this.origin}/modules/${path.basename(this.compiled)}`,
      scene: doc,
      revision,
      codeRevision,
    };
  }
  prepare() {
    return this.exclusive(() => this.ensure());
  }
  frame(time: number, revision?: string) {
    return this.exclusive(async () => {
      const prep = await this.ensure();
      if (revision && revision !== prep.revision)
        throw new Error(
          "Scene revision changed; waiting for the current preview",
        );
      const images: Record<string, string> = {};
      for (const s of this.sources)
        images[s.spec.id] = await s.sample(time, values(prep.scene));
      if (prep.revision !== this.store.revision)
        throw new Error(
          "Scene revision changed; waiting for the current preview",
        );
      return {
        images,
        routes: this.sources.map((s) => ({
          id: s.spec.id,
          route: s.currentRoute,
        })),
      };
    });
  }
  inspect() {
    return this.exclusive(async () => {
      await this.ensure();
      return Promise.all(
        this.sources.map(async (s) => ({
          source: s.spec.id,
          route: await s.route(),
          subjects: await s.inspect(),
        })),
      );
    });
  }
  dispose() {
    this.sources.forEach((s) => s.dispose());
    this.sources = [];
  }
}
