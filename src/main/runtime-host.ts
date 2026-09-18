import {
  CompositionClipSchema,
  compositionCameras,
  splitClip,
  trimClip,
  validateCompositionGraph,
  type CompositionGraph,
} from "../core/compositions";
import { ProjectLibrary, projectRuntime } from "./projects";
import type { SceneDocument } from "../core/schema";
import { retimeTracks } from "../core/tracks";
import { withCameraPatch } from "../core/camera";
import { frameForReceiver } from "../core/frame-transfer";
import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { app, BrowserWindow, Menu, nativeTheme, shell, dialog } from "electron";
import { SceneSchema, type Command } from "../core/schema";
import {
  agentCommands,
  parseAgentCommand,
  commandCatalogue,
} from "../core/commands";
import { withParameterValue } from "../core/parameters";
import { SceneStore } from "./store";
import { SceneSession, compileScene } from "./scene-session";
import { validatePackagedSource } from "./source-host";
import { ViewRegistry } from "./views";
import { Jobs } from "./jobs";
import { Reviews } from "./review";
import { serve } from "./server";
import { atomicWrite, hash, manifest, readJSON } from "./files";
import { ViewerExitCoordinator, viewerMutationCommands } from "./viewer-exit";
import { GuidanceLibrary, projectAgentInstructions } from "./guidance";

