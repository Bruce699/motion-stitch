import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { app, BrowserWindow, Menu, shell } from "electron";
import { SceneSchema, type Command } from "../core/schema";
import { withParameterValue } from "../core/parameters";
import { SceneStore } from "./store";
import { SceneSession, compileScene } from "./scene-session";
import { ViewRegistry } from "./views";
import { Jobs } from "./jobs";
import { serve } from "./server";
import { atomicWrite, hash, manifest, readJSON } from "./files";

export async function startRuntime(
  root: string,
  runtime: string,
  jobs: Jobs,
  browserOnly: boolean,
) {
  const stores = new Map<string, Promise<SceneStore>>();
  const sessions = new Map<string, SceneSession>();
  const views = new ViewRegistry(root);
  await views.init();
  let desktop: BrowserWindow | undefined;
  let stopping = false;
  const activities = new Map<string, { activity: string; at: number }>();
  const catalog = new SceneStore(root);
  const scenes = await catalog.list();
  if (!scenes.length) throw new Error("No scenes found");
  const defaultId =
    scenes.find((s) => s.id === "interface")?.id || scenes[0].id;
  const token = randomBytes(32).toString("hex");
  let http: Awaited<ReturnType<typeof serve>>;
  const getStore = (id: string) => {
    if (!/^[a-z0-9-]+$/.test(id)) throw new Error("Invalid scene ID");
    let p = stores.get(id);
    if (!p) {
      p = (async () => {
        const s = new SceneStore(root);
        await s.open(id);
        s.on("change", () => http?.broadcast("change", { sceneId: id }));
        return s;
      })();
      stores.set(id, p);
      p.catch(() => stores.delete(id));
    }
    return p;
  };
  const getSession = async (id: string) => {
    let s = sessions.get(id);
    if (!s) {
      s = new SceneSession(await getStore(id), http.origin);
      sessions.set(id, s);
    }
    return s;
  };
  const sceneId = (c: Command) =>
    String(
      c.sceneId ||
        views.get(c.viewId as string | undefined)?.sceneId ||
        defaultId,
    );
  const state = async (c: Command) => {
    const s = await getStore(sceneId(c));
    return {
      scenes: await catalog.list(),
      scene: s.scene,
      revision: s.revision,
      codeRevision: s.codeRevision,
      path: s.directory,
      error: s.error,
      jobs: await jobs.list(),
      history: s.journal.summary(),
      origin: http.origin,
      view: views.get(c.viewId as string | undefined) || null,
    };
  };
  async function command(c: Command): Promise<any> {
    if (!c || typeof c.type !== "string")
      throw new Error("Command requires a type");
    const viewId = c.viewId === undefined ? undefined : views.id(c.viewId);
    if (c.type === "context_update") {
      const id = views.id(viewId);
      const current = views.get(id);
      const next = c.context as any;
      const store = await getStore(String(next?.sceneId));
      const routes =
        current?.sourceRoutes?.length && current.sceneId === store.id
          ? undefined
          : store.scene.sources.map((s) => ({
              id: s.id,
              route: s.url || s.entry || "/",
            }));
      return views.update(
        id,
        next,
        Boolean(c.interaction),
        next?.sourceRoutes?.length ? next.sourceRoutes : routes,
      );
    }
    if (c.type === "view_ack")
      return views.acknowledge(
        views.id(viewId),
        String(c.id),
        c.result,
        c.error as string | undefined,
      );
    if (c.type === "context") {
      if (c.fresh) return views.request(viewId, { type: "context" });
      return {
        activeViewId: views.activeId,
        active: views.get(viewId) || null,
        views: [...views.views.values()],
      };
    }
    if (c.type === "state") return state(c);
    if (c.type === "desktop") {
      await openDesktop();
      return { origin: http.origin };
    }
    if (c.type === "shutdown") {
      setTimeout(() => void stop().then(() => app.quit()), 100);
      return { stopping: true };
    }
    if (c.type === "jobs") return jobs.list();
    if (c.type === "cancel") return jobs.cancel(String(c.id));
    if (c.type === "resume") return jobs.resume(String(c.id));
    if (c.type === "reveal_job") {
      const j = await jobs.get(String(c.id));
      if (j.output) shell.showItemInFolder(j.output);
      return {};
    }
    if (c.type === "activity") {
      activities.set(viewId || "agent", {
        activity: String(c.activity),
        at: Date.now(),
      });
      const recent = [...activities.values()].filter(
        (v) => Date.now() - v.at < 3000,
      );
      const activity = recent.some((v) => v.activity === "scrub")
        ? "scrub"
        : recent.some((v) => v.activity === "play")
          ? "play"
          : "idle";
      await atomicWrite(
        path.join(root, ".tilt", "activity.json"),
        JSON.stringify({ activity, at: Date.now() }),
      );
      return {};
    }
    if (["seek", "play", "pause", "view", "capture"].includes(c.type)) {
      const viewer = views.select(viewId);
      const store = await getStore(viewer.sceneId);
      const time = c.time === undefined ? viewer.presentedTime : Number(c.time);
      if (!Number.isFinite(time) || time < 0 || time > store.scene.duration)
        throw new Error("Invalid time");
      const result = await views.request(viewer.viewId, {
        type: c.type,
        time,
        mode: c.mode as any,
        sourceId: c.sourceId as string | undefined,
      });
      if (c.type === "capture") {
        if (
          typeof result?.data !== "string" ||
          !result.data.startsWith("data:image/png;base64,")
        )
          throw new Error("Viewer returned an invalid capture");
        const file = path.join(
          root,
          ".tilt",
          "captures",
          randomUUID() + ".png",
        );
        await atomicWrite(
          file,
          Buffer.from(result.data.split(",")[1], "base64"),
        );
        const metadata = { ...result.context, path: file };
        await atomicWrite(
          file.replace(".png", ".json"),
          JSON.stringify(metadata, null, 2),
        );
        return metadata;
      }
      return result;
    }
    const s = await getStore(sceneId(c));
    const actor = viewId || "agent";
    switch (c.type) {
      case "prepare":
        return (await getSession(s.id)).prepare();
      case "frame": {
        const t = Number(c.time);
        if (!Number.isFinite(t) || t < 0 || t > s.scene.duration)
          throw new Error("Invalid time");
        const result = await (
          await getSession(s.id)
        ).frame(t, c.revision as string | undefined);
        return c.includeContext ? result : result.images;
      }
      case "inspect": {
        const result = await (await getSession(s.id)).inspect();
        const v = views.get(viewId);
        if (v)
          await views.update(
            v.viewId,
            v,
            false,
            result.map((x) => ({ id: x.source, route: x.route })),
          );
        return result;
      }
      case "set_parameter":
        return s.edit(
          (doc) => {
            const p = doc.parameters[String(c.key)];
            if (!p) throw new Error("Unknown parameter");
            doc.parameters[String(c.key)] = withParameterValue(p, c.value);
          },
          undefined,
          actor,
        );
      case "set_setting":
        return s.edit(
          (doc) => {
            if (c.key === "name") doc.name = String(c.value);
            else if (c.key === "background") doc.background = String(c.value);
            else if (c.key === "fps") doc.fps = Number(c.value);
            else if (c.key === "duration") {
              doc.duration = Number(c.value);
              doc.tracks = doc.tracks.map((t) => ({
                ...t,
                start: Math.min(t.start, doc.duration - 0.01),
                end: Math.min(t.end, doc.duration),
                keys: t.keys.filter((k) => k <= doc.duration),
              }));
            } else throw new Error("Unknown setting");
          },
          undefined,
          actor,
        );
      case "replace_scene":
        if (typeof c.revision !== "string")
          throw new Error("Expected revision required");
        return s.edit(
          (doc) => Object.assign(doc, SceneSchema.parse(c.scene)),
          c.revision,
          actor,
        );
      case "history":
        return s.journal.summary();
      case "undo":
      case "redo":
        return s.history(c.type);
      case "edit_begin":
        return s.begin(
          String(c.label || "Agent edit"),
          actor,
          c.revision as string | undefined,
          c.kind === "gesture" ? "gesture" : "agent",
          Array.isArray(c.paths) ? c.paths.map(String) : undefined,
        );
      case "edit_apply":
        return s.apply(String(c.id));
      case "edit_cancel":
        return s.cancel(String(c.id));
      case "open": {
        const target = await getStore(String(c.id));
        if (viewId && views.get(viewId))
          await views.update(
            viewId,
            {
              ...views.get(viewId)!,
              sceneId: target.id,
              requestedTime: 0,
              presentedTime: 0,
              playing: false,
              ready: false,
              displayedRevision: null,
            },
            true,
          );
        return state({ ...c, sceneId: target.id });
      }
      case "create": {
        const created = await catalog.create(String(c.name || "Untitled"));
        http.broadcast("change", {});
        return command({ ...c, type: "open", id: created.id });
      }
      case "list_files":
        return Object.keys(await manifest(s.directory));
      case "read_file": {
        const content = await s.readFile(String(c.path));
        return { content, hash: hash(content) };
      }
      case "write_file":
        return s.writeFile(
          String(c.path),
          String(c.content),
          c.hash as string | undefined,
        );
      case "reveal":
        shell.showItemInFolder(path.join(s.directory, "scene.json"));
        return {};
      case "export": {
        await s.sync();
        if (s.error) throw new Error(s.error);
        if (s.journal.group)
          throw new Error("Apply or cancel the open edit before exporting");
        const document = structuredClone(s.scene);
        const directory = await s.previewDirectory();
        return jobs.submit(
          document,
          directory,
          () => compileScene(root, directory, document),
          String(c.requestId || randomUUID()),
        );
      }
      default:
        throw new Error(`Unknown command: ${c.type}`);
    }
  }
  let port: number | undefined;
  try {
    const previous = await readJSON(path.join(root, ".tilt", "session.json"));
    port = Number(new URL(previous.origin).port);
  } catch {}
  http = await serve({
    port,
    ui: path.join(runtime, "ui"),
    scene: () => path.join(root, "scenes", defaultId),
    modules: path.join(root, ".tilt", "modules"),
    token,
    command,
    onDisconnect: (id) => {
      void views.disconnect(id);
    },
  });
  views.on("request", (id, request) => http.send(id, "request", request));
  await fs.mkdir(path.join(root, ".tilt"), { recursive: true });
  await fs.chmod(path.join(root, ".tilt"), 0o700);
  const sessionFile = path.join(root, ".tilt", "session.json");
  await atomicWrite(
    sessionFile,
    JSON.stringify({
      origin: http.origin,
      token,
      pid: process.pid,
      project: root,
    }),
  );
  await fs.chmod(sessionFile, 0o600);
  await getStore(defaultId);
  await jobs.reconcile();
  async function openDesktop() {
    if (desktop && !desktop.isDestroyed()) {
      desktop.show();
      desktop.focus();
      return;
    }
    app.dock?.show();
    desktop = new BrowserWindow({
      width: 1440,
      height: 960,
      minWidth: 1000,
      minHeight: 680,
      title: "Tilt",
      titleBarStyle: "hiddenInset",
      trafficLightPosition: { x: 18, y: 17 },
      backgroundColor: "#191919",
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        backgroundThrottling: false,
      },
    });
    desktop.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    desktop.webContents.on("will-navigate", (event) => event.preventDefault());
    await desktop.loadURL(http.origin + "/?desktop=1");
    desktop.on("closed", () => {
      desktop = undefined;
      app.dock?.hide();
    });
  }
  async function stop() {
    if (stopping) return;
    stopping = true;
    http.close();
    await views.close();
    for (const p of stores.values()) (await p).watcher?.close();
    for (const s of sessions.values()) s.dispose();
    if (desktop && !desktop.isDestroyed()) desktop.destroy();
  }
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "Tilt",
        submenu: [
          { label: "Open editor", click: () => void openDesktop() },
          {
            label: "Quit Tilt runtime",
            accelerator: "CmdOrCtrl+Q",
            click: () => void stop().then(() => app.quit()),
          },
        ],
      },
      {
        label: "Edit",
        submenu: [
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "selectAll" },
        ],
      },
      {
        label: "View",
        submenu: [{ role: "reload" }, { role: "toggleDevTools" }],
      },
    ]),
  );
  app.on("second-instance", (_event, argv) => {
    if (!argv.includes("--browser")) void openDesktop();
  });
  app.on("activate", () => void openDesktop());
  let quitting = false;
  app.on("before-quit", (event) => {
    if (!quitting) {
      event.preventDefault();
      quitting = true;
      void stop().then(() => app.quit());
    }
  });
  if (browserOnly) app.dock?.hide();
  else await openDesktop();
  console.log(`Tilt is running at ${http.origin}`);
  return { origin: http.origin, stop, command };
}
