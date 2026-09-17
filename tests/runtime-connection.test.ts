import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  createRuntimeConnection,
  connectRuntimeEvents,
} from "../src/renderer/runtime-connection";
import { serve } from "../src/main/server";

const denied = () => Response.json({ code: "UNAUTHORIZED" }, { status: 401 });
const mutation = { method: "POST", body: '{"type":"seek","time":1}' };

test("browser recovery coalesces concurrent handshakes and executes each mutation once", async () => {
  let authenticated = false,
    handshakes = 0,
    executed = 0;
  const connection = createRuntimeConnection(async (url, init) => {
    if (url === "/") {
      handshakes++;
      assert.equal(init?.credentials, "same-origin");
      assert.equal(init?.cache, "no-store");
      assert.equal(init?.redirect, "error");
      await Promise.resolve();
      authenticated = true;
      return new Response("Tilt");
    }
    if (!authenticated) return denied();
    executed++;
    return Response.json({ applied: true });
  });
  const responses = await Promise.all([
    connection.request(mutation),
    connection.request(mutation),
  ]);
  assert.equal(handshakes, 1);
  assert.equal(executed, 2);
  assert.ok(responses.every((response) => response.ok));
});

test("browser recovery retries a proven rejection only once", async () => {
  let posts = 0,
    handshakes = 0;
  const connection = createRuntimeConnection(async (url) => {
    if (url === "/") {
      handshakes++;
      return new Response("Tilt");
    }
    posts++;
    return denied();
  });
  assert.equal((await connection.request(mutation)).status, 401);
  assert.equal(posts, 2);
  assert.equal(handshakes, 1);
});

test("ambiguous failures, command errors and binary frames never replay commands", async () => {
  for (const response of [
    new Error("Network failed after mutation"),
    Response.json({ error: "Unauthorized" }, { status: 400 }),
    Response.json({ error: "Unauthorized" }, { status: 401 }),
    new Response(new Uint8Array([1, 2, 3]), {
      headers: { "Content-Type": "application/x-tilt-frame" },
    }),
  ]) {
    let calls = 0;
    const connection = createRuntimeConnection(async (url) => {
      assert.equal(url, "/api");
      calls++;
      if (response instanceof Error) throw response;
      return response;
    });
    if (response instanceof Error)
      await assert.rejects(connection.request(mutation), /Network failed/);
    else assert.equal(await connection.request(mutation), response);
    assert.equal(calls, 1);
  }
});

test("server auth rejects before parsing or executing, and operational errors cannot request replay", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-reconnect-"));
  await fs.writeFile(path.join(dir, "index.html"), "Tilt");
  let executed = 0,
    failAfterMutation = false;
  const server = await serve({
    ui: dir,
    scene: () => dir,
    modules: dir,
    token: "test",
    command: async () => {
      executed++;
      if (failAfterMutation) throw new Error("Unauthorized");
      return { applied: true };
    },
  });
  let cookie = "tilt_old=stale";
  const connection = createRuntimeConnection(async (url, init) => {
    const response = await fetch(server.origin + url, {
      ...init,
      headers: { ...init?.headers, Cookie: cookie, Origin: server.origin },
    });
    cookie = response.headers.get("set-cookie")?.split(";")[0] || cookie;
    return response;
  });
  try {
    const malformed = await fetch(server.origin + "/api", {
      method: "POST",
      body: "malformed-json",
    });
    assert.equal(malformed.status, 401);
    assert.equal((await malformed.json()).code, "UNAUTHORIZED");
    assert.equal(executed, 0);
    const init = {
      ...mutation,
      headers: { "Content-Type": "application/json" },
    };
    assert.equal((await connection.request(init)).status, 200);
    assert.equal(executed, 1);
    failAfterMutation = true;
    const failed = await connection.request(init);
    assert.equal(failed.status, 400);
    assert.equal((await failed.json()).code, undefined);
    assert.equal(executed, 2);
  } finally {
    server.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
});

class FakeEvents extends EventTarget {
  closed = false;
  close() {
    this.closed = true;
  }
  emit(type: string) {
    this.dispatchEvent(new Event(type));
  }
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 25));

test("event stream reopens after recovery and stops after three failed handshakes", async () => {
  const streams: FakeEvents[] = [];
  let handshakes = 0,
    connected = 0,
    failing = false;
  const close = connectRuntimeEvents({
    url: "/events",
    retryDelayMs: 1,
    create: () => {
      const stream = new FakeEvents();
      streams.push(stream);
      return stream;
    },
    recover: async () => {
      handshakes++;
      if (failing) throw new Error("offline");
    },
    listeners: {
      connected: () => {
        connected++;
      },
    },
  });
  try {
    streams[0].emit("error");
    streams[0].emit("error");
    await settle();
    assert.equal(handshakes, 1);
    assert.equal(streams.length, 2);
    assert.equal(streams[0].closed, true);
    streams[1].emit("connected");
    assert.equal(connected, 1);
    failing = true;
    streams[1].emit("error");
    await settle();
    assert.equal(handshakes, 4);
    await settle();
    assert.equal(handshakes, 4);
  } finally {
    close();
  }
});

test("closing during a handshake cannot open another event stream", async () => {
  let resolve!: () => void;
  let started!: () => void;
  const pending = new Promise<void>((done) => {
    resolve = done;
  });
  const recovering = new Promise<void>((done) => {
    started = done;
  });
  const stream = new FakeEvents();
  let opened = 0;
  const close = connectRuntimeEvents({
    url: "/events",
    retryDelayMs: 1,
    listeners: {},
    create: () => {
      opened++;
      return stream;
    },
    recover: () => {
      started();
      return pending;
    },
  });
  stream.emit("error");
  await recovering;
  close();
  resolve();
  await settle();
  assert.equal(opened, 1);
  assert.equal(stream.closed, true);
});
