import { app, BrowserWindow } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import assert from "node:assert/strict";
import { TiltClient } from "../src/main/client";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const exec = promisify(execFile);
const [project, repository] = process.argv.slice(2);
const output = path.dirname(project);
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const until = async (fn: () => Promise<any>, label: string) => {
  const end = Date.now() + 30000;
  while (Date.now() < end) {
    const value = await fn();
    if (value) return value;
    await delay(50);
  }
  throw new Error("Timed out: " + label);
};
app.setPath("userData", path.join(output, "viewer"));
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.dock?.hide();
app.on("window-all-closed", () => {});
const windows: BrowserWindow[] = [];
let host: ReturnType<typeof spawn> | undefined;
const mcp = new Client({
  name: "agent-interface-verification",
  version: "1.0.0",
});
const client = new TiltClient({ project, actorId: "verification-a" });
async function main() {
  await app.whenReady();
  const log = await fs.open(path.join(output, "runtime.log"), "w");
  host = spawn(
    process.execPath,
    [path.join(project, "runtime/main.cjs"), "--project", project, "--browser"],
    {
      stdio: ["ignore", log.fd, log.fd],
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
    },
  );
  const session = await until(async () => {
    try {
      const value = JSON.parse(
        await fs.readFile(path.join(project, ".tilt/session.json"), "utf8"),
      );
      return value.pid === host?.pid && value;
    } catch {
      return false;
    }
  }, "isolated runtime");
  const errors: string[] = [];
  for (let i = 0; i < 2; i++) {
    const window = new BrowserWindow({
      show: false,
      width: 1200,
      height: 900,
      webPreferences: {
        backgroundThrottling: false,
        partition: "agent-test-" + i,
      },
    });
    windows.push(window);
    window.webContents.on("console-message", (event) => {
      if (event.level === "error") errors.push(event.message);
    });
    await window.loadURL(session.origin);
    await until(async () => {
      const views = await client.request({ type: "views" });
      return views.filter((view: any) => view.ready).length === i + 1;
    }, "viewer " + i);
  }
  const viewers = await client.request({ type: "views" });
  const first = viewers[0].viewId,
    second = viewers[1].viewId;
  await client.request({ type: "seek", time: 1.25, viewId: first });
  await client.request({ type: "seek", time: 2.5, viewId: second });
  const firstContext = await client.request({
    type: "context",
    fresh: true,
    viewId: first,
  });
  assert.equal(firstContext.active.presentedTime, 1.25);
  assert.equal(firstContext.active.duration, 4);
  assert.equal(
    (await client.request({ type: "context", viewId: second })).active
      .presentedTime,
    2.5,
  );

  await windows[0].webContents.executeJavaScript(
    'document.querySelector(".timeline-zoom button:last-child").click()',
  );
  await until(
    async () =>
      (await client.request({ type: "context", fresh: true, viewId: first }))
        .active.timeline?.zoom > 1,
    "timeline zoom context",
  );
  await client.request({ type: "select_track", viewId: first, id: "lift" });
  const selected = await client.request({
    type: "context",
    fresh: true,
    viewId: first,
  });
  assert.equal(selected.active.selectedTracks[0].label, "Lift card");
  assert.equal(
    selected.active.timeline.end - selected.active.timeline.start,
    2,
  );
  await windows[0].reload();
  await until(async () => {
    const result = await client.request({ type: "views" });
    return result.find(
      (view: any) =>
        view.connected &&
        view.viewId !== first &&
        view.viewId !== second &&
        view.ready,
    );
  }, "reloaded viewer");
  const reloaded = (await client.request({ type: "views" })).find(
    (view: any) =>
      view.connected && view.viewId !== first && view.viewId !== second,
  ).viewId;
  const restored = await client.request({
    type: "context",
    fresh: true,
    viewId: reloaded,
  });
  assert.equal(restored.active.timeline.zoom, 2);
  assert.equal(restored.active.selectedTracks[0].id, "lift");

  const state = await client.request({
    type: "state",
    sceneId: "interface",
    fresh: true,
  });
  const group = await client.request({
    type: "edit_begin",
    sceneId: "interface",
    label: "Integration edit",
    revision: state.revision,
    paths: ["scene.ts"],
  });
  const original = await client.request({
    type: "read_file",
    sceneId: "interface",
    path: "scene.ts",
  });
  const other = new TiltClient({ project, actorId: "verification-b" });
  await assert.rejects(
    other.request({ type: "edit_apply", sceneId: "interface", id: group.id }),
    /belongs to verification-a/,
  );
  await client.request({
    type: "write_file",
    sceneId: "interface",
    path: "scene.ts",
    content: original.content + "\n// Agent-owned edit\n",
    hash: original.hash,
  });
  const applied = await client.request({
    type: "edit_apply",
    sceneId: "interface",
    id: group.id,
  });
  const displayed = await client.request({
    type: "wait_for_frame",
    viewId: reloaded,
    revision: applied.revision,
  });
  assert.equal(displayed.displayedRevision, applied.revision);
  await assert.rejects(
    client.request({
      type: "set_parameter",
      sceneId: "interface",
      key: "scale",
      value: 1.1,
      revision: state.revision,
    }),
    /changed on disk/,
  );
  const screenshot = await client.request({
    type: "capture",
    viewId: reloaded,
    time: 1.5,
  });
  assert.equal(screenshot.viewId, reloaded);
  assert.equal(screenshot.presentedTime, 1.5);
  assert.equal(
    JSON.parse(await fs.readFile(screenshot.contextPath, "utf8"))
      .displayedRevision,
    applied.revision,
  );
  await fs.copyFile(screenshot.path, path.join(output, "canvas.png"));
  await fs.writeFile(
    path.join(output, "editor.png"),
    (await windows[0].webContents.capturePage()).toPNG(),
  );

  const remote = new TiltClient({
    project: "/not-a-local-workspace",
    url: session.origin,
    token: session.token,
    actorId: "remote-test",
  });
  assert.equal(
    (await remote.request({ type: "state", sceneId: "interface" })).revision,
    applied.revision,
  );
  const watcher = remote.watch({ viewId: second });
  const event = await watcher.next();
  assert.equal(event.value?.data.active.viewId, second);
  const update = (async () => {
    while (true) {
      const result = await watcher.next();
      if (result.done)
        throw new Error("Watch ended before the seek was displayed");
      if (result.value?.data.active?.presentedTime === 3) return true;
    }
  })();
  await client.request({ type: "seek", viewId: second, time: 3 });
  await Promise.race([
    update,
    delay(10000).then(() => {
      throw new Error("Watch notification timed out");
    }),
  ]);
  await watcher.return(undefined);

  const node = process.env.npm_node_execpath || "node";
  const env = {
    ...process.env,
    TILT_PROJECT: project,
    TILT_ACTOR: "mcp-verification",
  };
  await mcp.connect(
    new StdioClientTransport({
      command: node,
      args: [path.join(project, "runtime/agent.cjs")],
      env,
    }),
  );
  const tools = await mcp.listTools();
  for (const name of [
    "tilt_context",
    "tilt_views",
    "tilt_set_camera",
    "tilt_set_track",
    "tilt_wait_for_frame",
    "tilt_begin_edit",
    "tilt_apply_edit",
  ])
    assert.ok(tools.tools.some((tool) => tool.name === name));
  const result = await mcp.callTool({
    name: "tilt_context",
    arguments: { viewId: second, fresh: true },
  });
  assert.equal(result.isError, undefined);
  const context = JSON.parse((result.content as any)[0].text);
  assert.equal(context.active.presentedTime, 3);
  const cli = JSON.parse(
    (
      await exec(
        node,
        [
          path.join(project, "runtime/cli.cjs"),
          "context",
          "--fresh",
          "--view",
          second,
        ],
        { env },
      )
    ).stdout,
  );
  assert.equal(cli.active.viewId, context.active.viewId);
  assert.equal(cli.active.presentedTime, context.active.presentedTime);
  const cliWatch = (
    await exec(
      node,
      [
        path.join(project, "runtime/cli.cjs"),
        "watch",
        "--view",
        second,
        "--count",
        "1",
      ],
      { env },
    )
  ).stdout.trim();
  assert.equal(JSON.parse(cliWatch).data.active.viewId, second);

  await client.request({ type: "open", viewId: second, id: "second" });
  assert.equal(
    (await client.request({ type: "context", fresh: true, viewId: second }))
      .active.sceneId,
    "second",
  );
  assert.equal(
    (await client.request({ type: "context", viewId: reloaded })).active
      .sceneId,
    "interface",
  );
  assert.equal(errors.length, 0, errors.join("\n"));
  const beforeRestart = await client.request({
    type: "context",
    viewId: reloaded,
  });
  await client.request({ type: "shutdown" });
  await until(async () => host?.exitCode !== null, "old runtime exit");
  host = spawn(
    process.execPath,
    [path.join(project, "runtime/main.cjs"), "--project", project, "--browser"],
    {
      stdio: ["ignore", log.fd, log.fd],
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "",
        PORTLESS_URL: session.origin,
        PORT: new URL(session.origin).port,
      },
    },
  );
  await until(async () => {
    try {
      const current = JSON.parse(
        await fs.readFile(path.join(project, ".tilt/session.json"), "utf8"),
      );
      return current.pid === host?.pid;
    } catch {
      return false;
    }
  }, "restarted runtime");
  await until(async () => {
    const views = await client.request({ type: "views" });
    return [reloaded, second].every((id) =>
      views.some(
        (view: any) =>
          view.viewId === id && view.connected && view.ready && !view.error,
      ),
    );
  }, "existing viewers recover without reload");
  await client.request({ type: "seek", viewId: reloaded, time: 2 });
  const recovered = await client.request({
    type: "context",
    fresh: true,
    viewId: reloaded,
  });
  assert.equal(recovered.active.presentedTime, 2);
  assert.equal(recovered.workspaceId, beforeRestart.workspaceId);
  assert.notEqual(recovered.runtimeId, beforeRestart.runtimeId);
  assert.equal(recovered.active.timeline.zoom, 2);
  assert.equal(recovered.active.selectedTracks[0].id, "lift");
  const report = {
    passed: true,
    checks: [
      "independent viewers",
      "timeline range and semantic selection",
      "reload restores context",
      "edit ownership and stale revisions",
      "display acknowledgement and paired PNG",
      "explicit remote connection",
      "context stream",
      "MCP and CLI parity",
      "targeted scene opening",
      "runtime restart recovers existing viewers without reload",
    ],
    mcpTools: tools.tools.length,
    screenshot: path.join(output, "editor.png"),
  };
  await fs.writeFile(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mcp.close().catch(() => {});
    for (const window of windows) if (!window.isDestroyed()) window.destroy();
    await client.request({ type: "shutdown" }).catch(() => {});
    if (host && host.exitCode === null) {
      await delay(500);
      if (host.exitCode === null) host.kill("SIGTERM");
    }
    app.exit(process.exitCode || 0);
  });
