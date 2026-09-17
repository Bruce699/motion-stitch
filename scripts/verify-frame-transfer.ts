import { app, BrowserWindow } from "electron";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { WebSource } from "../src/main/source";
import { serve } from "../src/main/server";
import { SceneSchema } from "../src/core/schema";
import { frameForReceiver } from "../src/core/frame-transfer";

async function main() {
  const project = process.cwd();
  const output = path.join(project, ".tilt/checks/frame-transfer");
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-transfer-"));
  app.setPath("userData", path.join(root, "electron"));
  app.dock?.hide();
  app.commandLine.appendSwitch("disable-renderer-backgrounding");
  await app.whenReady();
  app.on("window-all-closed", () => {});
  let source: WebSource | undefined;
  let viewer: BrowserWindow | undefined;
  let service: Awaited<ReturnType<typeof serve>> | undefined;
  const errors: string[] = [];
  try {
    await fs.cp(
      path.join(project, "tests/fixtures/transfer-source"),
      path.join(root, "source"),
      { recursive: true },
    );
    const scene = SceneSchema.parse(
      JSON.parse(
        await fs.readFile(
          path.join(project, "tests/fixtures/scene.json"),
          "utf8",
        ),
      ),
    );
    assert.equal(
      scene.sources.length,
      1,
      "Benchmark expects the one-source interface fixture",
    );
    let density = 3;
    let corruptNext = false;
    let captureCount = 0;
    const replaceSource = async (nextDensity: number) => {
      const next = new WebSource(scene.sources[0], "", "", root, nextDensity);
      try {
        await next.ready();
      } catch (error) {
        next.dispose();
        throw error;
      }
      const command = next.window.webContents.debugger.sendCommand.bind(
        next.window.webContents.debugger,
      );
      next.window.webContents.debugger.sendCommand = (...args: any[]) => {
        if (args[0] === "Page.captureScreenshot") captureCount++;
        return command(...(args as Parameters<typeof command>));
      };
      source?.dispose();
      source = next;
      density = nextDensity;
    };
    service = await serve({
      ui: path.join(output, "ui"),
      modules: path.join(output, "modules"),
      scene: () => root,
      token: "isolated-integration-benchmark",
      command: async (command) => {
        const c = command as Record<string, any>;
        switch (c.type) {
          case "config":
            return {
              scene,
              url: `${service!.origin}/modules/scene.js`,
              density,
            };
          case "density":
            await replaceSource(c.value);
            return { density };
          case "fault":
            corruptNext = true;
            return true;
          case "visibility":
            await source!.window.webContents.executeJavaScript(
              `document.querySelector('.summary').style.visibility=${JSON.stringify(c.hidden ? "hidden" : "")}`,
            );
            return true;
          case "stats":
            return { captureCount };
          case "progress":
            console.log(JSON.stringify({ progress: c.message }));
            return true;
          case "frame": {
            const original = await source!.sample(c.time, {});
            const frame = frameForReceiver(
              {
                ...original,
                quality: [
                  {
                    sourceId: "ui",
                    density,
                    requestedDensity: density,
                    width: 1000 * density,
                    height: 640 * density,
                    limited: false,
                  },
                ],
              },
              c.knownImages,
            );
            if (corruptNext) {
              const id = Object.keys(frame.images)[1];
              assert.ok(id, "Fault injection needs a newly transmitted PNG");
              corruptNext = false;
              return {
                ...frame,
                images: {
                  ...frame.images,
                  [id]: "data:image/png;base64,aW52YWxpZA==",
                },
                testFault: { id, version: frame.imageVersions![id] },
              };
            }
            return frame;
          }
          default:
            throw new Error(`Unknown benchmark command ${c.type}`);
        }
      },
    });
    viewer = new BrowserWindow({
      show: false,
      width: scene.size.width,
      height: scene.size.height,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        backgroundThrottling: false,
      },
    });
    viewer.webContents.on("console-message", (event) => {
      const details = event as unknown as { level: string; message: string };
      if (details.level === "error") errors.push(details.message);
    });
    await viewer.loadURL(service.origin);
    const ready = await viewer.webContents.executeJavaScript(
      "Boolean(window.tiltTransferBenchmark)",
    );
    assert.ok(ready, "Benchmark renderer entry did not load");
    const densities = (process.env.TILT_BENCH_DENSITIES || "3,4")
      .split(",")
      .map(Number);
    const options = {
      frames: Number(process.env.TILT_BENCH_FRAMES || 32),
      trials: Number(process.env.TILT_BENCH_TRIALS || 3),
      changing: process.env.TILT_BENCH_CHANGING !== "0",
    };
    assert.ok(densities.every((v) => Number.isInteger(v) && v >= 1 && v <= 7));
    const reports: unknown[] = [];
    for (const value of densities) {
      await replaceSource(value);
      console.log(JSON.stringify({ startingDensity: value, options }));
      const report = await viewer.webContents.executeJavaScript(
        `(async()=>{try{return await window.tiltTransferBenchmark.run(${JSON.stringify(options)});}catch(error){return {__error:String(error),stack:error?.stack};}})()`,
      );
      assert.ok(!report.__error, JSON.stringify(report));
      reports.push(report);
      await fs.writeFile(
        path.join(output, "partial-results.json"),
        JSON.stringify(reports, null, 2),
      );
      console.log(
        JSON.stringify({
          density: value,
          trials: report.trials,
          assertions: report.assertions,
        }),
      );
    }
    const proof = await viewer.webContents.executeJavaScript(
      "(async()=>{try{return await window.tiltTransferBenchmark.verifyRecoveryAndDensity();}catch(error){return {__error:String(error),stack:error?.stack};}})()",
    );
    assert.ok(!proof.__error, JSON.stringify(proof));
    const png = Buffer.from(proof.png.split(",")[1], "base64");
    delete proof.png;
    await fs.writeFile(path.join(output, "density-live.png"), png);
    assert.deepEqual(errors, [], "Renderer console errors");
    const report = {
      measuredAt: new Date().toISOString(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      platform: process.platform,
      architecture: process.arch,
      options,
      reports,
      proof,
      measurement:
        "Real HTTP response bytes and awaited SceneEngine.sample wall time; excludes source preparation, initial warm-up and proof PNG encoding. These are sampling latencies, not displayed FPS. Full baseline deliberately omits receiver acknowledgements; delta uses them. Same lossless density, output and scene in both modes.",
    };
    await fs.writeFile(
      path.join(output, "results.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(
      JSON.stringify({
        result: path.join(output, "results.json"),
        captureCount,
        proof,
      }),
    );
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    viewer?.destroy();
    source?.dispose();
    service?.close();
    await fs.rm(root, { recursive: true, force: true });
    app.exit(Number(process.exitCode) || 0);
  }
}
void main();
