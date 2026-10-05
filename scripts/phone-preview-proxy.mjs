import http from "node:http";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const hopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);
const localCommands = new Set([
  "desktop",
  "shutdown",
  "reveal",
  "reveal_job",
  "project_create",
]);
const sameSecret = (a, b) => {
  const left = Buffer.from(String(a ?? ""));
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};
const headersWithoutHop = (headers) => {
  const named = new Set(
    String(headers.connection ?? "")
      .toLowerCase()
      .split(",")
      .map((s) => s.trim()),
  );
  return Object.fromEntries(
    Object.entries(headers).filter(
      ([key]) => !hopHeaders.has(key) && !named.has(key),
    ),
  );
};
const publicURL = (value) => {
  if (!value) return null;
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Phone access requires one exact HTTPS origin");
  return url;
};
async function readBody(req, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error("Request too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
function remoteJSON(value, upstream, remoteOrigin) {
  if (Array.isArray(value))
    return value.map((item) => remoteJSON(item, upstream, remoteOrigin));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "sourcePreviews")
      .map(([key, item]) => [
        key,
        key === "origin" && item === upstream
          ? remoteOrigin
          : remoteJSON(item, upstream, remoteOrigin),
      ]),
  );
}
function entryPage(nonce) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tilt</title><style nonce="${nonce}">body{font:16px system-ui;background:#fff;color:#111;display:grid;place-items:center;min-height:90svh;margin:24px;text-align:center}</style></head><body><p id="status">Opening Tilt…</p><script nonce="${nonce}">
const key=location.hash.slice(1);history.replaceState(null,"",location.pathname);
if(!key){document.querySelector('#status').textContent='Open the private link from your chat';}
else fetch('/phone/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key}),credentials:'same-origin',redirect:'error'}).then(response=>{if(!response.ok)throw new Error();location.replace('/#playground');}).catch(()=>{document.querySelector('#status').textContent='This private link is unavailable. Open the latest link from your chat';});
</script></body></html>`;
}

// Finite responses are normal SSE reconnects. Keep native event dispatch and
// Last-Event-ID, while letting terminal authentication failures reach Tilt.
const eventsClient = `(() => {
  const NativeEventSource = window.EventSource;
  window.EventSource = class extends NativeEventSource {
    constructor(url, options) {
      super(url, options);
      const parsed = new URL(url, location.href);
      this.phoneEvents = parsed.origin === location.origin && parsed.pathname === '/events';
      this.phoneListeners = new WeakMap();
    }
    addEventListener(type, listener, options) {
      if (type !== 'error' || !listener || !this.phoneEvents) return super.addEventListener(type, listener, options);
      let wrapped = this.phoneListeners.get(listener);
      if (!wrapped) {
        wrapped = event => {
          if (this.readyState === NativeEventSource.CONNECTING) return;
          if (typeof listener === 'function') listener.call(this, event);
          else listener.handleEvent(event);
        };
        this.phoneListeners.set(listener, wrapped);
      }
      super.addEventListener(type, wrapped, options);
    }
    removeEventListener(type, listener, options) {
      super.removeEventListener(type, type === 'error' && this.phoneEvents ? this.phoneListeners.get(listener) || listener : listener, options);
    }
  };
})();`;

function bufferedEventHub(target, { batchMs, idleMs }) {
  const hubs = new Map();
  const closeHub = (hub) => {
    clearTimeout(hub.idle);
    hub.request.destroy();
    if (hubs.get(hub.id) === hub) hubs.delete(hub.id);
  };
  const armIdle = (hub) => {
    clearTimeout(hub.idle);
    if (!hub.waiters.size) {
      hub.idle = setTimeout(() => closeHub(hub), idleMs);
      hub.idle.unref();
    }
  };
  const createHub = (id, headers) => {
    const hub = {
      id,
      epoch: randomBytes(8).toString("hex"),
      next: 0,
      events: [],
      bytes: 0,
      text: "",
      waiters: new Set(),
      request: null,
      failure: null,
      idle: undefined,
      cookie: headers.cookie,
    };
    const failed = (status = 502) => {
      if (hub.failure) return;
      hub.failure = status;
      for (const finish of [...hub.waiters]) finish();
      closeHub(hub);
    };
    const upstreamHeaders = { ...headers };
    delete upstreamHeaders["last-event-id"];
    hub.request = http.get(
      new URL(`/events?viewId=${encodeURIComponent(id)}`, target),
      { headers: upstreamHeaders },
      (response) => {
        if (
          response.statusCode !== 200 ||
          !String(response.headers["content-type"]).startsWith(
            "text/event-stream",
          )
        ) {
          response.resume();
          failed(
            response.statusCode && response.statusCode >= 400
              ? response.statusCode
              : 502,
          );
          return;
        }
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          hub.text += chunk;
          if (Buffer.byteLength(hub.text) > 2 * 1024 * 1024) return failed(502);
          let match;
          while ((match = /\r\n\r\n|\n\n|\r\r/.exec(hub.text))) {
            const block = hub.text
              .slice(0, match.index)
              .replace(/\r\n|\r/g, "\n");
            hub.text = hub.text.slice(match.index + match[0].length);
            if (!/^data(?::|$)/m.test(block)) continue;
            const data = block
              .split("\n")
              .filter((line) => !/^(?:id|retry)(?::|$)/.test(line))
              .join("\n");
            const event = {
              id: ++hub.next,
              text: data,
              bytes: Buffer.byteLength(data),
            };
            hub.events.push(event);
            hub.bytes += event.bytes;
            while (hub.events.length > 256 || hub.bytes > 2 * 1024 * 1024)
              hub.bytes -= hub.events.shift().bytes;
          }
        });
        response.on("end", () => failed());
        response.on("error", () => failed());
      },
    );
    hub.request.on("error", () => failed());
    hubs.set(id, hub);
    return hub;
  };
  return {
    serve(req, res, url, headers, fail) {
      const id = url.searchParams.get("viewId") ?? "";
      if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) return fail(400, "Invalid viewer");
      const lastId = String(req.headers["last-event-id"] ?? "");
      if (lastId && !/^[a-f0-9]{16}:\d{1,12}$/.test(lastId))
        return fail(400, "Invalid event cursor");
      let hub = hubs.get(id);
      if (hub && hub.cookie !== headers.cookie) {
        for (const finish of [...hub.waiters]) finish();
        closeHub(hub);
        hub = undefined;
      }
      if (!hub) {
        if (hubs.size >= 16) {
          const idle = [...hubs.values()].find(
            (candidate) => !candidate.waiters.size,
          );
          if (idle) closeHub(idle);
          else return fail(429, "Too many phone viewers");
        }
        hub = createHub(id, headers);
      }
      clearTimeout(hub.idle);
      const cursor = lastId.startsWith(hub.epoch + ":")
        ? Number(lastId.split(":")[1])
        : 0;
      let finished = false;
      let timer;
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        hub.waiters.delete(finish);
        armIdle(hub);
        if (res.destroyed) return;
        if (hub.failure)
          return fail(hub.failure, "Tilt event connection interrupted");
        if (cursor > hub.next || (cursor && hub.events[0]?.id > cursor + 1))
          return fail(409, "Event cursor expired; reconnect to Tilt");
        const resync =
          !cursor && hub.events[0]?.id > 1
            ? "event: connected\ndata: {}\n\n"
            : "";
        const payload =
          "retry: 500\n\n" +
          resync +
          hub.events
            .filter((event) => event.id > cursor)
            .map((event) => `id: ${hub.epoch}:${event.id}\n${event.text}\n\n`)
            .join("") +
          ": heartbeat\n\n";
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-store",
          "X-Accel-Buffering": "no",
          "Content-Length": Buffer.byteLength(payload),
        });
        res.end(payload);
      };
      hub.waiters.add(finish);
      timer = setTimeout(finish, batchMs);
      timer.unref();
      res.on("close", finish);
    },
    close() {
      for (const hub of [...hubs.values()]) {
        hub.failure = 410;
        for (const finish of [...hub.waiters]) finish();
        closeHub(hub);
      }
    },
  };
}

/** Temporary HTTPS tunnel adapter. The upstream remains loopback-only and keeps
 * its existing browser cookie and CSRF checks; the adapter adds a private gate.
 * publicOrigin may be a getter while a tunnel is being allocated. */
export async function createPhonePreviewProxy({
  upstream,
  publicOrigin,
  accessKey,
  expiresAt,
  projectRoot,
  port = 0,
  bufferedEvents = false,
  eventBatchMs = 750,
  eventIdleMs = 15000,
}) {
  const target = new URL(upstream);
  if (
    target.protocol !== "http:" ||
    target.hostname !== "127.0.0.1" ||
    target.username ||
    target.password ||
    target.pathname !== "/" ||
    target.search ||
    target.hash
  )
    throw new Error("Phone upstream must be a loopback HTTP origin");
  if (typeof accessKey !== "string" || accessKey.length < 32)
    throw new Error("Use a random access key of at least 32 characters");
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now())
    throw new Error("A future expiry is required");
  const root = projectRoot ? await fs.realpath(projectRoot) : undefined;
  const projectId = root
    ? createHash("sha256").update(root).digest("hex")
    : undefined;
  const cookieName = "__Host-tilt_phone_" + randomBytes(8).toString("hex");
  const cookieValue = randomBytes(32).toString("hex");
  const pending = new Set();
  const eventHub = bufferedEvents
    ? bufferedEventHub(target, {
        batchMs: Math.max(10, Math.min(5000, eventBatchMs)),
        idleMs: Math.max(20, Math.min(60000, eventIdleMs)),
      })
    : null;
  const server = http.createServer(async (req, res) => {
    const fail = (status, message) => {
      if (res.headersSent) return res.destroy();
      const html = String(req.headers.accept).includes("text/html");
      res.writeHead(status, {
        "Content-Type": html ? "text/html; charset=utf-8" : "application/json",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(
        html
          ? `<!doctype html><meta name="viewport" content="width=device-width"><title>Tilt</title><p>${message}</p>`
          : JSON.stringify({ error: message, code: "PHONE_ACCESS_REQUIRED" }),
      );
    };
    try {
      const remote = publicURL(
        typeof publicOrigin === "function" ? publicOrigin() : publicOrigin,
      );
      if (!remote) return fail(503, "Phone access is starting");
      if (req.headers.host !== remote.host) return fail(400, "Invalid host");
      if (
        req.headers["x-forwarded-proto"] &&
        req.headers["x-forwarded-proto"] !== "https"
      )
        return fail(400, "HTTPS is required");
      if (Date.now() >= expiresAt)
        return fail(410, "This private link has expired");
      const url = new URL(req.url ?? "/", remote);
      if (url.origin !== remote.origin)
        return fail(400, "Invalid request target");
      const mutating = !["GET", "HEAD"].includes(req.method);
      if (
        req.headers["sec-fetch-site"] === "cross-site" &&
        (mutating || req.headers["sec-fetch-dest"] !== "document")
      )
        return fail(403, "Cross-site request rejected");
      if (req.headers.origin && req.headers.origin !== remote.origin)
        return fail(403, "Origin rejected");
      if (mutating && req.headers.origin !== remote.origin)
        return fail(403, "Origin required");
      if (req.method === "GET" && url.pathname === "/phone") {
        const nonce = randomBytes(16).toString("base64");
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'`,
        });
        return res.end(entryPage(nonce));
      }
      if (req.method === "POST" && url.pathname === "/phone/session") {
        if (
          String(req.headers["content-type"]).split(";")[0] !==
          "application/json"
        )
          return fail(415, "Expected JSON");
        const body = JSON.parse((await readBody(req, 4096)).toString());
        if (!sameSecret(body.key, accessKey))
          return fail(401, "Open the private link from your chat");
        res.writeHead(204, {
          "Set-Cookie": `${cookieName}=${cookieValue}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${Math.max(1, Math.floor((expiresAt - Date.now()) / 1000))}`,
          "Cache-Control": "no-store",
        });
        return res.end();
      }
      const cookies = String(req.headers.cookie ?? "")
        .split(";")
        .map((part) => part.trim());
      if (
        !cookies.some(
          (part) =>
            part.startsWith(cookieName + "=") &&
            sameSecret(part.slice(cookieName.length + 1), cookieValue),
        )
      )
        return fail(401, "Open the private link from your chat");
      if (!["GET", "POST"].includes(req.method))
        return fail(405, "Unsupported method");
      if (
        eventHub &&
        req.method === "GET" &&
        url.pathname === "/phone/events-client.js"
      ) {
        res.writeHead(200, {
          "Content-Type": "text/javascript; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        });
        return res.end(eventsClient);
      }
      let body;
      let command;
      if (req.method === "POST") {
        if (url.pathname !== "/api") return fail(404, "Unknown endpoint");
        if (
          String(req.headers["content-type"]).split(";")[0] !==
          "application/json"
        )
          return fail(415, "Expected JSON");
        body = await readBody(req, 64 * 1024 * 1024);
        command = JSON.parse(body.toString());
        if (localCommands.has(command.type))
          return fail(403, "Use the current project on your phone");
        if (
          command.type === "project_open" &&
          (!root ||
            (command.id
              ? command.id !== projectId
              : typeof command.path !== "string" ||
                !path.isAbsolute(command.path) ||
                path.normalize(command.path) !== root))
        )
          return fail(403, "Use the current project on your phone");
      }
      const headers = headersWithoutHop(req.headers);
      for (const key of Object.keys(headers))
        if (
          key === "authorization" ||
          key === "forwarded" ||
          key.startsWith("x-forwarded-") ||
          key === "accept-encoding"
        )
          delete headers[key];
      headers.host = target.host;
      headers.cookie = cookies
        .filter((part) => !part.startsWith(cookieName + "="))
        .join("; ");
      if (req.headers.origin) headers.origin = target.origin;
      if (body) headers["content-length"] = String(body.length);
      if (eventHub && req.method === "GET" && url.pathname === "/events")
        return eventHub.serve(req, res, url, headers, fail);
      const request = http.request(
        new URL(url.pathname + url.search, target),
        { method: req.method, headers },
        (response) => {
          const responseHeaders = headersWithoutHop(response.headers);
          responseHeaders["cache-control"] = "no-store";
          responseHeaders["referrer-policy"] = "no-referrer";
          const json =
            String(response.headers["content-type"]).split(";")[0] ===
            "application/json";
          if (responseHeaders.location) {
            const redirect = new URL(String(responseHeaders.location), target);
            if (redirect.origin === target.origin)
              responseHeaders.location =
                remote.origin +
                redirect.pathname +
                redirect.search +
                redirect.hash;
          }
          if (
            eventHub &&
            response.statusCode === 200 &&
            ["/", "/index.html"].includes(url.pathname) &&
            String(response.headers["content-type"]).startsWith("text/html")
          ) {
            const chunks = [];
            response.on("data", (chunk) => chunks.push(chunk));
            response.on("end", () => {
              const html = Buffer.concat(chunks)
                .toString()
                .replace(
                  /<script\b/i,
                  '<script src="/phone/events-client.js"></script><script',
                );
              responseHeaders["content-length"] = String(
                Buffer.byteLength(html),
              );
              res.writeHead(200, responseHeaders);
              res.end(html);
            });
          } else if (json) {
            const chunks = [];
            response.on("data", (chunk) => chunks.push(chunk));
            response.on("end", () => {
              try {
                const value = remoteJSON(
                  JSON.parse(Buffer.concat(chunks).toString()),
                  target.origin,
                  remote.origin,
                );
                if (
                  command?.type === "projects" &&
                  Array.isArray(value.projects)
                )
                  value.projects = value.projects.filter(
                    (project) =>
                      root && project.id === projectId && project.path === root,
                  );
                const rewritten = Buffer.from(JSON.stringify(value));
                responseHeaders["content-length"] = String(rewritten.length);
                res.writeHead(response.statusCode ?? 502, responseHeaders);
                res.end(rewritten);
              } catch {
                fail(502, "Invalid upstream response");
              }
            });
          } else {
            if (
              String(response.headers["content-type"]).startsWith(
                "text/event-stream",
              )
            )
              responseHeaders["x-accel-buffering"] = "no";
            res.writeHead(response.statusCode ?? 502, responseHeaders);
            res.flushHeaders();
            response.pipe(res);
          }
          response.on("error", () => fail(502, "Tilt connection interrupted"));
        },
      );
      pending.add(request);
      request.on("close", () => pending.delete(request));
      request.on("error", () => fail(502, "Tilt is unavailable"));
      req.on("aborted", () => request.destroy());
      res.on("close", () => request.destroy());
      request.end(body);
    } catch {
      fail(400, "Invalid phone request");
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  const expiration = setTimeout(
    () => {
      eventHub?.close();
      for (const request of pending) request.destroy();
      server.closeAllConnections();
    },
    Math.min(expiresAt - Date.now(), 2 ** 31 - 1),
  );
  expiration.unref();
  return {
    server,
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () =>
      new Promise((resolve) => {
        clearTimeout(expiration);
        eventHub?.close();
        for (const request of pending) request.destroy();
        server.closeAllConnections();
        server.close(resolve);
      }),
  };
}