export async function startRuntime(
  root: string,
  runtime: string,
  jobs: Jobs,
  browserOnly: boolean,
) {
  const projects = new ProjectLibrary(
    process.env.TILT_PROJECTS_DIRECTORY ||
      path.join(app.getPath("appData"), "Tilt", "projects"),
    projectAgentInstructions(path.join(runtime, "cli.cjs")),
  );
  const guidance = new GuidanceLibrary(runtime);
  await projects.register(root);
  const projectOrigins = new Set<string>();
  const openingProjects = new Map<string, Promise<string>>();
  const stores = new Map<string, Promise<SceneStore>>();
  const sessions = new Map<string, SceneSession>();
  const viewerExits = new ViewerExitCoordinator();
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
        // Persisted viewer gestures cannot still be active after a runtime restart.
        if (s.journal.group?.kind === "gesture")
          await s.finishGesture(s.journal.group.actor);
        const observe = () => {
          http?.broadcast("change", { sceneId: id });
          void views
            .observeScene({
              sceneId: s.id,
              name: s.scene.name,
              duration: s.scene.duration,
              fps: s.scene.fps,
              revision: s.revision,
              codeRevision: s.codeRevision,
              error: s.error,
              pendingEdit: s.journal.group || null,
            })
            .catch((error) =>
              console.error("Could not publish agent context", error),
            );
        };
        s.on("change", observe);
        observe();
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
  const reviews = new Reviews(root, runtime, getStore);
  const documents = async (rootId: string, replacement?: SceneDocument) => {
    const result: Record<string, SceneDocument> = {};
    const visit = async (id: string) => {
      if (result[id]) return;
      const store = await getStore(id);
      if (store.error) throw new Error(store.error);
      result[id] = id === rootId && replacement ? replacement : store.scene;
      for (const clip of result[id].clips ?? [])
        await visit(clip.compositionId);
    };
    await visit(rootId);
    validateCompositionGraph(rootId, result);
    return result;
  };
  const prepareGraph = async (id: string) => {
    const docs = await documents(id);
    const graph: CompositionGraph = {};
    for (const key of Object.keys(docs))
      graph[key] = await (await getSession(key)).prepare();
    validateCompositionGraph(
      id,
      Object.fromEntries(
        Object.entries(graph).map(([id, item]) => [id, item.scene]),
      ),
    );
    return { ...graph[id], compositions: graph };
  };
  const state = async (c: Command) => {
    const s = await getStore(sceneId(c));
    if (c.fresh) await s.sync();
    let compositions: Record<string, SceneDocument> = {};
    let dependencyRevision = "";
    let dependencyError: string | null = null;
    try {
      compositions = await documents(s.id);
      dependencyRevision = hash(
        JSON.stringify(
          await Promise.all(
            Object.keys(compositions)
              .filter((id) => id !== s.id)
              .map(async (id) => [id, (await getStore(id)).revision]),
          ),
        ),
      );
    } catch (error) {
      dependencyError = String(error);
    }
    return {
      project: { name: path.basename(root), path: root },
      compositions,
      dependencyRevision,
      workspaceId: views.workspaceId,
      scenes: await catalog.list(),
      scene: s.scene,
      revision: s.revision,
      codeRevision: s.codeRevision,
      path: s.directory,
      error: s.error ?? dependencyError,
      jobs: await jobs.list(),
      history: s.journal.summary(),
      origin: http.publicOrigin,
      view:
        views.get(c.viewId as string | undefined)?.sceneId === s.id
          ? views.get(c.viewId as string | undefined)
          : null,
    };
  };
  async function command(c: Command): Promise<any> {
    if (!c || typeof c.type !== "string")
      throw new Error("Command requires a type");
    if (Object.hasOwn(agentCommands, c.type)) c = parseAgentCommand(c);
    const viewId = c.viewId === undefined ? undefined : views.id(c.viewId);
    if (c.type === "viewer_exit")
      return viewerExits.finish(c, getStore, (actor) =>
        Promise.all(
          [...stores.values()].map(async (store) =>
            (await store).finishGesture(actor),
          ),
        ),
      );
    if (viewId && viewerMutationCommands.has(c.type))
      viewerExits.assertOpen(viewId);
    if (c.type === "context_update" && viewerExits.isClosed(viewId))
      return { exiting: true };
    if (c.type === "capabilities")
      return {
        version: 1,
        workspaceId: views.workspaceId,
        commands: commandCatalogue(),
        guidance: await guidance.catalogue(),
        context: {
          snapshot: ".tilt/context.json",
          watch: "/agent-events",
          freshAcknowledgement: true,
        },
        sourceKinds: ["web"],
        fileAuthoring: true,
        editOwnership: true,
        workflow: [
          "Discover guidance; read workspace-context and motion-design when relevant",
          "Read context and state",
          "Pin viewId for viewer work",
          "Begin a scoped edit at the current revision",
          "Write files and validate",
          "Apply with the same actorId",
          "Wait for the displayed revision and inspect a capture",
        ],
      };
    if (c.type === "guidance")
      return c.path === undefined ? guidance.catalogue() : guidance.read(String(c.path));
    if (c.type === "views")
      return views.snapshot(undefined, c.sceneId as string | undefined).views;
    if (c.type === "context_update") {
      const id = views.id(viewId);
      const current = views.get(id);
      const next = c.context as any;
      const store = await getStore(String(next?.sceneId));
      if (viewerExits.isClosed(viewId)) return { exiting: true };
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
      const target = views.target(viewId, c.sceneId as string | undefined);
      if (c.fresh) {
        if (!target)
          throw new Error("No connected viewer. Open Tilt or specify --view.");
        await views.request(target.viewId, { type: "context" });
        return {
          ...views.snapshot(viewId, c.sceneId as string | undefined),
          acknowledgedAt: new Date().toISOString(),
          acknowledgedViewId: target.viewId,
        };
      }
      return views.snapshot(viewId, c.sceneId as string | undefined);
    }
    if (c.type === "wait_for_change")
      return views.waitForChange(
        String(c.since),
        Number(c.timeoutMs),
        viewId,
        c.sceneId as string | undefined,
      );
    if (c.type === "projects") return { projects: await projects.list() };
    if (c.type === "project_open" || c.type === "project_create") {
      let folder = typeof c.path === "string" ? c.path : undefined;
      if (c.id) folder = (await projects.get(String(c.id))).path;
      if (!folder) {
        if (c.type === "project_create") {
          const result = await dialog.showSaveDialog({
            title: "New project",
            buttonLabel: "Create project",
            defaultPath: path.join(
              app.getPath("documents"),
              "Untitled project",
            ),
          });
          if (result.canceled || !result.filePath) return {};
          folder = result.filePath;
        } else {
          const result = await dialog.showOpenDialog({
            title: "Open project",
            buttonLabel: "Open project",
            properties: ["openDirectory"],
          });
          if (result.canceled || !result.filePaths[0]) return {};
          folder = result.filePaths[0];
        }
      }
      const project =
        c.type === "project_create"
          ? await projects.create(folder)
          : await projects.open(folder);
      let origin = http.publicOrigin;
      if (project.path !== (await fs.realpath(root))) {
        let pending = openingProjects.get(project.path);
        if (!pending) {
          pending = projectRuntime(project.path, runtime, projects);
          openingProjects.set(project.path, pending);
          void pending
            .finally(() => openingProjects.delete(project.path))
            .catch(() => {});
        }
        origin = await pending;
      }
      projectOrigins.add(new URL(origin).origin);
      return { project, origin };
    }
    if (c.type === "state") return state(c);
    if (c.type === "desktop") {
      await openDesktop();
      return { origin: http.publicOrigin };
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
    if (
      [
        "seek",
        "play",
        "pause",
        "view",
        "capture",
        "select_track",
        "wait_for_frame",
      ].includes(c.type)
    ) {
      const target = views.target(viewId, c.sceneId as string | undefined);
      if (!target)
        throw new Error("No connected viewer. Open Tilt or specify --view.");
      const viewer = views.select(target.viewId);
      const store = await getStore(viewer.sceneId);
      if (
        c.type === "select_track" &&
        c.id !== null &&
        !store.scene.tracks.some((track) => track.id === c.id) &&
        !(store.scene.clips ?? []).some((clip) => clip.id === c.id)
      )
        throw new Error("Unknown track");
      if (
        c.type === "view" &&
        c.sourceId &&
        !store.scene.sources.some((source) => source.id === c.sourceId)
      )
        throw new Error("Unknown source");
      const time = c.time === undefined ? viewer.presentedTime : Number(c.time);
      if (!Number.isFinite(time) || time < 0 || time > store.scene.duration)
        throw new Error("Invalid time");
      const result = await views.request(viewer.viewId, {
        type: c.type,
        time,
        mode: c.mode as any,
        sourceId: c.sourceId as string | undefined,
        trackId: c.id as string | null | undefined,
        cameraId: c.cameraId as string | undefined,
        revision: c.revision as string | undefined,
        timeoutMs: c.timeoutMs as number | undefined,
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
        const metadata = {
          ...result.context,
          viewId: viewer.viewId,
          workspaceId: views.workspaceId,
          observedAt: new Date().toISOString(),
          path: file,
          contextPath: file.replace(".png", ".json"),
        };
        await atomicWrite(
          file.replace(".png", ".json"),
          JSON.stringify(metadata, null, 2),
        );
        return metadata;
      }
      return result;
    }
    const s = await getStore(sceneId(c));
    // A request can have arrived before pagehide and waited for this store while
    // the final exit patch sealed the viewer. Recheck before enqueuing any write.
    if (viewId && viewerMutationCommands.has(c.type))
      viewerExits.assertOpen(viewId);
    const actor = String(c.actorId || viewId || "agent");
    switch (c.type) {
      case "review": {
        const { type, sceneId: _scene, viewId: _view, actorId: _actor, ...input } = c;
        return reviews.review(s.id, input as any);
      }
      case "review_status":
        return reviews.status(String(c.id), Boolean(c.includeImages), c.artifactIndices as number[] | undefined);
      case "prepare":
        return prepareGraph(s.id);
      case "frame": {
        const t = Number(c.time);
        if (!Number.isFinite(t) || t < 0 || t > s.scene.duration)
          throw new Error("Invalid time");
        const zoom = c.captureZoom === undefined ? 1 : Number(c.captureZoom);
        if (!Number.isFinite(zoom) || zoom < 0.1 || zoom > 12)
          throw new Error("Invalid capture zoom");
        const result = await (
          await getSession(s.id)
        ).frame(t, c.revision as string | undefined, zoom, c.overrides as any);
        return c.includeContext
          ? frameForReceiver(result, c.knownImages)
          : result.images;
      }
      case "inspect": {
        // Inspection can sample another source state; it is not a viewer acknowledgement.
        return (await getSession(s.id)).inspect();
      }
      case "add_camera":
        return s.edit(
          (doc) => {
            const source = compositionCameras(doc).find(
              (camera) =>
                camera.id === (c.from ?? doc.defaultCameraId ?? "main"),
            );
            if (!source) throw new Error("Unknown camera");
            (doc.cameras ??= []).push({
              id: "camera-" + randomUUID().slice(0, 8),
              name: String(c.name),
              settings: structuredClone(source.settings),
            });
          },
          c.revision as string | undefined,
          actor,
        );
      case "camera_metadata":
        return s.edit(
          (doc) => {
            if (
              !compositionCameras(doc).some(
                (camera) => camera.id === c.cameraId,
              )
            )
              throw new Error("Unknown camera");
            if (c.name) {
              if (c.cameraId === "main") doc.cameraName = String(c.name);
              else
                doc.cameras!.find((camera) => camera.id === c.cameraId)!.name =
                  String(c.name);
            }
            if (c.makeDefault) doc.defaultCameraId = String(c.cameraId);
          },
          c.revision as string | undefined,
          actor,
        );
      case "expose_parameter":
        return s.edit(
          (doc) => {
            if (!doc.parameters[String(c.key)])
              throw new Error("Unknown parameter");
            const keys = new Set(doc.exposedParameters ?? []);
            c.exposed ? keys.add(String(c.key)) : keys.delete(String(c.key));
            doc.exposedParameters = [...keys];
          },
          c.revision as string | undefined,
          actor,
        );
      case "add_clip":
      case "set_clip":
      case "trim_clip":
      case "split_clip":
      case "remove_clip":
      case "clip_parameter": {
        // Resolve dependencies before entering the journal lock; revalidate the
        // candidate against this snapshot inside the guarded, atomic edit.
        const dependencies = await documents(s.id);
        if (c.type === "add_clip")
          Object.assign(dependencies, await documents(String(c.compositionId)));
        return s.edit(
          (doc) => {
            const clips = (doc.clips ??= []);
            const index = clips.findIndex((clip) => clip.id === c.id);
            if (c.type === "add_clip") {
              const source = dependencies[String(c.compositionId)];
              const start = Math.round(Number(c.start) * doc.fps) / doc.fps;
              if (start >= doc.duration)
                throw new Error("Place the clip before the composition ends");
              clips.push(
                CompositionClipSchema.parse({
                  id: "clip-" + randomUUID().slice(0, 8),
                  compositionId: source.id,
                  label: source.name,
                  start,
                  end: Math.min(doc.duration, start + source.duration),
                  sourceIn: 0,
                }),
              );
            } else {
              if (index < 0) throw new Error("Unknown clip");
              const clip = clips[index];
              if (c.type === "remove_clip") clips.splice(index, 1);
              else if (c.type === "split_clip")
                clips.splice(
                  index,
                  1,
                  ...splitClip(
                    clip,
                    Math.round(Number(c.time) * doc.fps) / doc.fps,
                    "clip-" + randomUUID().slice(0, 8),
                  ),
                );
              else if (c.type === "trim_clip") {
                const base = c.base as
                  { start: number; end: number } | undefined;
                if (
                  base &&
                  (base.start !== clip.start || base.end !== clip.end)
                )
                  throw new Error("Clip changed while dragging");
                const timing = c.timing as { start: number; end: number };
                clips[index] = trimClip(clip, timing.start, timing.end);
              } else if (c.type === "set_clip") {
                const patch = c.patch as Record<string, unknown>;
                if (
                  Object.keys(patch).some(
                    (key) =>
                      ![
                        "sourceIn",
                        "speed",
                        "cameraId",
                        "label",
                        "position",
                        "scale",
                        "opacity",
                      ].includes(key),
                  )
                )
                  throw new Error("Unknown clip property");
                clips[index] = CompositionClipSchema.parse({
                  ...clip,
                  ...patch,
                  ...(patch.cameraId === null ? { cameraId: undefined } : {}),
                });
              } else {
                const key = String(c.key),
                  source = dependencies[clip.compositionId];
                if (!source.exposedParameters?.includes(key))
                  throw new Error("Control is not exposed");
                if (c.reset) {
                  delete clip.overrides[key];
                  delete clip.bindings[key];
                } else if (c.expose) {
                  const name = clip.id + "-" + key;
                  doc.parameters[name] = withParameterValue(
                    source.parameters[key],
                    clip.overrides[key] ?? source.parameters[key].value,
                  );
                  doc.exposedParameters = [
                    ...new Set([...(doc.exposedParameters ?? []), name]),
                  ];
                  clip.bindings[key] = name;
                  delete clip.overrides[key];
                } else {
                  clip.overrides[key] = withParameterValue(
                    source.parameters[key],
                    c.value,
                  ).value;
                  delete clip.bindings[key];
                }
              }
            }
            validateCompositionGraph(doc.id, {
              ...dependencies,
              [doc.id]: doc,
            });
          },
          c.revision as string | undefined,
          actor,
        );
      }
      case "set_track":
        return s.edit(
          (doc) => {
            const index = doc.tracks.findIndex((track) => track.id === c.id);
            if (index < 0) throw new Error("Unknown track");
            const track = doc.tracks[index];
            const base = c.base as { start: number; end: number } | undefined;
            if (base && (base.start !== track.start || base.end !== track.end))
              throw new Error(
                "Track changed while dragging. Try again from its current timing.",
              );
            doc.tracks = retimeTracks(
              doc.tracks,
              track.id,
              c.timing as { start: number; end: number },
              doc.duration,
            );
          },
          c.revision as string | undefined,
          actor,
        );
      case "set_camera":
        return s.edit(
          (doc) => {
            if (!c.cameraId || c.cameraId === "main")
              doc.camera = withCameraPatch(doc.camera, c.patch);
            else {
              const camera = doc.cameras?.find(
                (camera) => camera.id === c.cameraId,
              );
              if (!camera) throw new Error("Unknown camera");
              camera.settings = withCameraPatch(camera.settings, c.patch);
            }
          },
          c.revision as string | undefined,
          actor,
        );
      case "set_parameter":
        return s.edit(
          (doc) => {
            const p = doc.parameters[String(c.key)];
            if (!p) throw new Error("Unknown parameter");
            doc.parameters[String(c.key)] = withParameterValue(p, c.value);
          },
          c.revision as string | undefined,
          actor,
        );
      case "set_setting":
        return s.edit(
          (doc) => {
            if (c.key === "name") doc.name = String(c.value);
            else if (c.key === "background") doc.background = String(c.value);
            else if (c.key === "fps") doc.fps = Number(c.value);
            else if (c.key === "size") doc.size = c.value as typeof doc.size;
            else if (c.key === "width" || c.key === "height")
              doc.size[c.key] = Number(c.value);
            else if (c.key === "density")
              doc.capture = { density: c.value as "auto" | number };
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
          c.revision as string | undefined,
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
        return s.history(c.type, c.revision as string | undefined);
      case "edit_begin":
        if (c.kind !== "gesture" && !c.revision)
          throw new Error(
            "Expected revision required. Read state before beginning an edit.",
          );
        return s.begin(
          String(c.label || "Agent edit"),
          actor,
          c.revision as string | undefined,
          c.kind === "gesture" ? "gesture" : "agent",
          Array.isArray(c.paths) ? c.paths.map(String) : undefined,
        );
      case "edit_apply":
        return s.apply(String(c.id), actor);
      case "edit_cancel":
        return s.cancel(String(c.id), actor);
      case "open": {
        const target = await getStore(String(c.id));
        const viewer = views.select(viewId);
        await views.request(viewer.viewId, {
          type: "open",
          sceneId: target.id,
        });
        return state({ ...c, sceneId: target.id });
      }
      case "create": {
        const created = await catalog.create(String(c.name || "Untitled"));
        http.broadcast("change", {});
        return views.snapshot(viewId).active?.connected
          ? command({
              type: "open",
              id: created.id,
              viewId,
              actorId: c.actorId,
            })
          : state({ sceneId: created.id, type: "state" });
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
          c.hash as string | null,
          actor,
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
        for (const spec of document.sources)
          await validatePackagedSource(spec, s.directory);
        const directory = await s.previewDirectory();
        const graph = await documents(s.id);
        const dependencies = [];
        for (const id of Object.keys(graph).filter((id) => id !== s.id)) {
          const store = await getStore(id);
          await store.sync();
          if (store.error) throw new Error(store.error);
          if (store.journal.group)
            throw new Error(
              "Finish the open edit in " +
                store.scene.name +
                " before rendering",
            );
          const scene = structuredClone(store.scene),
            directory = await store.previewDirectory();
          dependencies.push({
            scene,
            directory,
            module: await compileScene(root, directory, scene),
          });
        }
        validateCompositionGraph(
          document.id,
          Object.fromEntries([
            [document.id, document],
            ...dependencies.map((d) => [d.scene.id, d.scene]),
          ]),
        );
        return jobs.submit(
          document,
          directory,
          () => compileScene(root, directory, document),
          String(c.requestId || randomUUID()),
          dependencies,
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
  const publicOrigin = process.env.PORTLESS_URL;
  if (publicOrigin) {
    port = Number(process.env.PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      throw new Error("Portless must supply a valid PORT");
  }
  http = await serve({
    port,
    strictPort: Boolean(publicOrigin),
    publicOrigin,
    ui: path.join(runtime, "ui"),
    scene: () => path.join(root, "scenes", defaultId),
    modules: path.join(root, ".tilt", "modules"),
    token,
    command,
    agentContext: (filter) => views.snapshot(filter.viewId, filter.sceneId),
    onDisconnect: (id) => {
      void views.disconnect(id);
      for (const store of stores.values())
        void store
          .then((s) => s.finishGesture(id))
          .catch((error) =>
            console.error("Could not finish viewer gesture", error),
          );
    },
  });
  views.on("request", (id, request) => http.send(id, "request", request));
  views.on("context", () => http.notifyAgents());
  await fs.mkdir(path.join(root, ".tilt"), { recursive: true });
  await fs.chmod(path.join(root, ".tilt"), 0o700);
  const sessionFile = path.join(root, ".tilt", "session.json");
  await atomicWrite(
    sessionFile,
    JSON.stringify({
      origin: http.origin,
      publicOrigin: http.publicOrigin,
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
      backgroundColor: nativeTheme.shouldUseDarkColors ? "#141414" : "#ffffff",
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        backgroundThrottling: false,
      },
    });
    desktop.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    const window = desktop;
    const updateBackground = () => {
      if (!window.isDestroyed())
        window.setBackgroundColor(
          nativeTheme.shouldUseDarkColors ? "#141414" : "#ffffff",
        );
    };
    nativeTheme.on("updated", updateBackground);
    window.once("closed", () => nativeTheme.off("updated", updateBackground));
    desktop.webContents.on("will-navigate", (event, url) => {
      if (!projectOrigins.has(new URL(url).origin)) event.preventDefault();
    });
    await desktop.loadURL(http.publicOrigin + "/?desktop=1");
    desktop.on("closed", () => {
      desktop = undefined;
      app.dock?.hide();
    });
  }
  async function stop() {
    if (stopping) return;
    stopping = true;
    await reviews.dispose();
    http.close();
    await views.close();
    for (const p of stores.values()) (await p).watcher?.close();
    for (const s of sessions.values()) await s.dispose();
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
  console.log(`Tilt is running at ${http.publicOrigin}`);
  return { origin: http.publicOrigin, stop, command };
}
