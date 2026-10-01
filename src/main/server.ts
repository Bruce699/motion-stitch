import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { randomBytes } from "node:crypto";
import type { Command } from "../core/schema";
import { safePath } from "./files";
import { encodeFrame, FRAME_CONTENT_TYPE } from "../core/frame-wire";
import type { CapturedFrame } from "../core/layers";
import { navigationErrorPage } from "./navigation-error";
class UnauthorizedRequestError extends Error {
  constructor() {
    super("Unauthorized");
  }
}
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
  agentContext?: (filter: { viewId?: string; sceneId?: string }) => unknown;
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
  // Observers never register as viewers or take ownership of the active view.
  const observers = new Map<
    http.ServerResponse,
    { viewId?: string; sceneId?: string }
  >();
  const sendContext = (
    res: http.ServerResponse,
    filter: { viewId?: string; sceneId?: string },
  ) => {
    if (res.writableLength > 1024 * 1024) {
      res.destroy();
      return;
    }
    try {
      res.write(
        `event: context\ndata: ${JSON.stringify(options.agentContext?.(filter))}\n\n`,
      );
    } catch (error) {
      res.write(
        `event: error\ndata: ${JSON.stringify({ error: String(error) })}\n\n`,
      );
      res.end();
    }
  };
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
          throw new UnauthorizedRequestError();
        if (!String(req.headers["content-type"]).startsWith("application/json"))
          throw new Error("Expected JSON");
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 64 * 1024 * 1024) throw new Error("Request too large");
          chunks.push(chunk);
        }
        const command = JSON.parse(Buffer.concat(chunks).toString());
        const result = await options.command(command);
        if (
          command.type === "frame" &&
          command.includeContext === true &&
          String(req.headers.accept).includes(FRAME_CONTENT_TYPE)
        ) {
          res.writeHead(200, {
            "Content-Type": FRAME_CONTENT_TYPE,
            "Cache-Control": "no-store",
          });
          res.end(Buffer.from(encodeFrame(result as CapturedFrame)));
          return;
        }
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify(result ?? null));
        return;
      }
      if (req.method === "GET" && url.pathname === "/agent-events") {
        if (
          !bearer ||
          crossSite ||
          (req.headers.origin && req.headers.origin !== requestOrigin)
        )
          throw new UnauthorizedRequestError();
        if (!options.agentContext)
          throw new Error("Agent context is unavailable");
        const filter = {
          viewId: url.searchParams.get("viewId") || undefined,
          sceneId: url.searchParams.get("sceneId") || undefined,
        };
        // Validate before sending headers, so stale targets fail as ordinary requests.
        options.agentContext(filter);
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-store",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        });
        observers.set(res, filter);
        sendContext(res, filter);
        const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 2000);
        req.on("close", () => {
          clearInterval(heartbeat);
          observers.delete(res);
        });
        return;
      }
      if (req.method === "GET" && url.pathname === "/events") {
        if (
          !cookie ||
          crossSite ||
          (req.headers.origin && req.headers.origin !== requestOrigin)
        )
          throw new UnauthorizedRequestError();
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
      const entry = url.pathname === "/" || url.pathname === "/index.html";
      // Switching projects can navigate between the named viewer and localhost.
      // Only the public, top-level editor document may cross that boundary.
      const entryNavigation =
        entry &&
        req.headers["sec-fetch-mode"] === "navigate" &&
        req.headers["sec-fetch-dest"] === "document";
      if (req.method !== "GET" || (crossSite && !entryNavigation))
        throw new Error("Unsupported request");
      if (!entry && !cookie && !bearer) throw new UnauthorizedRequestError();
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
      const content = await fs.readFile(file);
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
      });
      res.end(content);
    } catch (e) {
      if (!res.headersSent) {
        const unauthorized = e instanceof UnauthorizedRequestError;
        const documentRequest =
          req.method === "GET" &&
          (req.headers["sec-fetch-dest"] === "document" ||
            String(req.headers.accept).includes("text/html"));
        if (documentRequest) {
          const nonce = randomBytes(16).toString("base64");
          res.writeHead(unauthorized ? 401 : 400, {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`,
          });
          res.end(navigationErrorPage(String(e), nonce));
          return;
        }
        res.writeHead(unauthorized ? 401 : 400, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        res.end(
          JSON.stringify({
            error: String(e),
            ...(unauthorized ? { code: "UNAUTHORIZED" } : {}),
          }),
        );
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
    notifyAgents: () => {
      for (const [res, filter] of observers) sendContext(res, filter);
    },
    broadcast: (event: string, data: unknown) => {
      for (const id of streams.keys()) send(id, event, data);
    },
    close: () => {
      for (const stream of streams.values()) stream.end();
      for (const stream of observers.keys()) stream.end();
      server.close();
    },
  };
}
