import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { SceneSchema, type SceneDocument } from "../src/core/schema";
import {
  SceneSession,
  compileScene,
  type SessionSource,
  type SessionStore,
  type SessionDependencies,
} from "../src/main/scene-session";
import type { PreviewProfile } from "../src/core/preview-profile";
import { sourceFingerprint } from "../src/main/source-fingerprint";
import { sampleSources } from "../src/main/frame-preparation";
import type { SourceStatus } from "../src/core/source-status";
import type { EncodedSurface } from "../src/core/layers";

const scene = () =>
  SceneSchema.parse({
    version: 1,
    id: "fixture",
    name: "Fixture",
    entry: "scene.ts",
    duration: 3,
    size: { width: 128, height: 128 },
    background: "#000000",
    parameters: {},
    sources: ["a", "b"].map((id) => ({
      id,
      kind: "web",
      entry: `${id}/index.html`,
      width: 128,
      height: 128,
    })),
  });
const turn = () => new Promise<void>((resolve) => setImmediate(resolve));
async function fixture(t: { after(fn: () => Promise<void>): void }) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-session-"));
  const working = path.join(root, "working");
  await fs.mkdir(working);
  for (const id of ["a", "b"]) {
    await fs.mkdir(path.join(working, id));
    await fs.writeFile(path.join(working, id, "index.html"), `<h1>${id}</h1>`);
  }
  await fs.writeFile(
    path.join(working, "scene.ts"),
    'import {value} from "./motion"; export default value;',
  );
  await fs.writeFile(path.join(working, "motion.ts"), "export const value=1;");
  let serial = 0,
    directory = "";
  const io = { materializations: 0, fingerprints: 0 };
  const store: SessionStore = {
    root,
    id: "fixture",
    scene: scene(),
    revision: "",
    codeRevision: 0,
    error: null,
    previewDirectory: async () => {
      io.materializations++;
      return directory;
    },
  };
  async function commit(
    files: Record<string, string | null> = {},
    edit?: (doc: SceneDocument) => void,
  ) {
    for (const [name, content] of Object.entries(files)) {
      const target = path.join(working, name);
      if (content === null) await fs.rm(target);
      else {
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, content);
      }
    }
    store.scene = structuredClone(store.scene);
    edit?.(store.scene);
    store.revision = `revision-${++serial}`;
    if (Object.keys(files).length) store.codeRevision++;
    await fs.writeFile(
      path.join(working, "scene.json"),
      JSON.stringify(store.scene),
    );
    directory = path.join(root, "snapshots", store.revision);
    await fs.cp(working, directory, { recursive: true });
  }
  await commit();
  const created: (SessionSource & {
    token: string;
    density: number;
    disposed: number;
  })[] = [];
  let failCompile = false;
  let onReady: (
    source: (typeof created)[number],
  ) => Promise<void> = async () => {};
  let onSample: () => Promise<void> = async () => {};
  let onCreate: () => Promise<void> = async () => {};
  let onDispose: () => Promise<void> = async () => {};
  const dependencies: SessionDependencies = {
    compile: async (...args) => {
      if (failCompile) throw new Error("Compile failed");
      return compileScene(...args);
    },
    fingerprint: (...args) => {
      io.fingerprints++;
      return sourceFingerprint(...args);
    },
    createSource: async (spec, _origin, _prefix, _directory, density) => {
      const token = `source-${created.length}`;
      const source = {
        spec,
        token,
        density,
        disposed: 0,
        currentRoute: `/${spec.id}`,
        async ready() {
          await onReady(source);
        },
        async sample() {
          await onSample();
          return {
            images: { [spec.id]: token },
            imageVersions: { [spec.id]: token },
          };
        },
        async route() {
          return source.currentRoute;
        },
        async inspect() {
          return [];
        },
        async dispose() {
          source.disposed++;
          await onDispose();
        },
      };
      created.push(source);
      await onCreate();
      return source;
    },
  };
  const session = new SceneSession(store, "http://fixture", dependencies);
  const extraSessions: SceneSession[] = [];
  t.after(async () => {
    await session.dispose();
    await Promise.all(extraSessions.map((extra) => extra.dispose()));
    await fs.rm(root, { recursive: true, force: true });
  });
  return {
    root,
    store,
    session,
    created,
    io,
    commit,
    createSession(profile?: PreviewProfile) {
      const extra = new SceneSession(
        store,
        "http://fixture",
        dependencies,
        profile,
      );
      extraSessions.push(extra);
      return extra;
    },
    setFailCompile(value: boolean) {
      failCompile = value;
    },
    setOnReady(fn: typeof onReady) {
      onReady = fn;
    },
    setOnSample(fn: typeof onSample) {
      onSample = fn;
    },
    setOnCreate(fn: typeof onCreate) {
      onCreate = fn;
    },
    setOnDispose(fn: typeof onDispose) {
      onDispose = fn;
    },
  };
}

