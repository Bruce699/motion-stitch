import { app, BrowserWindow } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { WebSource } from "../src/main/source";
import { serve } from "../src/main/server";
import { SceneSchema, values } from "../src/core/schema";
import { frameForReceiver } from "../src/core/frame-transfer";
import { captureQuality } from "../src/core/quality";
async function main() {
  const out = process.argv.at(-1)!;
  app.setPath("userData", path.join(out, "electron"));
  app.dock?.hide();
  app.commandLine.appendSwitch("disable-renderer-backgrounding");
  await app.whenReady();
  app.on("window-all-closed", () => {});
  const scene = SceneSchema.parse(
    JSON.parse(await fs.readFile(path.join(out, "scene/scene.json"), "utf8")),
  );
  const quality = scene.sources.map((s) =>
    captureQuality(scene.size, s, scene.capture, scene.camera?.zoom ?? 1),
  );
  const sources = scene.sources.map(
    (s, i) =>
      new WebSource(s, "", "", path.join(out, "scene"), quality[i].density),
  );
  let viewer: BrowserWindow | undefined;
  let server: Awaited<ReturnType<typeof serve>> | undefined;
  let sourceCalls = 0,
    captures = 0;
  const errors: string[] = [];
  try {
    await Promise.all(sources.map((s) => s.ready()));
    for (const source of sources) {
      const call = source.window.webContents.debugger.sendCommand.bind(
        source.window.webContents.debugger,
      );
      source.window.webContents.debugger.sendCommand = (...args: any[]) => {
        if (args[0] === "Page.captureScreenshot") captures++;
        return call(...(args as Parameters<typeof call>));
      };
    }
    server = await serve({
      ui: path.join(out, "ui"),
      modules: path.join(out, "modules"),
      scene: () => path.join(out, "scene"),
      token: "isolated-scrubbing-check",
      command: async (c: any) => {
        if (c.type === "config") return { scene, url: "/modules/scene.js" };
        if (c.type === "progress") {
          console.log(JSON.stringify(c.message));
          return true;
        }
        if (c.type === "frame") {
          sourceCalls++;
          const frames = await Promise.all(
            sources.map((s) => s.sample(c.time, values(scene))),
          );
          return frameForReceiver(
            {
              images: Object.assign({}, ...frames.map((f) => f.images)),
              imageVersions: Object.assign(
                {},
                ...frames.map((f) => f.imageVersions),
              ),
              layers: frames.flatMap((f) => f.layers || []),
              quality,
              routes: frames.flatMap((f) => f.routes || []),
            },
            c.knownImages,
          );
        }
        throw new Error("Unknown benchmark request");
      },
    });
    viewer = new BrowserWindow({
      show: false,
      width: 818,
      height: 511,
      webPreferences: { backgroundThrottling: false },
    });
    viewer.webContents.on("console-message", (e) => {
      if (e.level === "error") errors.push(e.message);
    });
    await viewer.loadURL(server.origin);
    const result = await viewer.webContents.executeJavaScript(
      "window.runScrubbingChecks()",
    );
    for (const [name, png] of Object.entries(result.shots))
      await fs.writeFile(
        path.join(out, name + ".png"),
        Buffer.from((png as string).split(",")[1], "base64"),
      );
    result.shots = Object.keys(result.shots);
    Object.assign(result, {
      sourceCalls,
      captures,
      errors,
      electron: process.versions.electron,
      measuredAt: new Date().toISOString(),
    });
    await fs.writeFile(
      path.join(out, "report.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
    if (errors.length) throw new Error(errors.join("\n"));
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    viewer?.destroy();
    sources.forEach((s) => s.dispose());
    server?.close();
    app.exit(process.exitCode || 0);
  }
}
void main();
