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

export class ViewRegistry extends EventEmitter {
  views = new Map<string, ViewContext>();
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
  constructor(public root: string) {
    super();
  }
  async init() {
    await fs.mkdir(path.join(this.root, ".tilt", "views"), { recursive: true });
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
    this.views.set(id, v);
    if (!this.activeId || !this.get()?.connected || interaction)
      this.activeId = id;
    await this.persist();
    return v;
  }
  async disconnect(id: string) {
    const v = this.views.get(id);
    if (v) {
      v.connected = false;
      await this.persist();
    }
  }
  private persist() {
    const values = [...this.views.values()].map((v) => ({ ...v }));
    const activeId = this.activeId;
    const next = this.writers.then(async () => {
      for (const v of values)
        await atomicWrite(
          path.join(this.root, ".tilt", "views", `${v.viewId}.json`),
          JSON.stringify(v, null, 2) + "\n",
        );
      const active = values.find((v) => v.viewId === activeId);
      await atomicWrite(
        path.join(this.root, ".tilt", "context.json"),
        JSON.stringify(
          {
            version: 1,
            runtime: this.running ? "running" : "stopped",
            activeViewId: activeId,
            active: active || null,
            views: values.map((v) => ({
              viewId: v.viewId,
              name: v.name,
              sceneId: v.sceneId,
              connected: v.connected,
              updatedAt: v.updatedAt,
            })),
          },
          null,
          2,
        ) + "\n",
      );
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