for (const profile of ["thumbnail", "playback"] as const) {
  test(`${profile} raster sessions cannot change authored documents or regular source quality`, async (t) => {
    const f = await fixture(t);
    await f.commit({}, (doc) => {
      doc.capture = { density: 4 };
    });
    const authored = structuredClone(f.store.scene);
    const regular = await f.session.frame(1, f.store.revision, 4);
    const thumbnail = f.createSession(profile);
    const prepared = await thumbnail.prepare();
    const compact = await thumbnail.frame(1, f.store.revision, 12);
    assert.deepEqual(prepared.scene, authored);
    assert.deepEqual(f.store.scene, authored);
    assert.deepEqual(
      f.created.slice(2).map((source) => source.spec),
      authored.sources,
      "compact capture preserves source CSS dimensions and layer declarations",
    );
    assert.deepEqual(
      f.created.map((source) => source.density),
      [4, 4, 1, 1],
    );
    assert.ok(compact.quality!.every((quality) => quality.density === 1));
    assert.ok(
      compact.quality!.every(
        (quality) => quality.width === 128 && quality.height === 128,
      ),
    );
    const repeated = await f.session.frame(2, f.store.revision);
    assert.deepEqual(repeated.images, regular.images);
    assert.ok(repeated.quality!.every((quality) => quality.density === 4));
    assert.equal(f.created.length, 4);
    await thumbnail.dispose();
    assert.deepEqual(
      f.created.map((source) => source.disposed),
      [0, 0, 1, 1],
    );
    assert.deepEqual(
      (await f.session.frame(0, f.store.revision)).images,
      regular.images,
    );
  });

  test(`${profile} sessions retain compact capture after authored density edits`, async (t) => {
    const f = await fixture(t);
    const thumbnail = f.createSession(profile);
    await thumbnail.frame(0);
    await f.commit({}, (doc) => {
      doc.capture = { density: 7 };
    });
    const prepared = await thumbnail.prepare();
    const frame = await thumbnail.frame(2, f.store.revision, 12);
    assert.equal(prepared.scene.capture?.density, 7);
    assert.ok(frame.quality!.every((quality) => quality.density === 1));
    assert.equal(
      f.created.length,
      2,
      "density changes do not rebuild compact sources",
    );
    await f.session.frame(2, f.store.revision);
    assert.deepEqual(
      f.created.map((source) => source.density),
      [1, 1, 7, 7],
    );
  });
}

test("playback sources stay isolated from posters and full-quality editor sessions", async (t) => {
  const f = await fixture(t);
  const poster = f.createSession("thumbnail");
  const playback = f.createSession("playback");
  const editorFrame = await f.session.frame(0);
  const posterFrame = await poster.frame(0);
  const playbackFrame = await playback.frame(0);
  assert.equal(f.created.length, 6);
  assert.notDeepEqual(playbackFrame.imageVersions, posterFrame.imageVersions);
  assert.notDeepEqual(playbackFrame.imageVersions, editorFrame.imageVersions);
  await playback.dispose();
  assert.deepEqual(
    f.created.map((source) => source.disposed),
    [0, 0, 0, 0, 1, 1],
  );
  assert.deepEqual((await poster.frame(1)).images, posterFrame.images);
  assert.deepEqual((await f.session.frame(1)).images, editorFrame.images);
});

