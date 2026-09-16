import { BrowserWindow } from "electron";
import type { SourceSpec } from "../core/schema";
import type { ParameterValues } from "../core/parameters";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { safePath } from "./files";
import { randomUUID } from "node:crypto";
import { MAX_CAPTURE_EDGE, MAX_CAPTURE_PIXELS } from "../core/quality";
import { planDOMLayers, isolationCSS } from "./dom-layers";
import {
  layerTextureKey,
  type CapturedFrame,
  type LayerFrame,
} from "../core/layers";

export function deadline<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: NodeJS.Timeout;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/** A browser adapter. No editor bridge, Node, persistent cookies, or device permissions. */
export class WebSource {
  window: BrowserWindow;
  private lastKey: unknown;
  currentRoute = "";
  private lastFrame?: CapturedFrame;
  private layerMarker = "data-tilt-capture-" + randomUUID();
  private server?: http.Server;
  constructor(
    public spec: SourceSpec,
    private origin: string,
    private prefix: string,
    private directory: string,
    public readonly density = 1,
  ) {
    if (
      !Number.isInteger(density) ||
      density < 1 ||
      density > 8 ||
      spec.width * density > MAX_CAPTURE_EDGE ||
      spec.height * density > MAX_CAPTURE_EDGE ||
      spec.width * spec.height * density * density > MAX_CAPTURE_PIXELS
    )
      throw new Error(
        "Source capture density exceeds the supported pixel budget",
      );
    this.window = new BrowserWindow({
      show: false,
      transparent: true,
      backgroundColor: "#00000000",
      width: spec.width,
      height: spec.height,
      useContentSize: true,
      webPreferences: {
        offscreen: { deviceScaleFactor: density },
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        backgroundThrottling: false,
        partition: `tilt-source-${Math.random()}`,
      },
    });
    this.window.webContents.setFrameRate(60);
    this.window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    this.window.webContents.on("will-navigate", (event) =>
      event.preventDefault(),
    );
    this.window.webContents.session.setPermissionRequestHandler(
      (_w, _p, callback) => callback(false),
    );
  }
  async ready() {
    let url =
      this.spec.url || `${this.origin}/${this.prefix}/${this.spec.entry}`;
    if (this.spec.entry) {
      const entry = await safePath(this.directory, this.spec.entry);
      const root = path.dirname(entry);
      const types: Record<string, string> = {
        ".html": "text/html",
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".webp": "image/webp",
        ".woff2": "font/woff2",
        ".woff": "font/woff",
        ".mp4": "video/mp4",
        ".wasm": "application/wasm",
      };
      this.server = http.createServer(async (req, res) => {
        try {
          const requested =
            decodeURIComponent(
              new URL(req.url || "/", "http://localhost").pathname,
            ).slice(1) || path.basename(entry);
          let file = await safePath(root, requested);
          try {
            await fs.access(file);
          } catch (e: any) {
            if (e.code === "ENOENT" && !path.extname(requested)) file = entry;
            else throw e;
          }
          res.setHeader(
            "Content-Type",
            types[path.extname(file)] || "application/octet-stream",
          );
          res.end(await fs.readFile(file));
        } catch {
          res.writeHead(404);
          res.end("Not found");
        }
      });
      await new Promise<void>((resolve) =>
        this.server!.listen(0, "127.0.0.1", resolve),
      );
      url = `http://127.0.0.1:${(this.server.address() as { port: number }).port}/${path.basename(entry)}`;
    }
    if (this.spec.url) {
      const u = new URL(url);
      if (!["http:", "https:"].includes(u.protocol))
        throw new Error("Sources must use HTTP or HTTPS");
    }
    await deadline(this.window.loadURL(url), 30000, "Source load");
    const debuggerAPI = this.window.webContents.debugger;
    debuggerAPI.attach("1.3");
    await debuggerAPI.sendCommand("Emulation.setDeviceMetricsOverride", {
      width: this.spec.width,
      height: this.spec.height,
      deviceScaleFactor: this.density,
      mobile: false,
    });
    await debuggerAPI.sendCommand(
      "Emulation.setDefaultBackgroundColorOverride",
      { color: { r: 0, g: 0, b: 0, a: 0 } },
    );
    this.currentRoute = await this.route();
    if (this.spec.layers?.length)
      await this.window.webContents.insertCSS(
        ["base", ...this.spec.layers.map((l) => l.id)]
          .map((id) => isolationCSS(this.layerMarker, id))
          .join("\n"),
        { cssOrigin: "user" },
      );
    await deadline(
      this.window.webContents.executeJavaScript(
        `(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.complete?(i.naturalWidth?Promise.resolve():Promise.reject(new Error('Image failed: '+i.src))):i.decode()));if(window.tiltSource?.ready)await window.tiltSource.ready();return true;})()`,
      ),
      30000,
      "Source assets",
    );
  }
  async sample(
    time: number,
    parameters: ParameterValues,
  ): Promise<CapturedFrame> {
    if (this.spec.sampling === "static" && this.lastFrame)
      return this.lastFrame;
    const payload = JSON.stringify({ time, parameters });
    const result = await deadline(
      this.window.webContents.executeJavaScript(
        `(async()=>{const f=${payload};if(${JSON.stringify(this.spec.sampling)}==='controlled'&&typeof window.tiltSource?.sample!=='function')throw new Error('Controlled source must implement window.tiltSource.sample');const result=await window.tiltSource?.sample?.(f);for(const a of document.getAnimations()){a.pause();a.currentTime=f.time*1000;}return {revision:result?.revision??f.time,route:location.pathname+location.search+location.hash};})()`,
      ),
      15000,
      "Source sample",
    );
    const key = result.revision;
    this.currentRoute = result.route;
    if (key === this.lastKey && this.lastFrame) {
      this.lastFrame.routes = [{ id: this.spec.id, route: this.currentRoute }];
      return this.lastFrame;
    }
    await this.paint();
    const images: Record<string, string> = {
      [this.spec.id]: await this.capture(),
    };
    let layers: LayerFrame[] | undefined;
    if (this.spec.layers?.length) {
      const marker = this.layerMarker;
      try {
        const planned = await this.window.webContents.executeJavaScript(
          `(()=>{try{return {plan:(${planDOMLayers.toString()})(${JSON.stringify(this.spec.layers)},${JSON.stringify(marker)},${this.spec.width},${this.spec.height})};}catch(error){return {error:String(error?.message||error)};}})()`,
        );
        if (planned.error) throw new Error(planned.error);
        const plan = planned.plan;
        const baseTexture = layerTextureKey(this.spec.id, "base");
        await this.layerPass("base");
        images[baseTexture] = await this.capture();
        const regions = [];
        for (const region of plan.regions) {
          const texture = layerTextureKey(this.spec.id, region.id);
          regions.push({ ...region, texture });
          if (!region.visible) continue;
          await this.layerPass(region.id);
          images[texture] = await this.capture(region.crop);
        }
        layers = [
          {
            sourceId: this.spec.id,
            width: this.spec.width,
            height: this.spec.height,
            baseTexture,
            regions,
            warnings: plan.warnings,
          },
        ];
      } finally {
        await this.window.webContents.executeJavaScript(
          `document.documentElement.removeAttribute(${JSON.stringify(marker + "-pass")})`,
        );
        await this.window.webContents.executeJavaScript(
          "window.__tiltRestoreLayers?.()",
        );
      }
    }
    this.lastKey = key;
    this.lastFrame = {
      images,
      layers,
      routes: [{ id: this.spec.id, route: this.currentRoute }],
    };
    return this.lastFrame;
  }
  private async layerPass(id: string) {
    await this.window.webContents.executeJavaScript(
      `document.documentElement.setAttribute(${JSON.stringify(this.layerMarker + "-pass")},${JSON.stringify(id)})`,
    );
    await this.paint();
  }
  private paint() {
    return deadline(
      this.window.webContents.executeJavaScript(
        "new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))",
      ),
      15000,
      "Source paint",
    );
  }
  private async capture(rect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) {
    // Chromium's surface capture respects the explicit DPR. Electron 41's
    // capturePage can still return host-display pixels despite the OSR DPR.
    const result = await deadline(
      this.window.webContents.debugger.sendCommand("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: false,
        clip: {
          ...(rect ?? {
            x: 0,
            y: 0,
            width: this.spec.width,
            height: this.spec.height,
          }),
          scale: 1,
        },
      }),
      15000,
      "Source capture",
    );
    const png = Buffer.from(result.data, "base64");
    if (png.length < 24) throw new Error("Source returned an empty frame");
    const expectedWidth = (rect?.width ?? this.spec.width) * this.density;
    const expectedHeight = (rect?.height ?? this.spec.height) * this.density;
    if (
      png.readUInt32BE(16) !== expectedWidth ||
      png.readUInt32BE(20) !== expectedHeight
    )
      throw new Error(
        `Source ${this.spec.id} capture size mismatch: expected ${expectedWidth} × ${expectedHeight}, received ${png.readUInt32BE(16)} × ${png.readUInt32BE(20)}`,
      );
    return `data:image/png;base64,${result.data}`;
  }

  async inspect() {
    return this.window.webContents.executeJavaScript(
      `[...document.querySelectorAll('[data-tilt-id]')].map(el=>{const r=el.getBoundingClientRect();return {id:el.getAttribute('data-tilt-id'),tag:el.tagName,text:el.textContent?.trim().slice(0,120),bounds:{x:r.x,y:r.y,width:r.width,height:r.height}}})`,
    );
  }
  async route() {
    return this.window.webContents.executeJavaScript(
      "location.pathname + location.search + location.hash",
    );
  }
  dispose() {
    if (!this.window.isDestroyed()) this.window.destroy();
    this.server?.close();
  }
}
