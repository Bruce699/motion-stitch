import { app, BrowserWindow } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { WebSource } from "../src/main/source";
import { serve } from "../src/main/server";
import { compileScene } from "../src/main/scene-session";
import { SceneSchema } from "../src/core/schema";
import { values } from "../src/core/schema";
import { frameForReceiver } from "../src/core/frame-transfer";
async function main() {
  const root = process.env.TILT_PREVIEW_PROJECT;
  if (!root) throw Error("Set TILT_PREVIEW_PROJECT to an authored project");
  const sceneId = process.env.TILT_PREVIEW_SCENE!;
  const output = path.resolve(".tilt/checks/source-preview"),
    directory = path.join(root, "scenes", sceneId);
  app.setPath("userData", path.join(output, "electron"));
  app.commandLine.appendSwitch("disable-renderer-backgrounding");
  app.dock?.hide();
  await app.whenReady();
  app.on("window-all-closed", () => {});
  let source: WebSource | undefined,
    viewer: BrowserWindow | undefined,
    service: Awaited<ReturnType<typeof serve>> | undefined;
  try {
    const scene = SceneSchema.parse(
      JSON.parse(await fs.readFile(path.join(directory, "scene.json"), "utf8")),
    );
    const module = await compileScene(root, directory, scene);
    await fs.copyFile(module, path.join(output, "modules/scene.js"));
    source = new WebSource(scene.sources[0], "", "", directory, 2);
    await source.ready();
    service = await serve({
      ui: path.join(output, "ui"),
      modules: path.join(output, "modules"),
      scene: () => directory,
      token: "isolated-preview-verification",
      command: async (c: any) => {
        if (c.type === "config")
          return {
            scene,
            url: service!.origin + "/modules/scene.js",
            sourcePreviews: { [scene.sources[0].id]: source!.previewURL },
          };
        if (c.type === "frame")
          return frameForReceiver(
            await source!.sample(c.time, values(scene)),
            c.knownImages,
          );
        throw Error("Unknown check command");
      },
    });
    viewer = new BrowserWindow({
      show: false,
      width: 1920,
      height: 1080,
      useContentSize: true,
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
        backgroundThrottling: false,
      },
    });
    await viewer.loadURL(service.origin);
    const run = async (expression: string) => {
      const r = await viewer!.webContents.executeJavaScript(
        `(async()=>{try{return await (${expression})}catch(e){return {error:String(e),stack:e.stack}}})()`,
      );
      assert.ok(!r?.error, JSON.stringify(r));
      return r;
    };
    const report = await run("window.previewCheck.run()");
    await fs.writeFile(
      path.join(output, "dom.png"),
      (await viewer.webContents.capturePage()).toPNG(),
    );
    const raster = await run("window.previewCheck.capture()");
    await fs.writeFile(
      path.join(output, "raster.png"),
      Buffer.from(raster.split(",")[1], "base64"),
    );
    report.camera = await run("window.previewCheck.camera()");
    await run("window.previewCheck.source()");
    await run("window.previewCheck.dispose()");
    assert.ok(
      report.cadence > 25,
      `Preview below 25 samples/s: ${report.cadence}`,
    );
    await fs.writeFile(
      path.join(output, "report.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    viewer?.destroy();
    await source?.dispose();
    await service?.close();
    app.quit();
  }
}
main().catch((e) => {
  console.error(e);
  app.exit(1);
});
