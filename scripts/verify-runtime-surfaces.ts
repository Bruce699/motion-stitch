import { app, BrowserWindow } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import assert from "node:assert/strict";
import { WebSource } from "../src/main/source";
import { SceneSchema } from "../src/core/schema";
import { frameForReceiver } from "../src/core/frame-transfer";
import { encodeFrame, FRAME_CONTENT_TYPE } from "../src/core/frame-wire";

const root = process.env.TILT_SURFACE_ROOT!;
const output = process.env.TILT_SURFACE_OUTPUT!;
async function main() {
  app.setPath("userData", path.join(root, "electron"));
  app.dock?.hide();
  app.commandLine.appendSwitch("disable-renderer-backgrounding");
  await app.whenReady();
  app.on("window-all-closed", () => {});
  const scene = SceneSchema.parse({
    version: 1,
    id: "surfaces",
    name: "Surface verification",
    duration: 4,
    fps: 60,
    size: { width: 640, height: 480 },
    background: "#111111",
    entry: "scene.ts",
    parameters: {},
    capture: { density: 2 },
    sources: [
      {
        id: "react",
        kind: "web",
        entry: "source/index.html",
        width: 320,
        height: 240,
        sampling: "controlled",
        layers: [
          { id: "card", selector: '[data-tilt-id="card"]', padding: 0 },
          { id: "label", selector: '[data-tilt-id="label"]', padding: 0 },
        ],
      },
    ],
  });
  let source: WebSource | undefined,
    viewer: BrowserWindow | undefined,
    server: http.Server | undefined;
  let density = 2,
    captures = 0;
  const replace = async (value: number) => {
    const next = new WebSource(scene.sources[0], "", "", root, value);
    try {
      await next.ready();
    } catch (error) {
      next.dispose();
      throw error;
    }
    const send = next.window.webContents.debugger.sendCommand.bind(
      next.window.webContents.debugger,
    );
    next.window.webContents.debugger.sendCommand = ((
      method: string,
      ...args: any[]
    ) => {
      if (method === "Page.captureScreenshot") captures++;
      return send(method, ...args);
    }) as typeof send;
    const old = source;
    source = next;
    density = value;
    old?.dispose();
  };
  const errors: string[] = [];
  try {
    await replace(2);
    server = http.createServer(async (req, res) => {
      try {
        if (req.method === "POST") {
          const parts: Buffer[] = [];
          for await (const part of req) parts.push(Buffer.from(part));
          const body = JSON.parse(Buffer.concat(parts).toString());
          if (body.type === "config") {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ scene, density }));
            return;
          }
          if (body.type === "density") {
            await replace(body.value);
            res.end("true");
            return;
          }
          if (body.type === "stats") {
            res.end(JSON.stringify({ captures }));
            return;
          }
          if (body.type !== "frame") throw new Error("Unknown fixture command");
          const original = await source!.sample(Math.floor(body.time), {});
          const frame = frameForReceiver(
            {
              ...original,
              quality: [
                {
                  sourceId: "react",
                  density,
                  requestedDensity: density,
                  width: 320 * density,
                  height: 240 * density,
                  limited: false,
                },
              ],
            },
            body.known,
          );
          if (body.mode === "binary") {
            res.setHeader("Content-Type", FRAME_CONTENT_TYPE);
            res.end(encodeFrame(frame));
          } else {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(frame));
          }
          return;
        }
        const file = (
          {
            "/": "index.html",
            "/viewer.js": "viewer.js",
            "/scene.js": "scene.js",
          } as Record<string, string>
        )[req.url!];
        if (!file) {
          res.writeHead(404);
          res.end();
          return;
        }
        res.setHeader(
          "Content-Type",
          file.endsWith(".js") ? "text/javascript" : "text/html",
        );
        res.end(await fs.readFile(path.join(root, "ui", file)));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(error) }));
      }
    });
    await new Promise<void>((resolve) =>
      server!.listen(0, "127.0.0.1", resolve),
    );
    viewer = new BrowserWindow({
      show: false,
      width: 640,
      height: 480,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        backgroundThrottling: false,
      },
    });
    viewer.webContents.on("console-message", (event) => {
      const message = event as unknown as { level: string; message: string };
      if (message.level === "error") errors.push(message.message);
    });
    await viewer.loadURL(
      `http://127.0.0.1:${(server.address() as { port: number }).port}`,
    );
    const report = await viewer.webContents.executeJavaScript(
      "(async()=>{try{return await window.tiltSurfaceVerification.run();}catch(error){return {error:String(error),stack:error.stack}}})()",
    );
    assert.ok(!report.error, JSON.stringify(report));
    const png = Buffer.from(report.png.split(",")[1], "base64");
    delete report.png;
    await fs.writeFile(path.join(output, "composed.png"), png);
    assert.deepEqual(errors, [], "Renderer console errors");
    const result = {
      measuredAt: new Date().toISOString(),
      runtime: {
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        platform: process.platform,
        arch: process.arch,
      },
      endpoint:
        "Actual HTTP response bytes and awaited SceneEngine.sample including browser image decode, texture update and WebGL render submission. GPU completion/display latency is not measured. JSON and binary use identical PNG bytes and receiver acknowledgement behavior.",
      captures,
      ...report,
    };
    await fs.writeFile(
      path.join(output, "results.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    viewer?.destroy();
    source?.dispose();
    server?.close();
    app.exit(Number(process.exitCode) || 0);
  }
}
void main();
