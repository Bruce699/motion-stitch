import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { atomicWrite, readJSON } from "./files";
import {
  ViewStateSchema,
  type ViewContext,
  type ViewRequest,
} from "../core/context";

export type SceneObservation = {
  sceneId: string;
  name: string;
  duration: number;
  fps: number;
  revision: string;
  codeRevision: number;
  error: string | null;
  pendingEdit: {
    id: string;
    actor: string;
    label: string;
    base: string;
    kind: string;
    paths?: string[];
    startedAt: string;
  } | null;
};

export class ViewRegistry extends EventEmitter {
  views = new Map<string, ViewContext>();
  private scenes = new Map<string, SceneObservation>();
  activeId: string | null = null;
  private writers: Promise<unknown> = Promise.resolve();
  private pending = new Map<
    string,
    {
      viewId: string;
      resolve: (value: any) => void;
      reject: (error: Error) => void;
      timer: NodeJS.Timeout;
    }
  >();
  private sweep?: NodeJS.Timeout;
  private running = true;
  readonly runtimeId = randomUUID();
  workspaceId = "";
  private sequence = 0;
  constructor(public root: string) {
    super();
  }
  async init() {
    await fs.mkdir(path.join(this.root, ".tilt", "views"), { recursive: true });
    const workspaceFile = path.join(this.root, ".tilt", "workspace.json");
    try {
      const value = await readJSON<{ id: string }>(workspaceFile);
      this.workspaceId = this.id(value.id);
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error;
      this.workspaceId = randomUUID();
      await atomicWrite(
        workspaceFile,
        JSON.stringify({ version: 1, id: this.workspaceId }),
      );
    }
    for (const file of await fs.readdir(
      path.join(this.root, ".tilt", "views"),
    )) {
      if (!file.endsWith(".json")) continue;
      try {
        const v = await readJSON<ViewContext>(
          path.join(this.root, ".tilt", "views", file),
        );
        v.connected = false;
        this.views.set(v.viewId, v);
      } catch {}
    }
    await this.persist();
    this.sweep = setInterval(() => {
      let changed = false;
      for (const v of this.views.values())
        if (v.connected && Date.now() - Date.parse(v.updatedAt) > 7000) {
          v.connected = false;
          changed = true;
        }
      if (changed) void this.persist();
    }, 2000);
  }
  id(value: unknown) {
    if (typeof value !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(value))
      throw new Error("A valid viewer ID is required");
    return value;
  }
  get(id?: string) {
    return this.views.get(id || this.activeId || "");
  }
  /** Resolve a scene target without accidentally controlling another scene's tab. */
  target(viewId?: string, sceneId?: string) {
    if (viewId) {
      const view = this.get(viewId);
      if (!view) throw new Error("Unknown viewer: " + viewId);
      if (sceneId && view.sceneId !== sceneId)
        throw new Error("Viewer is showing a different scene");
      return view;
    }
    const active = this.get();
    if (!sceneId || active?.sceneId === sceneId) return active;
    const matches = [...this.views.values()].filter(
      (v) => v.sceneId === sceneId && v.connected,
    );
    if (matches.length > 1)
      throw new Error("Multiple viewers show this scene. Specify --view.");
    return matches[0];
  }
  get cursor() {
    return this.runtimeId + ":" + this.sequence;
  }
  snapshot(viewId?: string, sceneId?: string) {
    const active = this.target(viewId, sceneId);
    return {
      version: 1,
      workspaceId: this.workspaceId,
      runtimeId: this.runtimeId,
      runtime: this.running ? "running" : "stopped",
      cursor: this.cursor,
      observedAt: new Date().toISOString(),
      activeViewId: this.activeId,
      active: active
        ? {
            ...active,
            connected:
              active.connected &&
              Date.now() - Date.parse(active.updatedAt) <= 7000,
          }
        : null,
      scenes: [...this.scenes.values()].filter(
        (s) => !sceneId || s.sceneId === sceneId,
      ),
      views: [...this.views.values()]
        .filter((v) => !sceneId || v.sceneId === sceneId)
        .map((v) => ({
          viewId: v.viewId,
          name: v.name,
          sceneId: v.sceneId,
          connected:
            v.connected && Date.now() - Date.parse(v.updatedAt) <= 7000,
          focused: v.focused,
          visible: v.visible,
          ready: v.ready,
          updatedAt: v.updatedAt,
          lastInteractionAt: v.lastInteractionAt,
        })),
    };
  }
  changed() {
    return this.persist([]);
  }
  observeScene(scene: SceneObservation) {
    if (
      JSON.stringify(this.scenes.get(scene.sceneId)) === JSON.stringify(scene)
    )
      return Promise.resolve();
    this.scenes.set(scene.sceneId, structuredClone(scene));
    return this.changed();
  }
  async waitForChange(
    since: string,
    timeoutMs: number,
    viewId?: string,
    sceneId?: string,
  ) {
    if (since !== this.cursor || !this.running)
      return { changed: true, ...this.snapshot(viewId, sceneId) };
    this.snapshot(viewId, sceneId);
    return new Promise((resolve, reject) => {
      const finish = (changed: boolean) => {
        clearTimeout(timer);
        this.off("context", listener);
        try {
          resolve({ changed, ...this.snapshot(viewId, sceneId) });
        } catch (error) {
          reject(error);
        }
      };
      const listener = () => finish(true);
      const timer = setTimeout(() => finish(false), timeoutMs);
      this.once("context", listener);
    });
  }
  select(id?: string) {
    const v = this.get(id);
    if (!v?.connected || Date.now() - Date.parse(v.updatedAt) > 7000)
      throw new Error(
        "No connected viewer. Open Tilt or specify a connected --view.",
      );
    return v;
  }
  async update(
    id: string,
    input: unknown,
    interaction = false,
    routes?: ViewContext["sourceRoutes"],
  ) {
    this.id(id);
    const state = ViewStateSchema.parse(input);
    const previous = this.views.get(id);
    const now = new Date().toISOString();
    const v: ViewContext = {
      ...state,
      version: 1,
      viewId: id,
      connected: true,
      updatedAt: now,
      lastInteractionAt: interaction ? now : previous?.lastInteractionAt || now,
      sourceRoutes:
        routes || state.sourceRoutes || previous?.sourceRoutes || [],
    };
    const changed =
      !previous ||
      !previous.connected ||
      interaction ||
      JSON.stringify(ViewStateSchema.parse(previous)) !== JSON.stringify(state);
    this.views.set(id, v);
    if (!this.activeId || !this.get()?.connected || interaction)
      this.activeId = id;
    await this.persist([id], changed);
    return v;
  }
  async disconnect(id: string) {
    for (const [requestId, pending] of this.pending) {
      if (pending.viewId !== id) continue;
      clearTimeout(pending.timer);
      pending.reject(
        new Error("Viewer disconnected before acknowledging the request"),
      );
      this.pending.delete(requestId);
    }
    const v = this.views.get(id);
    if (v) {
      v.connected = false;
      await this.persist([id]);
    }
  }
  private persist(changedIds?: string[], notify = true) {
    const next = this.writers.then(async () => {
      const values = [...this.views.values()].map((v) => ({ ...v }));
      if (notify) this.sequence++;
      const snapshot = this.snapshot();
      for (const v of values.filter(
        (v) => !changedIds || changedIds.includes(v.viewId),
      ))
        await atomicWrite(
          path.join(this.root, ".tilt", "views", `${v.viewId}.json`),
          JSON.stringify(v, null, 2) + "\n",
        );
      await atomicWrite(
        path.join(this.root, ".tilt", "context.json"),
        JSON.stringify(snapshot, null, 2) + "\n",
      );
      if (notify) this.emit("context", this.cursor);
    });
    this.writers = next.catch(() => {});
    return next;
  }
  request(viewId: string | undefined, request: Omit<ViewRequest, "id">) {
    const v = this.select(viewId);
    const id = randomUUID();
    return new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("Viewer did not acknowledge the request"));
      }, 20000);
      this.pending.set(id, { viewId: v.viewId, resolve, reject, timer });
      this.emit("request", v.viewId, { ...request, id });
    });
  }
  acknowledge(viewId: string, id: string, result: unknown, error?: string) {
    const p = this.pending.get(id);
    if (!p || p.viewId !== viewId) throw new Error("Unknown viewer request");
    clearTimeout(p.timer);
    this.pending.delete(id);
    error ? p.reject(new Error(error)) : p.resolve(result);
    return {};
  }
  async close() {
    this.running = false;
    clearInterval(this.sweep);
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error("Runtime stopped"));
    }
    this.pending.clear();
    for (const v of this.views.values()) v.connected = false;
    await this.persist();
  }
}
