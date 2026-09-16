import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import type { Command } from "../core/schema";
import { safePath } from "./files";
const types: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
};
export async function serve(options: {
  ui: string;
  scene: () => string;
  modules: string;
  token: string;
  command: (cmd: Command) => Promise<unknown>;
}) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      if (req.method === "POST" && url.pathname === "/api") {
        if (req.headers.authorization !== `Bearer ${options.token}`)
          throw new Error("Unauthorized");
        const chunks: Buffer[] = [];
        let bytes = 0;
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > 4 * 1024 * 1024) throw new Error("Request too large");
          chunks.push(chunk);
        }
        const result = await options.command(
          JSON.parse(Buffer.concat(chunks).toString()),
        );
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result ?? null));
        return;
      }
      if (req.method !== "GET") throw new Error("Unsupported request");
      let root = options.ui;
      let relative = decodeURIComponent(url.pathname).slice(1) || "index.html";
      if (relative.startsWith("source/")) {
        root = options.scene();
        relative = relative.slice(7);
      } else if (relative.startsWith("modules/")) {
        root = options.modules;
        relative = relative.slice(8);
      }
      const file = await safePath(root, relative);
      const content = await fs.readFile(file);
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(content);
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(e) }));
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address() as { port: number };
  return { server, origin: `http://127.0.0.1:${addr.port}` };
}