test("choreography and imported composition edits preserve browsers and pixels", async (t) => {
  const f = await fixture(t);
  const first = await f.session.frame(0);
  await f.commit({ "motion.ts": "export const value=2;" });
  const prepared = await f.session.prepare();
  const second = await f.session.frame(2);
  assert.equal(f.created.length, 2);
  assert.deepEqual(second.images, first.images);
  assert.deepEqual(second.imageVersions, first.imageVersions);
  assert.equal(f.session.diagnostics.compilations, 2);
  const module = await fs.readFile(
    path.join(f.root, ".tilt", prepared.url),
    "utf8",
  );
  assert.match(module, /value = 2/);
  assert.ok(f.created.every((source) => source.disposed === 0));
});

test("only a changed browser root is replaced, including lazy assets", async (t) => {
  const f = await fixture(t);
  const first = await f.session.frame(0);
  await f.commit({ "a/lazy/font.woff2": "new font" });
  const second = await f.session.frame(0);
  assert.equal(f.created.length, 3);
  assert.notEqual(second.images.a, first.images.a);
  assert.equal(second.images.b, first.images.b);
  assert.equal(f.created[0].disposed, 1);
  assert.equal(f.created[1].disposed, 0);
  await f.commit({ "a/lazy/font.woff2": null });
  await f.session.prepare();
  assert.equal(f.created.length, 4);
});

test("ordinary camera edits do no source snapshot IO and keep sampled revision current", async (t) => {
  const f = await fixture(t);
  await f.session.frame(0);
  const before = { ...f.io };
  await f.commit({}, (doc) => {
    doc.background = "#111111";
  });
  const frame = await f.session.frame(1);
  assert.deepEqual(f.io, before);
  assert.deepEqual(frame.sample, { time: 1, revision: f.store.revision });
  assert.equal(f.created.length, 2);
});

test("failed browser adapters are replaced even when their file fingerprints match", async (t) => {
  const f = await fixture(t);
  await f.session.prepare();
  Object.defineProperty(f.created[0], "diagnostics", {
    value: { phase: "failed" },
  });
  await f.session.prepare();
  assert.equal(f.created.length, 3);
  assert.deepEqual(
    f.created.map((source) => source.disposed),
    [1, 0, 0],
  );
});

test("source reorder/removal preserves surviving browser and per-source density", async (t) => {
  const f = await fixture(t);
  await f.session.frame(0, undefined, 2);
  assert.deepEqual(
    f.created.map((source) => source.density),
    [4, 4],
  );
  await f.commit({ "scene.ts": "export default 3;" });
  await f.session.prepare();
  assert.equal(
    f.created.length,
    2,
    "composition edits retain highest requested density",
  );
  await f.commit({}, (doc) => {
    doc.sources.reverse();
    doc.sources[0].width = 256;
  });
  await f.session.prepare();
  assert.equal(f.created.length, 3);
  assert.equal(
    f.created[0].disposed,
    0,
    "unrelated source retains high quality",
  );
  await f.commit({}, (doc) => {
    doc.sources = doc.sources.filter((s) => s.id === "a");
  });
  await f.session.prepare();
  assert.equal(f.created.length, 3);
  assert.equal(f.created[2].disposed, 1);
  assert.equal(f.session.diagnostics.activeSources, 1);
});

test("failed compilation or source readiness never disposes the last valid source set", async (t) => {
  const f = await fixture(t);
  await f.session.prepare();
  f.setFailCompile(true);
  await f.commit({ "motion.ts": "broken" });
  await assert.rejects(f.session.prepare(), /Compile failed/);
  assert.equal(f.created.length, 2);
  assert.ok(f.created.every((source) => source.disposed === 0));
  f.setFailCompile(false);
  await f.commit({
    "motion.ts": "export const value=3;",
    "a/index.html": "replacement",
  });
  f.setOnReady(async () => {
    throw new Error("Ready failed");
  });
  await assert.rejects(f.session.prepare(), /Ready failed/);
  assert.deepEqual(
    f.created.map((s) => s.disposed),
    [0, 0, 1],
  );
  f.setOnReady(async () => {});
  await f.session.prepare();
  assert.deepEqual(
    f.created.map((s) => s.disposed),
    [1, 0, 1, 0],
  );
});

