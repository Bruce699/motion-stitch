import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { randomBytes } from "node:crypto";
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
  port?: number;
  strictPort?: boolean;
  publicOrigin?: string;
  ui: string;
  scene: () => string;
  modules: string;
  token: string;
  command: (cmd: Command) => Promise<unknown>;
  onDisconnect?: (id: string) => void;
}) {
  const publicURL = options.publicOrigin ? new URL(options.publicOrigin) : null;
  if (
    publicURL &&
    (!["http:", "https:"].includes(publicURL.protocol) ||
      publicURL.username ||
      publicURL.password ||
      publicURL.pathname !== "/" ||
      publicURL.search ||
      publicURL.hash)
  )
    throw new Error("Expected an HTTP(S) public origin without a path");
  const cookieName = "tilt_" + randomBytes(8).toString("hex");
  const cookieValue = randomBytes(32).toString("hex");
  const streams = new Map<string, http.ServerResponse>();
  let origin = "";
  const server = http.createServer(async (req, res) => {
    try {
      // Match a configured authority; never trust arbitrary forwarded headers.
      const requestOrigin =
        req.headers.host === new URL(origin).host
          ? origin
          : publicURL && req.headers.host === publicURL.host
            ? publicURL.origin
            : null;
      if (!requestOrigin) throw new Error("Invalid host");
      const url = new URL(req.url || "/", origin);
      const bearer = req.headers.authorization === `Bearer ${options.token}`;
      const cookie = (req.headers.cookie || "")
        .split(";")
        .some((c) => c.trim() === `${cookieName}=${cookieValue}`);
      const crossSite = req.headers["sec-fetch-site"] === "cross-site";
      if (req.method === "POST" && url.pathname === "/api") {
        if (
          !bearer &&
          (!cookie || req.headers.origin !== requestOrigin || crossSite)
        )
          throw new Error("Unauthorized");
        if (!String(req.headers["content-type"]).startsWith("application/json"))
          throw new Error("Expected JSON");
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 64 * 1024 * 1024) throw new Error("Request too large");
          chunks.push(chunk);
        }
        const result = await options.command(
          JSON.parse(Buffer.concat(chunks).toString()),
        );
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify(result ?? null));
        return;
      }
      if (req.method === "GET" && url.pathname === "/events") {
        if (
          !cookie ||
          crossSite ||
          (req.headers.origin && req.headers.origin !== requestOrigin)
        )
          throw new Error("Unauthorized");
        const id = url.searchParams.get("viewId") || "";
        if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) throw new Error("Invalid viewer");
        streams.get(id)?.end();
        streams.set(id, res);
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-store",
          Connection: "keep-alive",
        });
        res.write("event: connected\ndata: {}\n\n");
        const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 2000);
        req.on("close", () => {
          clearInterval(heartbeat);
          if (streams.get(id) === res) {
            streams.delete(id);
            options.onDisconnect?.(id);
          }
        });
        return;
      }
      if (req.method !== "GET" || crossSite)
        throw new Error("Unsupported request");
      const entry = url.pathname === "/" || url.pathname === "/index.html";
      if (!entry && !cookie && !bearer) throw new Error("Unauthorized");
      if (entry)
        res.setHeader(
          "Set-Cookie",
          `${cookieName}=${cookieValue}; HttpOnly; SameSite=Strict; Path=/`,
        );
      let root = options.ui;
      let relative = decodeURIComponent(url.pathname).slice(1) || "index.html";
      if (relative.startsWith("modules/")) {
        root = options.modules;
        relative = relative.slice(8);
      }
      const file = await safePath(root, relative);
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
      });
      res.end(await fs.readFile(file));
    } catch (e) {
      if (!res.headersSent) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(e) }));
      } else res.end();
    }
  });
  await new Promise<void>((resolve, reject) => {
    const error = (e: NodeJS.ErrnoException) => {
      if (e.code === "EADDRINUSE" && options.port && !options.strictPort)
        server.listen(0, "127.0.0.1");
      else reject(e);
    };
    server.on("error", error);
    server.once("listening", () => {
      server.off("error", error);
      resolve();
    });
    server.listen(options.port || 0, "127.0.0.1");
  });
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const send = (viewId: string, event: string, data: unknown) =>
    streams
      .get(viewId)
      ?.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  return {
    server,
    origin,
    publicOrigin: publicURL?.origin || origin,
    send,
    broadcast: (event: string, data: unknown) => {
      for (const id of streams.keys()) send(id, event, data);
    },
    close: () => {
      for (const stream of streams.values()) stream.end();
      server.close();
    },
  };
}
