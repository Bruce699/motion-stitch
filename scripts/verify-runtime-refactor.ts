import { app, BrowserWindow, nativeImage } from "electron";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { SceneSession } from "../src/main/scene-session";
import { SceneStore } from "../src/main/store";
import { SceneSchema } from "../src/core/schema";
import type { CapturedFrame } from "../src/core/layers";

const sourceRoot = process.env.TILT_REFACTOR_SOURCE_ROOT!;
const buildRoot = process.env.TILT_REFACTOR_BUILD_ROOT!;
const output = process.env.TILT_REFACTOR_OUTPUT!;
const trialCount = Number(process.env.TILT_REFACTOR_TRIALS || 3);
const warmSamples = Number(process.env.TILT_REFACTOR_WARM_SAMPLES || 12);
const reloadSamples = Number(process.env.TILT_REFACTOR_RELOAD_SAMPLES || 5);
const stats = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: sorted.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)],
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
};
const digest = (value: Buffer) =>
  createHash("sha256").update(value).digest("hex");
const pixels = (frame: CapturedFrame) =>
  Object.fromEntries(
    Object.entries(frame.images).map(([id, data]) => [
      id,
      digest(nativeImage.createFromDataURL(data).toBitmap()),
    ]),
  );
const frameBytes = (frame: CapturedFrame) => ({
  json: Buffer.byteLength(JSON.stringify(frame)),
  png: Object.values(frame.images).reduce(
    (sum, data) => sum + Buffer.from(data.split(",")[1], "base64").length,
    0,
  ),
});

