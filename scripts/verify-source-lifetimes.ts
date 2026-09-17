import { app } from "electron";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { SceneSession, type SessionStore } from "../src/main/scene-session";
import { SceneSchema } from "../src/core/schema";
import type { CapturedFrame } from "../src/core/layers";

function digest(frame: CapturedFrame, id: string) {
  const bytes =
    frame.surfaces?.[id]?.bytes ??
    Buffer.from(frame.images[id].split(",")[1], "base64");
  return createHash("sha256").update(bytes).digest("hex");
}
async function main() {
  const label = process.argv[2] || "current";
  const output = process.argv[3];
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-lifetimes-"));
  app.setPath("userData", path.join(root, "electron"));
  app.dock?.hide();
  app.commandLine.appendSwitch("disable-renderer-backgrounding");
  await app.whenReady();
  app.on("window-all-closed", () => {});
  let launches = 0,
    captures = 0;
  app.on("browser-window-created", (_event, window) => {
    launches++;
    const api = window.webContents.debugger;
    const send = api.sendCommand.bind(api);
    api.sendCommand = (...args: Parameters<typeof send>) => {
      if (args[0] === "Page.captureScreenshot") captures++;
      return send(...args);
    };
  });
  let directory = "";
  const document = SceneSchema.parse({
    version: 1,
    id: "fixture",
    name: "Fixture",
    duration: 3,
    entry: "scene.ts",
    size: { width: 640, height: 360 },
    capture: { density: 1 },
    background: "#111111",
    parameters: {},
    sources: ["a", "b"].map((id) => ({
      id,
      kind: "web",
      entry: `${id}/index.html`,
      width: 640,
      height: 360,
      sampling: "static",
    })),
  });
  const store: SessionStore = {
    root,
    id: document.id,
    scene: document,
    revision: "0",
    codeRevision: 0,
    error: null,
    previewDirectory: async () => directory,
  };
  const session = new SceneSession(store, "http://127.0.0.1");
  const commit = async (index: number, changeSource = false) => {
    directory = path.join(root, `snapshot-${index}`);
    for (const id of ["a", "b"]) {
      await fs.mkdir(path.join(directory, id), { recursive: true });
      await fs.writeFile(
        path.join(directory, id, "index.html"),
        `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#e8ebef;font:24px sans-serif;color:#172038}main{margin:32px;padding:40px;background:white;border-radius:16px;box-shadow:0 8px 30px #0002}b{color:#5268de}</style><main><b>Tilt ${id}</b><p>A real browser surface</p><small>${changeSource && id === "a" ? "Changed asset" : "Stable UI"}</small></main>`,
      );
    }
    await fs.writeFile(
      path.join(directory, "scene.ts"),
      `export default function(){return {sample(){return ${index}}}}`,
    );
    await fs.writeFile(
      path.join(directory, "scene.json"),
      JSON.stringify(document),
    );
    store.revision = String(index);
    store.codeRevision = index;
  };
  try {
    await commit(0);
    const coldStart = performance.now();
    const first = await session.frame(0);
    const sourceDigests = { a: digest(first, "a"), b: digest(first, "b") };
    const coldMs = performance.now() - coldStart;
    const baselineLaunches = launches,
      baselineCaptures = captures;
    const times: number[] = [];
    for (let i = 1; i <= 8; i++) {
      await commit(i);
      const start = performance.now();
      const frame = await session.frame(i / 60);
      times.push(performance.now() - start);
      assert.equal(
        digest(frame, "a"),
        digest(first, "a"),
        "composition edits preserve source pixels",
      );
      assert.equal(
        digest(frame, "b"),
        digest(first, "b"),
        "composition edits preserve source pixels",
      );
    }
    const choreography = {
      browserLaunches: launches - baselineLaunches,
      captures: captures - baselineCaptures,
      samplesMs: times,
      medianMs: [...times].sort((a, b) => a - b)[Math.floor(times.length / 2)],
    };
    const beforeLaunches = launches,
      beforeCaptures = captures;
    await commit(9, true);
    const frame = await session.frame(0);
    assert.notEqual(digest(frame, "a"), digest(first, "a"));
    assert.equal(digest(frame, "b"), digest(first, "b"));
    const sourceEdit = {
      browserLaunches: launches - beforeLaunches,
      captures: captures - beforeCaptures,
    };
    const report = {
      label,
      coldMs,
      choreography,
      sourceEdit,
      pixelParity: true,
      sourceDigests,
      electron: process.versions.electron,
    };
    await fs.writeFile(output, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  } finally {
    await session.dispose();
    await fs.rm(root, { recursive: true, force: true });
  }
}
main().then(
  () => app.exit(0),
  (error) => {
    console.error(error);
    app.exit(1);
  },
);