test("revision changes during replacement fail transaction and dispose new resources", async (t) => {
  const f = await fixture(t);
  await f.session.prepare();
  await f.commit({ "a/index.html": "replacement" });
  f.setOnReady(async () => {
    f.store.revision = "concurrent-revision";
  });
  await assert.rejects(f.session.prepare(), /Scene revision changed/);
  assert.deepEqual(
    f.created.map((s) => s.disposed),
    [0, 0, 1],
  );
});

test("all pending startup work settles before failed transaction cleanup", async (t) => {
  const f = await fixture(t);
  let finish: (() => void) | undefined;
  f.setOnReady(async (source) => {
    if (source.spec.id === "a") throw new Error("First source failed");
    await new Promise<void>((resolve) => {
      finish = resolve;
    });
    assert.equal(source.disposed, 0);
  });
  const pending = f.session.prepare();
  while (!finish) await turn();
  assert.equal(f.created[0].disposed, 0);
  finish();
  await assert.rejects(pending, /First source failed/);
  assert.deepEqual(
    f.created.map((s) => s.disposed),
    [1, 1],
  );
});

test("dispose while sources prepare prevents late commit and releases all sources", async (t) => {
  const f = await fixture(t);
  let finish: (() => void) | undefined;
  f.setOnReady(async () => {
    await new Promise<void>((resolve) => {
      finish = resolve;
    });
  });
  f.store.scene.sources = [f.store.scene.sources[0]];
  const pending = f.session.prepare();
  while (!finish) await turn();
  let stopped = false;
  const disposal = f.session.dispose().then(() => {
    stopped = true;
  });
  await turn();
  assert.equal(stopped, false, "awaited disposal includes pending ready work");
  finish();
  await assert.rejects(pending, /disposed/);
  await disposal;
  assert.equal(f.created[0].disposed, 1);
  assert.equal(f.session.diagnostics.activeSources, 0);
  await assert.rejects(f.session.prepare(), /disposed/);
});

test("awaited disposal also includes factories that have not returned their source", async (t) => {
  const f = await fixture(t);
  let finish: (() => void) | undefined;
  f.setOnCreate(async () => {
    await new Promise<void>((resolve) => {
      finish = resolve;
    });
  });
  const pending = f.session.prepare();
  while (!finish) await turn();
  let stopped = false;
  const disposal = f.session.dispose().then(() => {
    stopped = true;
  });
  await turn();
  assert.equal(stopped, false);
  finish();
  await assert.rejects(pending, /disposed/);
  await disposal;
  assert.deepEqual(
    f.created.map((source) => source.disposed),
    [1],
  );
});

test("revision changes during old host cleanup reject the prepared response", async (t) => {
  const f = await fixture(t);
  await f.session.prepare();
  await f.commit({ "a/index.html": "replacement" });
  f.setOnDispose(async () => {
    await turn();
    f.store.revision = "concurrent-cleanup-edit";
  });
  await assert.rejects(f.session.prepare(), /Scene revision changed/);
  assert.equal(f.created[0].disposed, 1);
});

test("sampling remains serialized and rejects frames whose revision changed", async (t) => {
  const f = await fixture(t);
  let active = 0,
    maxActive = 0;
  f.setOnSample(async () => {
    active++;
    maxActive = Math.max(active, maxActive);
    await turn();
    active--;
  });
  await Promise.all([
    f.session.frame(0),
    f.session.frame(1),
    f.session.frame(2),
  ]);
  assert.equal(maxActive, 1);
  f.setOnSample(async () => {
    f.store.revision = "changed";
  });
  await assert.rejects(f.session.frame(0), /Scene revision changed/);
  await assert.rejects(
    f.session.frame(0, "old-revision"),
    /Scene revision changed/,
  );
});

