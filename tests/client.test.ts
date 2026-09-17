import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { TiltClient, endpointURL } from "../src/main/client";
import { serve } from "../src/main/server";

test("remote connections use explicit credentials and workspace targets without touching local discovery", async () => {
  const calls: any[] = [];
  const server = await serve({
    ui: ".",
    modules: ".",
    scene: () => ".",
    token: "scoped",
    command: async (command) => {
      calls.push(command);
      return { remote: true };
    },
  });
  try {
    const client = new TiltClient({
      project: "/missing-local-project",
      url: server.origin,
      token: "scoped",
      actorId: "agent-a",
      sceneId: "scene-a",
      viewId: "view-a",
    });
    assert.deepEqual(await client.request({ type: "state" }), { remote: true });
    assert.deepEqual(calls[0], {
      type: "state",
      actorId: "agent-a",
      sceneId: "scene-a",
      viewId: "view-a",
    });
    await client.snapshot();
    assert.equal(calls[1].type, "context");
    await assert.rejects(
      new TiltClient({ project: "/missing", url: server.origin }).request({
        type: "jobs",
      }),
      /Missing TILT_TOKEN/,
    );
    await assert.rejects(
      new TiltClient({
        project: "/missing",
        url: server.origin,
        token: "wrong",
      }).request({ type: "jobs" }),
      /Unauthorized/,
    );
    await assert.rejects(
      client.request({ type: "shutdown" }),
      /requires a local/,
    );
    assert.throws(
      () => endpointURL("https://user:secret@example.com", true),
      /without embedded credentials/,
    );
    assert.throws(() => endpointURL("http://example.com", true), /HTTPS/);
    assert.throws(() => endpointURL("https://example.com", false), /loopback/);
  } finally {
    server.close();
  }
});
test("observer streams authenticate, deliver fresh context and never register or disconnect a viewer", async () => {
  let value = 1,
    disconnected = 0;
  const server = await serve({
    ui: ".",
    modules: ".",
    scene: () => ".",
    token: "scoped",
    command: async () => ({}),
    onDisconnect: () => {
      disconnected++;
    },
    agentContext: (filter) => ({
      active: { viewId: filter.viewId, requestedTime: value },
      cursor: "runtime:" + value,
    }),
  });
  const abort = new AbortController();
  try {
    assert.equal((await fetch(server.origin + "/agent-events")).status, 401);
    const client = new TiltClient({
      project: "/missing",
      url: server.origin,
      token: "scoped",
    });
    const watch = client.watch({ viewId: "one" }, abort.signal);
    const first = await watch.next();
    assert.equal(first.value?.event, "context");
    assert.equal(first.value?.data.active.requestedTime, 1);
    const next = watch.next();
    value = 2;
    server.notifyAgents();
    assert.equal((await next).value?.data.active.requestedTime, 2);
    await watch.return(undefined);
    assert.equal(disconnected, 0);
  } finally {
    abort.abort();
    server.close();
  }
});
test("connection redirects never forward the workspace credential", async () => {
  let reached = false;
  const destination = http.createServer((_req, res) => {
    reached = true;
    res.end("{}");
  });
  await new Promise<void>((resolve) =>
    destination.listen(0, "127.0.0.1", resolve),
  );
  const destinationPort = (destination.address() as any).port;
  const redirect = http.createServer((_req, res) => {
    res.writeHead(307, { Location: "http://127.0.0.1:" + destinationPort });
    res.end();
  });
  await new Promise<void>((resolve) =>
    redirect.listen(0, "127.0.0.1", resolve),
  );
  try {
    const client = new TiltClient({
      project: "/missing",
      url: "http://127.0.0.1:" + (redirect.address() as any).port,
      token: "scoped",
    });
    await assert.rejects(client.request({ type: "state" }));
    assert.equal(reached, false);
  } finally {
    redirect.close();
    destination.close();
  }
});
test("local file snapshots explicitly mark stale viewers disconnected", async () => {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-client-"));
  await fs.mkdir(path.join(project, ".tilt"));
  const old = {
    viewId: "one",
    connected: true,
    updatedAt: "2000-01-01T00:00:00Z",
  };
  await fs.writeFile(
    path.join(project, ".tilt/context.json"),
    JSON.stringify({ active: old, views: [old] }),
  );
  try {
    const context = await new TiltClient({ project }).snapshot();
    assert.equal(context.active.connected, false);
    assert.equal(context.views[0].connected, false);
  } finally {
    await fs.rm(project, { recursive: true, force: true });
  }
});
