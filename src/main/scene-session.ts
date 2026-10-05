import path from "node:path";
import { hash, atomicWrite, safePath } from "./files";
import type { WebSource } from "./source";
import { values, type SceneDocument, type SourceSpec } from "../core/schema";
import type { SceneStore } from "./store";
import { captureQuality, type SourceQuality } from "../core/quality";
import { withParameterValue, type ParameterValues } from "../core/parameters";
import { sourceFingerprint } from "./source-fingerprint";
import { sampleSources } from "./frame-preparation";
import type { SourceStatus } from "../core/source-status";
import type { PreviewProfile } from "../core/preview-profile";

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
export type SessionSource = Pick<
  WebSource,
  "spec" | "currentRoute" | "ready" | "sample" | "inspect" | "route"
> & {
  dispose(): void | Promise<void>;
  readonly diagnostics?: SourceStatus;
  readonly previewURL?: string;
};
export type SessionStore = Pick<
  SceneStore,
  | "root"
  | "id"
  | "scene"
  | "revision"
  | "codeRevision"
  | "error"
  | "previewDirectory"
>;
export interface SessionDependencies {
  compile: typeof compileScene;
  fingerprint: typeof sourceFingerprint;
  createSource(
    spec: SourceSpec,
    origin: string,
    prefix: string,
    directory: string,
    density: number,
  ): SessionSource | Promise<SessionSource>;
}
const defaultDependencies: SessionDependencies = {
  compile: compileScene,
  fingerprint: sourceFingerprint,
  async createSource(...args) {
    const { WebSource } = await import("./source");
    return new WebSource(...args);
  },
};
type SourceEntry = { key: string; source: SessionSource };
type DensityRequest = { key: string; zoom: number };

