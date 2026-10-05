import assert from "node:assert/strict";
import http from "node:http";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { test } from "node:test";
import { Readable } from "node:stream";
import vm from "node:vm";
// @ts-expect-error The standalone Node launcher intentionally has no TS build step.
import { createPhonePreviewProxy } from "../scripts/phone-preview-proxy.mjs";

const remote = "https://phone.example.test";
const key = "private-" + "a".repeat(64);
function requestHTTP(url: string, init: RequestInit = {}) {
  return new Promise<Response>((resolve, reject) => {
    const request = http.request(
      url,
      {
        method: init.method,
        headers: init.headers as http.OutgoingHttpHeaders,
        signal: init.signal ?? undefined,
      },
      (response) => {
        const headers = new Headers();
        for (const [key, value] of Object.entries(response.headers)) {
          if (Array.isArray(value))
            for (const item of value) headers.append(key, item);
          else if (value !== undefined) headers.set(key, value);
        }
        resolve(
          new Response(
            response.statusCode === 204
              ? null
              : (Readable.toWeb(response) as ReadableStream<Uint8Array>),
            { status: response.statusCode, headers },
          ),
        );
      },
    );
    request.on("error", reject);
    request.end(init.body);
  });
}
async function fixture(lifetimeMs = 60000, proxyOptions = {}) {
  const received: {
    path: string;
    headers: http.IncomingHttpHeaders;
    body: any;
  }[] = [];
  let eventsClosed = false;
  const eventStreams = new Map<http.ServerResponse, string>();
  let eventStatus = 200;
  let upstreamOrigin = "";
  const root = await fs.realpath(process.cwd());
  const projectId = createHash("sha256").update(root).digest("hex");
  const server = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length
      ? JSON.parse(Buffer.concat(chunks).toString())
      : undefined;
    received.push({ path: req.url!, headers: req.headers, body });
    if (req.url!.startsWith("/events")) {
      if (eventStatus !== 200) {
        res.writeHead(eventStatus, { "Content-Type": "application/json" });
        res.end('{"error":"Unauthorized"}');
        return;
      }
      eventStreams.set(
        res,
        new URL(req.url!, "http://test").searchParams.get("viewId")!,
      );
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      res.write("event: connected\ndata: {}\n\n");
      res.on("close", () => {
        eventsClosed = true;
        eventStreams.delete(res);
      });
      return;
    }
    if (body?.type === "frame") {
      res.writeHead(200, { "Content-Type": "application/vnd.tilt.frame.v1" });
      res.end(Buffer.from([0, 255, 128, 10, 1]));
      return;
    }
    if (req.url === "/") {
      res.writeHead(200, {
        "Content-Type": "text/html",
        "Set-Cookie": "tilt_backend=session; HttpOnly; SameSite=Strict; Path=/",
      });
      res.end(
        '<html><head><script type="module" src="/app.js"></script></head><body>Tilt</body></html>',
      );
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        body?.type === "projects"
          ? {
              projects: [
                { id: projectId, path: root },
                { id: "other", path: "/other" },
              ],
            }
          : {
              origin: upstreamOrigin,
              sourcePreviews: { app: "http://127.0.0.1:9999/" },
              compositions: {
                child: {
                  url: "/modules/child.js",
                  sourcePreviews: { app: "http://127.0.0.1:9999/" },
                },
              },
            },
      ),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  upstreamOrigin = `http://127.0.0.1:${(server.address() as any).port}`;
  let origin: string | undefined = remote;
  const proxy = await createPhonePreviewProxy({
    upstream: upstreamOrigin,
    publicOrigin: () => origin,
    accessKey: key,
    expiresAt: Date.now() + lifetimeMs,
    projectRoot: root,
    ...proxyOptions,
  });
  const headers = { Host: new URL(remote).host, "X-Forwarded-Proto": "https" };
  async function request(pathname: string, body?: unknown, extra = {}) {
    return requestHTTP(proxy.origin + pathname, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        ...headers,
        ...(body === undefined
          ? {}
          : { Origin: remote, "Content-Type": "application/json" }),
        ...extra,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  async function authorize() {
    const response = await request("/phone/session", { key });
    assert.equal(response.status, 204);
    return response.headers.get("set-cookie")!.split(";")[0];
  }
  return {
    proxy,
    root,
    projectId,
    upstreamOrigin,
    headers,
    received,
    request,
    authorize,
    clearOrigin: () => {
      origin = undefined;
    },
    eventsClosed: () => eventsClosed,
    activeEventStreams: () => eventStreams.size,
    emit: (chunk: string, viewId?: string) => {
      for (const [stream, id] of eventStreams)
        if (!viewId || id === viewId) stream.write(chunk);
    },
    setEventStatus: (status: number) => {
      eventStatus = status;
    },
    close: async () => {
      await proxy.close();
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

test("phone gate protects every app route and mints a private secure cookie", async () => {
  const f = await fixture();
  try {
    for (const path of ["/", "/modules/scene.js", "/events?viewId=a"]) {
      const response = await f.request(path);
      assert.equal(response.status, 401);
      assert.equal(response.headers.get("set-cookie"), null);
    }
    assert.equal(
      (await f.request("/phone/session", { key: "wrong" })).status,
      401,
    );
    const entry = await f.request("/phone");
    assert.equal(entry.status, 200);
    const html = await entry.text();
    assert.ok(
      html.indexOf("history.replaceState") <
        html.indexOf("fetch('/phone/session'"),
    );
    assert.ok(!html.includes(key));
    assert.match(
      entry.headers.get("content-security-policy")!,
      /frame-ancestors 'none'/,
    );
    const session = await f.request("/phone/session", { key });
    const cookie = session.headers.get("set-cookie")!;
    assert.match(cookie, /^__Host-tilt_phone_/);
    assert.match(cookie, /HttpOnly; Secure; SameSite=Strict; Path=\//);
    const app = await f.request("/", undefined, {
      Cookie: cookie.split(";")[0],
    });
    assert.equal(app.status, 200);
    assert.match(app.headers.get("set-cookie")!, /^tilt_backend=session;/);
    assert.equal(f.received.at(-1)!.headers.cookie, "");
  } finally {
    await f.close();
  }
});

test("phone proxy rejects foreign hosts, HTTP and CSRF before rewriting", async () => {
  const f = await fixture();
  try {
    const cookie = await f.authorize();
    for (const extra of [
      { Host: "other.test" },
      { "X-Forwarded-Proto": "http" },
      { Origin: "https://other.test" },
      { Origin: "null" },
      { "Sec-Fetch-Site": "cross-site" },
    ])
      assert.ok(
        (
          await f.request(
            "/api",
            { type: "state" },
            { Cookie: cookie, ...extra },
          )
        ).status >= 400,
      );
    assert.equal(f.received.length, 0);
    const noOrigin = await requestHTTP(f.proxy.origin + "/api", {
      method: "POST",
      headers: {
        ...f.headers,
        Cookie: cookie,
        "Content-Type": "application/json",
      },
      body: '{"type":"state"}',
    });
    assert.equal(noOrigin.status, 403);
    f.clearOrigin();
    assert.equal((await f.request("/phone")).status, 503);
  } finally {
    await f.close();
  }
});

test("phone proxy preserves backend auth, adjusts remote routes and leaves binary frames intact", async () => {
  const f = await fixture();
  try {
    const cookie = await f.authorize();
    const response = await f.request(
      "/api",
      { type: "prepare" },
      {
        Cookie: cookie + "; tilt_backend=session",
        Authorization: "Bearer should-not-forward",
        Forwarded: "host=attacker.test",
        "X-Forwarded-Host": "attacker.test",
      },
    );
    assert.equal(response.status, 200);
    const value = await response.json();
    assert.equal(value.origin, remote);
    assert.equal(value.sourcePreviews, undefined);
    assert.equal(value.compositions.child.sourcePreviews, undefined);
    assert.equal(value.compositions.child.url, "/modules/child.js");
    const headers = f.received.at(-1)!.headers;
    assert.equal(headers.host, new URL(f.upstreamOrigin).host);
    assert.equal(headers.origin, f.upstreamOrigin);
    assert.equal(headers.cookie, "tilt_backend=session");
    assert.equal(headers.authorization, undefined);
    assert.equal(headers.forwarded, undefined);
    assert.equal(headers["x-forwarded-host"], undefined);
    const frame = await f.request(
      "/api",
      { type: "frame" },
      { Cookie: cookie },
    );
    assert.equal(
      frame.headers.get("content-type"),
      "application/vnd.tilt.frame.v1",
    );
    assert.deepEqual(
      new Uint8Array(await frame.arrayBuffer()),
      new Uint8Array([0, 255, 128, 10, 1]),
    );
  } finally {
    await f.close();
  }
});

test("phone event streams flush immediately and close the upstream with the viewer", async () => {
  const f = await fixture();
  try {
    const cookie = await f.authorize();
    const controller = new AbortController();
    const response = await requestHTTP(
      f.proxy.origin + "/events?viewId=phone",
      {
        headers: { ...f.headers, Cookie: cookie },
        signal: controller.signal,
      },
    );
    assert.equal(response.headers.get("x-accel-buffering"), "no");
    const reader = response.body!.getReader();
    const chunk = await reader.read();
    assert.match(new TextDecoder().decode(chunk.value), /event: connected/);
    controller.abort();
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(f.eventsClosed(), true);
  } finally {
    await f.close();
  }
});

test("phone project access stays inside the current project", async () => {
  const f = await fixture();
  try {
    const cookie = await f.authorize();
    for (const command of [
      { type: "shutdown" },
      { type: "project_create" },
      { type: "project_open", id: "other" },
      { type: "project_open", path: "/other" },
      { type: "project_open" },
    ])
      assert.equal(
        (await f.request("/api", command, { Cookie: cookie })).status,
        403,
      );
    assert.equal(f.received.length, 0);
    assert.equal(
      (
        await f.request(
          "/api",
          { type: "project_open", id: f.projectId },
          { Cookie: cookie },
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await f.request(
          "/api",
          { type: "project_open", path: f.root },
          { Cookie: cookie },
        )
      ).status,
      200,
    );
    const projects = await f.request(
      "/api",
      { type: "projects" },
      { Cookie: cookie },
    );
    assert.deepEqual((await projects.json()).projects, [
      { id: f.projectId, path: f.root },
    ]);
  } finally {
    await f.close();
  }
});

test("phone access expires even for an already authenticated browser", async () => {
  const f = await fixture(250);
  try {
    const cookie = await f.authorize();
    await new Promise((resolve) => setTimeout(resolve, 260));
    assert.equal(
      (await f.request("/", undefined, { Cookie: cookie })).status,
      410,
    );
    assert.equal((await f.request("/phone/session", { key })).status, 410);
    assert.equal(f.received.length, 0);
  } finally {
    await f.close();
  }
});

test("finite event batches resume without duplicates and keep one upstream until idle", async () => {
  const f = await fixture(60000, {
    bufferedEvents: true,
    eventBatchMs: 30,
    eventIdleMs: 100,
  });
  try {
    assert.equal((await f.request("/events?viewId=phone")).status, 401);
    assert.equal((await f.request("/phone/events-client.js")).status, 401);
    const cookie = await f.authorize();
    const first = await f.request("/events?viewId=phone", undefined, {
      Cookie: cookie,
    });
    const firstText = await first.text();
    assert.match(firstText, /^retry: 500\n/);
    assert.match(firstText, /event: connected/);
    const firstId = [...firstText.matchAll(/^id: (.+)$/gm)].at(-1)![1];
    assert.ok(Number(first.headers.get("content-length")) > 0);
    f.emit('event: change\ndata: {"value":1}\n\nevent: request\nda');
    f.emit('ta: {"id":"a"}\ndata: second line\n\n');
    const second = await f.request("/events?viewId=phone", undefined, {
      Cookie: cookie,
      "Last-Event-ID": firstId,
    });
    const secondText = await second.text();
    assert.ok(!secondText.includes("event: connected"));
    assert.ok(
      secondText.indexOf("event: change") <
        secondText.indexOf("event: request"),
    );
    assert.match(secondText, /data: \{"id":"a"\}\ndata: second line/);
    const secondIds = [...secondText.matchAll(/^id: (.+)$/gm)].map(
      (match) => match[1],
    );
    assert.equal(secondIds.length, 2);
    const third = await f.request("/events?viewId=phone", undefined, {
      Cookie: cookie,
      "Last-Event-ID": secondIds.at(-1)!,
    });
    assert.ok(!(await third.text()).includes("id: "));
    assert.equal(
      f.received.filter((item) => item.path.startsWith("/events")).length,
      1,
    );
    assert.equal(f.activeEventStreams(), 1);
    await new Promise((resolve) => setTimeout(resolve, 120));
    assert.equal(f.activeEventStreams(), 0);
    const reconnect = await f.request("/events?viewId=phone", undefined, {
      Cookie: cookie,
      "Last-Event-ID": secondIds.at(-1)!,
    });
    assert.match(await reconnect.text(), /event: connected/);
    assert.equal(
      f.received.filter((item) => item.path.startsWith("/events")).length,
      2,
    );
  } finally {
    await f.close();
  }
});

test("buffered events preserve viewer isolation and propagate backend authentication failure", async () => {
  const f = await fixture(60000, { bufferedEvents: true, eventBatchMs: 20 });
  try {
    const cookie = await f.authorize();
    f.setEventStatus(401);
    assert.equal(
      (await f.request("/events?viewId=a", undefined, { Cookie: cookie }))
        .status,
      401,
    );
    f.setEventStatus(200);
    const a = await f.request("/events?viewId=a", undefined, {
      Cookie: cookie,
    });
    const aId = [...(await a.text()).matchAll(/^id: (.+)$/gm)].at(-1)![1];
    const b = await f.request("/events?viewId=b", undefined, {
      Cookie: cookie,
    });
    const bId = [...(await b.text()).matchAll(/^id: (.+)$/gm)].at(-1)![1];
    f.emit('event: request\ndata: {"only":"a"}\n\n', "a");
    const aNext = await f.request("/events?viewId=a", undefined, {
      Cookie: cookie,
      "Last-Event-ID": aId,
    });
    const bNext = await f.request("/events?viewId=b", undefined, {
      Cookie: cookie,
      "Last-Event-ID": bId,
    });
    assert.match(await aNext.text(), /"only":"a"/);
    assert.ok(!(await bNext.text()).includes('"only":"a"'));
  } finally {
    await f.close();
  }
});

test("buffered event shim keeps native retry while allowing terminal auth recovery", async () => {
  const f = await fixture(60000, { bufferedEvents: true });
  try {
    const cookie = await f.authorize();
    const html = await (
      await f.request("/", undefined, { Cookie: cookie })
    ).text();
    assert.ok(
      html.indexOf("/phone/events-client.js") < html.indexOf('type="module"'),
    );
    const script = await (
      await f.request("/phone/events-client.js", undefined, { Cookie: cookie })
    ).text();
    class NativeEventSource extends EventTarget {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSED = 2;
      readyState = 0;
    }
    const context = {
      window: { EventSource: NativeEventSource },
      location: { href: remote + "/", origin: remote },
      URL,
    };
    vm.runInNewContext(script, context);
    const stream = new (context.window.EventSource as any)("/events?viewId=a");
    let errors = 0;
    let changes = 0;
    const error = () => {
      errors++;
    };
    stream.addEventListener("error", error);
    stream.addEventListener("change", () => {
      changes++;
    });
    stream.dispatchEvent(new Event("error"));
    assert.equal(errors, 0);
    stream.dispatchEvent(new Event("change"));
    assert.equal(changes, 1);
    stream.readyState = NativeEventSource.CLOSED;
    stream.dispatchEvent(new Event("error"));
    assert.equal(errors, 1);
    stream.removeEventListener("error", error);
    stream.dispatchEvent(new Event("error"));
    assert.equal(errors, 1);
    const other = new (context.window.EventSource as any)("/unrelated-events");
    other.addEventListener("error", error);
    other.dispatchEvent(new Event("error"));
    assert.equal(errors, 2);
  } finally {
    await f.close();
  }
});

test("an expired event cursor reconnects with a state refresh after history trimming", async () => {
  const f = await fixture(60000, { bufferedEvents: true, eventBatchMs: 20 });
  try {
    const cookie = await f.authorize();
    const first = await f.request("/events?viewId=trim", undefined, {
      Cookie: cookie,
    });
    const cursor = [...(await first.text()).matchAll(/^id: (.+)$/gm)].at(
      -1,
    )![1];
    f.emit(
      Array.from(
        { length: 300 },
        (_, index) => `event: change\ndata: {"index":${index}}\n\n`,
      ).join(""),
      "trim",
    );
    const stale = await f.request("/events?viewId=trim", undefined, {
      Cookie: cookie,
      "Last-Event-ID": cursor,
    });
    assert.equal(stale.status, 409);
    const restored = await f.request("/events?viewId=trim", undefined, {
      Cookie: cookie,
    });
    const text = await restored.text();
    assert.match(text, /^retry: 500\n\nevent: connected\ndata: \{\}\n\n/);
    assert.equal([...text.matchAll(/^id:/gm)].length, 256);
    assert.equal(f.activeEventStreams(), 1);
  } finally {
    await f.close();
  }
});
