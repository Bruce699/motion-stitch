import { BrowserWindow } from "electron";
import type { SourceSpec } from "../core/schema";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { safePath } from "./files";

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
  private lastImage = "";
  private server?: http.Server;
  constructor(
    public spec: SourceSpec,
    private origin: string,
    private prefix: string,
    private directory: string,
  ) {
    this.window = new BrowserWindow({
      show: false,
      width: spec.width,
      height: spec.height,
      useContentSize: true,
      webPreferences: {
        offscreen: true,
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
    this.currentRoute = await this.route();
    await deadline(
      this.window.webContents.executeJavaScript(
        `(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.complete?(i.naturalWidth?Promise.resolve():Promise.reject(new Error('Image failed: '+i.src))):i.decode()));if(window.tiltSource?.ready)await window.tiltSource.ready();return true;})()`,
      ),
      30000,
      "Source assets",
    );
  }
  async sample(time: number, parameters: Record<string, number>) {
    if (this.spec.sampling === "static" && this.lastImage)
      return this.lastImage;
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
    if (key === this.lastKey && this.lastImage) return this.lastImage;
    await deadline(
      this.window.webContents.executeJavaScript(
        "new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))",
      ),
      15000,
      "Source paint",
    );
    const image = await deadline(
      this.window.webContents.capturePage(undefined, {
        stayHidden: true,
        stayAwake: true,
      }),
      15000,
      "Source capture",
    );
    if (image.isEmpty()) throw new Error("Source returned an empty frame");
    this.lastKey = key;
    this.lastImage = image.toDataURL();
    return this.lastImage;
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