export class SceneSession {
  private compilationKey = "";
  private compiled = "";
  private entries: SourceEntry[] = [];
  private quality: SourceQuality[] = [];
  private densityRequests = new Map<string, DensityRequest>();
  private snapshot?: { key: string; directory: string; fingerprints: string[] };
  private queue: Promise<unknown> = Promise.resolve();
  private disposed = false;
  private disposal?: Promise<void>;
  private preparingSources = new Set<SessionSource>();
  private retirements = new WeakMap<SessionSource, Promise<void>>();
  private counters = { compilations: 0, sourceCreations: 0, sourceReuses: 0 };
  constructor(
    public store: SessionStore,
    public origin: string,
    private dependencies: SessionDependencies = defaultDependencies,
    private previewProfile?: PreviewProfile,
  ) {}
  get diagnostics() {
    return {
      ...this.counters,
      activeSources: this.entries.length,
      sources: this.entries.flatMap((entry) =>
        entry.source.diagnostics ? [entry.source.diagnostics] : [],
      ),
    };
  }
  exclusive<T>(fn: () => Promise<T>): Promise<T> {
    const task = this.queue.then(fn, fn);
    this.queue = task.catch(() => {});
    return task;
  }
  private retire(source: SessionSource) {
    let pending = this.retirements.get(source);
    if (!pending) {
      try {
        pending = Promise.resolve(source.dispose());
      } catch (error) {
        pending = Promise.reject(error);
      }
      this.retirements.set(source, pending);
      void pending.catch(() => {});
    }
    return pending;
  }
  private async ensure(zoom = 1) {
    if (this.disposed) throw new Error("Scene session is disposed");
    if (this.store.error) throw new Error(this.store.error);
    const doc = this.store.scene;
    const revision = this.store.revision;
    const codeRevision = this.store.codeRevision;
    const sceneId = this.store.id;
    const assertCurrent = () => {
      if (this.disposed) throw new Error("Scene session is disposed");
      if (revision !== this.store.revision || sceneId !== this.store.id)
        throw new Error(
          "Scene revision changed; waiting for the current preview",
        );
    };
    // Camera/parameter gestures change scene.json, not nested app roots. Avoid
    // materializing and hashing all assets on every gesture frame. A root entry
    // can fetch scene.json, so it conservatively depends on the full revision.
    const exposesDocument = doc.sources.some(
      (spec) => spec.entry && path.dirname(spec.entry) === ".",
    );
    const snapshotKey = JSON.stringify([
      sceneId,
      codeRevision,
      doc.sources,
      exposesDocument ? revision : null,
    ]);
    let snapshot = this.snapshot;
    if (snapshot?.key !== snapshotKey) {
      const directory = await this.store.previewDirectory();
      const fingerprints = await Promise.all(
        doc.sources.map((spec) =>
          this.dependencies.fingerprint(directory, spec),
        ),
      );
      assertCurrent();
      snapshot = { key: snapshotKey, directory, fingerprints };
    }
    const nextDensity = new Map<string, DensityRequest>();
    const quality = doc.sources.map((spec) => {
      const key = JSON.stringify([sceneId, doc.size, doc.capture, spec]);
      const previous = this.densityRequests.get(spec.id);
      // Retain quality across choreography edits and independent viewer zooms.
      const requested = Math.max(
        1,
        Number.isFinite(zoom) ? zoom : 1,
        previous?.key === key ? previous.zoom : 1,
      );
      nextDensity.set(spec.id, { key, zoom: requested });
      // Library posters and workspace playback favor quick preparation over
      // export-density pixels. Each profile owns separate browser sources, so
      // this cannot downshift the editor or change authored capture settings.
      return this.previewProfile === "thumbnail" ||
        this.previewProfile === "playback"
        ? captureQuality(doc.size, spec, { ...doc.capture, density: 1 })
        : captureQuality(doc.size, spec, doc.capture, requested);
    });
    // Arbitrary composition imports remain safe: any code revision recompiles,
    // while browser lifetimes depend only on their own actual source roots.
    const compilationKey = JSON.stringify([sceneId, doc.entry, codeRevision]);
    let module = this.compiled;
    if (compilationKey !== this.compilationKey) {
      module = await this.dependencies.compile(
        this.store.root,
        snapshot.directory,
        doc,
      );
      this.counters.compilations++;
    }
    assertCurrent();
    const created: SessionSource[] = [];
    const next: SourceEntry[] = [];
    try {
      for (const [i, spec] of doc.sources.entries()) {
        const key = JSON.stringify([
          sceneId,
          snapshot.fingerprints[i],
          quality[i].density,
        ]);
        const previous = this.entries.find(
          (entry) =>
            entry.key === key &&
            !["failed", "disposed"].includes(
              entry.source.diagnostics?.phase || "ready",
            ),
        );
        if (previous) next.push(previous);
        else {
          const source = await this.dependencies.createSource(
            spec,
            this.origin,
            "source",
            snapshot.directory,
            quality[i].density,
          );
          created.push(source);
          this.preparingSources.add(source);
          this.counters.sourceCreations++;
          assertCurrent();
          next.push({ key, source });
        }
      }
      // Wait for every startup to finish before disposing a failed transaction;
      // a late ready() must not allocate resources after cleanup.
      const ready = await Promise.allSettled(
        created.map((source) => source.ready()),
      );
      const failed = ready.find((result) => result.status === "rejected");
      if (failed?.status === "rejected") throw failed.reason;
      assertCurrent();
    } catch (error) {
      await Promise.allSettled(created.map((source) => this.retire(source)));
      throw error;
    } finally {
      created.forEach((source) => this.preparingSources.delete(source));
    }
    const old = this.entries;
    this.entries = next;
    this.compiled = module;
    this.compilationKey = compilationKey;
    this.snapshot = snapshot;
    this.densityRequests = nextDensity;
    this.quality = quality;
    this.counters.sourceReuses += next.length - created.length;
    await Promise.allSettled(
      old
        .filter((entry) => !next.includes(entry))
        .map((entry) => this.retire(entry.source)),
    );
    assertCurrent();
    return {
      // A viewer may use the named route or direct loopback. Keep modules on
      // that viewer's origin so its host-only session cookie applies.
      url: `/modules/${path.basename(this.compiled)}`,
      scene: doc,
      revision,
      codeRevision,
      sourcePreviews: Object.fromEntries(
        this.entries.flatMap(({ source }) =>
          source.previewURL && source.spec.sampling === "controlled"
            ? [[source.spec.id, source.previewURL]]
            : [],
        ),
      ),
    };
  }
  prepare() {
    return this.exclusive(() => this.ensure());
  }
  frame(
    time: number,
    revision?: string,
    zoom = 1,
    overrides: ParameterValues = {},
  ) {
    return this.exclusive(async () => {
      const prep = await this.ensure(zoom);
      if (revision && revision !== prep.revision)
        throw new Error(
          "Scene revision changed; waiting for the current preview",
        );
      const parameters = values(prep.scene);
      for (const [key, value] of Object.entries(overrides)) {
        if (!prep.scene.exposedParameters?.includes(key))
          throw new Error("Control is not exposed: " + key);
        parameters[key] = withParameterValue(
          prep.scene.parameters[key],
          value,
        ).value;
      }
      const frame = await sampleSources(
        this.entries.map((entry) => entry.source),
        time,
        parameters,
        this.quality,
        prep.revision,
      );
      if (this.disposed) throw new Error("Scene session is disposed");
      if (prep.revision !== this.store.revision)
        throw new Error(
          "Scene revision changed; waiting for the current preview",
        );
      return frame;
    });
  }
  inspect() {
    return this.exclusive(async () => {
      await this.ensure();
      return Promise.all(
        this.entries.map(async ({ source: s }) => ({
          source: s.spec.id,
          route: await s.route(),
          subjects: await s.inspect(),
          layers: s.spec.layers,
          status: s.diagnostics,
        })),
      );
    });
  }
  dispose() {
    if (this.disposal) return this.disposal;
    this.disposed = true;
    const pending = [
      ...this.entries.map((entry) => entry.source),
      ...this.preparingSources,
    ].map((source) => this.retire(source));
    const queue = this.queue;
    this.entries = [];
    this.snapshot = undefined;
    this.densityRequests.clear();
    this.disposal = (async () => {
      await Promise.allSettled(pending);
      // Factories already running can resolve after dispose was requested. The
      // transaction retires those resources before its queued work completes.
      await queue.catch(() => {});
    })();
    return this.disposal;
  }
}