test("source fingerprints cover all served files and ignore unrelated roots", async (t) => {
  const f = await fixture(t);
  const directory = await f.store.previewDirectory();
  const spec = f.store.scene.sources[0];
  const before = await sourceFingerprint(directory, spec);
  await f.commit({ "scene.ts": "export default 4;" });
  assert.equal(
    await sourceFingerprint(await f.store.previewDirectory(), spec),
    before,
  );
  const rootSpec = { ...spec, entry: "scene.ts" };
  assert.notEqual(
    await sourceFingerprint(directory, rootSpec),
    await sourceFingerprint(await f.store.previewDirectory(), rootSpec),
  );
  const external = { ...spec, entry: undefined, url: "https://example.test" };
  assert.equal(
    await sourceFingerprint(directory, external),
    await sourceFingerprint(await f.store.previewDirectory(), external),
  );
  const managed = {
    ...spec,
    entry: undefined,
    server: {
      executable: "node",
      args: ["server.mjs", "{port}"],
      cwd: "a",
      url: "http://127.0.0.1:{port}/",
    },
  };
  assert.equal(
    await sourceFingerprint(directory, managed),
    await sourceFingerprint(await f.store.previewDirectory(), managed),
  );
  await f.commit({ "a/server.mjs": "a changed managed server" });
  assert.notEqual(
    await sourceFingerprint(directory, managed),
    await sourceFingerprint(await f.store.previewDirectory(), managed),
  );
});

test("shared frame preparation preserves full pixels, metadata, routes and quality", async () => {
  const parameters = { amount: 3 };
  const calls: string[] = [];
  const sources = ["a", "b"].map((id) => ({
    spec: { id },
    currentRoute: `/${id}`,
    async sample(time: number, supplied: unknown) {
      assert.equal(time, 1.5);
      assert.equal(supplied, parameters);
      calls.push(id);
      return {
        images: { [id]: "pixels" },
        imageVersions: { [id]: "revision" },
      };
    },
  }));
  const frame = await sampleSources(sources, 1.5, parameters, [], "frozen");
  assert.deepEqual(frame.sample, { time: 1.5, revision: "frozen" });
  assert.deepEqual(calls, ["a", "b"]);
  assert.deepEqual(frame.routes, [
    { id: "a", route: "/a" },
    { id: "b", route: "/b" },
  ]);
  assert.deepEqual(frame.images, { a: "pixels", b: "pixels" });
  assert.deepEqual(frame.imageVersions, { a: "revision", b: "revision" });
});

test("shared frame preparation preserves binary surfaces and post-sample diagnostics", async () => {
  const surface: EncodedSurface = {
    mimeType: "image/png",
    bytes: new Uint8Array([1, 2, 3]),
    width: 64,
    height: 64,
  };
  const status: SourceStatus = {
    sourceId: "ui",
    phase: "created",
    adapter: null,
    reused: false,
    timings: {},
    captures: 0,
    capturedBytes: 0,
  };
  const source = {
    spec: { id: "ui" },
    currentRoute: "/fixture",
    diagnostics: status,
    async sample() {
      status.phase = "ready";
      status.preparedTime = 2;
      return {
        images: {},
        surfaces: { ui: surface },
        imageVersions: { ui: "binary-frame" },
      };
    },
  };
  const frame = await sampleSources([source], 2, {});
  assert.equal(frame.surfaces?.ui, surface);
  assert.equal(frame.sourceStatus?.[0].phase, "ready");
  assert.equal(frame.sourceStatus?.[0].preparedTime, 2);
  await assert.rejects(
    sampleSources(
      [
        source,
        {
          ...source,
          async sample() {
            throw new Error("Adapter failed");
          },
        },
      ],
      2,
      {},
    ),
    /Adapter failed/,
  );
});