async function main() {
  const workspace = await fs.mkdtemp(
    path.join(os.tmpdir(), "tilt-refactor-scenes-"),
  );
  app.setPath("userData", path.join(workspace, "electron"));
  app.commandLine.appendSwitch("disable-renderer-backgrounding");
  app.dock?.hide();
  await app.whenReady();
  app.on("window-all-closed", () => {});
  let created = 0;
  let destroyed = 0;
  let captures = 0;
  const windows: BrowserWindow[] = [];
  app.on("browser-window-created", (_event, window) => {
    created++;
    windows.push(window);
    window.once("closed", () => destroyed++);
    const send = window.webContents.debugger.sendCommand.bind(
      window.webContents.debugger,
    );
    window.webContents.debugger.sendCommand = ((
      method: string,
      ...args: any[]
    ) => {
      if (method === "Page.captureScreenshot") captures++;
      return send(method, ...args);
    }) as typeof send;
  });
  const reports: any[] = [];
  let current: SceneSession | undefined;
  let currentStore: SceneStore | undefined;
  try {
    await fs.symlink(
      path.join(sourceRoot, "node_modules"),
      path.join(workspace, "node_modules"),
    );
    for (let trial = 0; trial < trialCount; trial++) {
      const id = `trial-${trial}`;
      const directory = path.join(workspace, "scenes", id);
      await fs.mkdir(path.join(directory, "react"), { recursive: true });
      await fs.mkdir(path.join(directory, "native"), { recursive: true });
      await fs.copyFile(
        path.join(buildRoot, "react/index.js"),
        path.join(directory, "react/index.js"),
      );
      await fs.writeFile(
        path.join(directory, "react/index.html"),
        '<!doctype html><style>body{margin:0}</style><div id="root"></div><script src="/index.js"></script>',
      );
      await fs.writeFile(
        path.join(directory, "native/mark.svg"),
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#ffb400"/></svg>',
      );
      await fs.writeFile(
        path.join(directory, "native/child.html"),
        "<!doctype html><style>body{margin:0;background:#30886c;color:white;font:14px sans-serif}</style>Same-origin iframe",
      );
      await fs.writeFile(
        path.join(directory, "native/index.html"),
        '<!doctype html><style>body{margin:0;background:#f3e8dd;font:16px sans-serif}section{padding:16px}</style><section data-tilt-id="native"><img src="/mark.svg"> Native DOM<img style="width:32px;height:32px" src="/mark.svg"><iframe src="/child.html" style="display:block;border:0;width:220px;height:64px"></iframe><canvas width="32" height="32"></canvas></section><script>const c=document.querySelector("canvas").getContext("2d");c.fillStyle="#a5334c";c.fillRect(0,0,32,32);window.tiltSource={ready:async()=>{const f=document.querySelector("iframe");if(f.contentDocument.readyState!=="complete")await new Promise(r=>f.addEventListener("load",r,{once:true}));}};</script>',
      );
      const scene = SceneSchema.parse({
        version: 1,
        id,
        name: "Runtime regression",
        duration: 4,
        fps: 60,
        size: { width: 640, height: 480 },
        background: "#111111",
        entry: "scene.ts",
        capture: { density: 1 },
        parameters: {},
        sources: [
          {
            id: "react",
            kind: "web",
            entry: "react/index.html",
            width: 320,
            height: 240,
            sampling: "controlled",
            layers: [
              { id: "card", selector: '[data-tilt-id="card"]', padding: 0 },
              { id: "label", selector: '[data-tilt-id="label"]', padding: 0 },
            ],
          },
          {
            id: "native",
            kind: "web",
            entry: "native/index.html",
            width: 320,
            height: 240,
            sampling: "static",
            layers: [],
          },
        ],
      });
      await fs.writeFile(
        path.join(directory, "scene.json"),
        JSON.stringify(scene),
      );
      const sceneCode = (revision: number) =>
        `export const revision = ${revision}; export default () => ({sample() {},dispose() {}});`;
      await fs.writeFile(path.join(directory, "scene.ts"), sceneCode(0));
      const store = (currentStore = new SceneStore(workspace));
      await store.open(id);
      store.watcher?.close();
      const session = (current = new SceneSession(store, "http://127.0.0.1:1"));
      let start = performance.now();
      const first = await session.frame(0.25);
      const initialMs = performance.now() - start;
      const reference = pixels(first);
      assert.equal(
        Object.keys(reference).length,
        5,
        "Whole sources and explicit layers must be captured",
      );
      const active = windows.filter((window) => !window.isDestroyed());
      assert.equal(active.length, 2);
      const origins = await Promise.all(
        active.map((window) =>
          window.webContents.executeJavaScript("location.origin"),
        ),
      );
      assert.notEqual(
        origins[0],
        origins[1],
        "Imported apps must retain isolated origins",
      );
      const nativeWindow = active[1];
      assert.equal(
        await nativeWindow.webContents.executeJavaScript(
          'document.querySelector("iframe").contentDocument.body.textContent',
        ),
        "Same-origin iframe",
      );
      assert.equal(
        await nativeWindow.webContents.executeJavaScript(
          "[...document.images].every(image=>image.complete&&image.naturalWidth===32)",
        ),
        true,
        "Root-relative assets load",
      );
      const warmMs: number[] = [];
      const beforeWarmCaptures = captures;
      for (let i = 0; i < warmSamples; i++) {
        start = performance.now();
        const frame = await session.frame(0.25);
        warmMs.push(performance.now() - start);
        assert.deepEqual(pixels(frame), reference);
      }
      assert.equal(
        captures - beforeWarmCaptures,
        0,
        "Stable source revision must not recapture",
      );
      const seekMs: number[] = [];
      for (const time of [1, 0.25, 2, 0.25]) {
        start = performance.now();
        const frame = await session.frame(time);
        seekMs.push(performance.now() - start);
        if (time === 0.25)
          assert.deepEqual(
            pixels(frame),
            reference,
            "Backward seeks must reproduce exact pixels",
          );
        else
          assert.notEqual(
            pixels(frame).react,
            reference.react,
            "React source must commit its requested state",
          );
      }
      const reloads: any[] = [];
      for (let i = 1; i <= reloadSamples; i++) {
        await fs.writeFile(path.join(directory, "scene.ts"), sceneCode(i));
        await store.sync();
        const before = { created, captures };
        start = performance.now();
        const frame = await session.frame(0.25);
        reloads.push({
          ms: performance.now() - start,
          sourceRestarts: created - before.created,
          captures: captures - before.captures,
        });
        assert.deepEqual(
          pixels(frame),
          reference,
          "Choreography-only reload must preserve source pixels",
        );
      }
      const liveBeforeFailure = windows.filter(
        (window) => !window.isDestroyed(),
      );
      if (process.env.TILT_REFACTOR_EXPECT_REUSE === "1") {
        assert.ok(
          reloads.every(
            (reload) => reload.sourceRestarts === 0 && reload.captures === 0,
          ),
          "Choreography-only edits must retain browser sources and their captured surfaces",
        );
      }
      await fs.writeFile(
        path.join(directory, "scene.ts"),
        "export default ( => broken",
      );
      await store.sync();
      await assert.rejects(
        session.prepare(),
        undefined,
        "Invalid scene code should report a preparation failure",
      );
      assert.ok(
        liveBeforeFailure.every((window) => !window.isDestroyed()),
        "Compilation failure must preserve successful source resources",
      );
      await fs.writeFile(
        path.join(directory, "scene.ts"),
        sceneCode(reloadSamples),
      );
      await store.sync();
      assert.deepEqual(
        pixels(await session.frame(0.25)),
        reference,
        "Corrected scene must recover identical pixels",
      );
      const beforeSourceEdit = { created, captures };
      await fs.writeFile(
        path.join(directory, "native/mark.svg"),
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#0066ff"/></svg>',
      );
      await store.sync();
      const changedSource = pixels(await session.frame(0.25));
      assert.equal(
        changedSource.react,
        reference.react,
        "Unrelated React source pixels survive another app asset edit",
      );
      assert.notEqual(
        changedSource.native,
        reference.native,
        "Changed source asset must invalidate its pixels",
      );
      const sourceEdit = {
        sourceRestarts: created - beforeSourceEdit.created,
        captures: captures - beforeSourceEdit.captures,
      };
      if (process.env.TILT_REFACTOR_EXPECT_REUSE === "1")
        assert.equal(
          sourceEdit.sourceRestarts,
          1,
          "Only the changed app should restart",
        );
      const beforeSourceFailure = windows.filter(
        (window) => !window.isDestroyed(),
      );
      const nativeEntry = path.join(directory, "native/index.html");
      const nativeHtml = await fs.readFile(nativeEntry, "utf8");
      await fs.writeFile(
        nativeEntry,
        nativeHtml +
          '<script>window.tiltSource.ready=async()=>{throw new Error("fixture startup failure")}</script>',
      );
      await store.sync();
      await assert.rejects(
        session.prepare(),
        /fixture startup failure|Script failed|source|Source/i,
      );
      assert.ok(
        beforeSourceFailure.every((window) => !window.isDestroyed()),
        "Source startup failure must preserve all successful source resources",
      );
      assert.equal(
        windows.filter((window) => !window.isDestroyed()).length,
        2,
        "Failed replacement windows must be disposed",
      );
      await fs.writeFile(nativeEntry, nativeHtml);
      await store.sync();
      assert.deepEqual(
        pixels(await session.frame(0.25)),
        changedSource,
        "Corrected source must recover unchanged pixels",
      );
      if (trial === 0)
        for (const [name, image] of Object.entries(first.images))
          await fs.writeFile(
            path.join(output, name.replace(/[^a-zA-Z0-9_-]/g, "_") + ".png"),
            Buffer.from(image.split(",")[1], "base64"),
          );
      reports.push({
        trial,
        initialMs,
        warmMs,
        seekMs,
        reloads,
        bytes: frameBytes(first),
        hashes: reference,
        sourceOriginsIsolated: true,
        backwardSeekPixelsIdentical: true,
        compilationFailurePreservedSources: true,
        sourceFailurePreservedSources: true,
        sourceEdit,
      });
      console.log(
        JSON.stringify({
          trial,
          initialMs,
          warm: stats(warmMs),
          reload: stats(reloads.map((r) => r.ms)),
          sourceRestarts: reloads.map((r) => r.sourceRestarts),
          captures: reloads.map((r) => r.captures),
        }),
      );
      await session.dispose();
      current = undefined;
      assert.ok(
        windows.every((window) => window.isDestroyed()),
        "Scene disposal must release all source windows",
      );
    }
    const report = {
      measuredAt: new Date().toISOString(),
      sourceRoot,
      runtime: {
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node,
        platform: process.platform,
        arch: process.arch,
        cpu: os.cpus()[0]?.model,
        totalMemory: os.totalmem(),
      },
      options: {
        trialCount,
        warmSamples,
        reloadSamples,
        density: 1,
        sourceSize: [320, 240],
        outputSize: [640, 480],
      },
      endpoint:
        "Awaited SceneSession.frame: source preparation, Chromium capture and layer layout metadata. Excludes compositor, network transfer, display presentation and output encoding; these are not FPS numbers. Reload timing begins after SceneStore.sync and includes scene compilation, source reconciliation, and frame sampling.",
      summary: {
        initialMs: stats(reports.map((r) => r.initialMs)),
        warmMs: stats(reports.flatMap((r) => r.warmMs)),
        seekMs: stats(reports.flatMap((r) => r.seekMs)),
        reloadMs: stats(
          reports.flatMap((r) => r.reloads.map((v: any) => v.ms)),
        ),
        reloadSourceRestarts: reports
          .flatMap((r) => r.reloads)
          .reduce((sum: number, r: any) => sum + r.sourceRestarts, 0),
        reloadCaptures: reports
          .flatMap((r) => r.reloads)
          .reduce((sum: number, r: any) => sum + r.captures, 0),
      },
      resources: {
        created,
        destroyed,
        remainingWindows: BrowserWindow.getAllWindows().length,
        processMemory: await process.getProcessMemoryInfo(),
      },
      reports,
    };
    await fs.writeFile(
      path.join(output, "results.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(
      JSON.stringify({
        output: path.join(output, "results.json"),
        summary: report.summary,
      }),
    );
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await current?.dispose();
    currentStore?.watcher?.close();
    for (const window of BrowserWindow.getAllWindows()) window.destroy();
    await fs.rm(workspace, { recursive: true, force: true });
    app.exit(Number(process.exitCode) || 0);
  }
}
void main();
