import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { Jobs } from "./jobs";
import { alive } from "./files";

export const project = path.resolve(process.env.TILT_PROJECT || process.cwd());
export const actorId =
  process.env.TILT_ACTOR ||
  (process.env.CODEX_THREAD_ID
    ? "codex:" + process.env.CODEX_THREAD_ID
    : "cli:" + process.ppid);
export type Connection = { origin: string; token: string; remote: boolean };
export type ClientOptions = {
  project: string;
  url?: string;
  token?: string;
  actorId?: string;
  viewId?: string;
  sceneId?: string;
};
export function endpointURL(value: string, remote: boolean) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("TILT_URL must be a valid workspace URL");
  }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) ||
    (!remote && !loopback)
  )
    throw new Error(
      "Workspace URL must use HTTPS (HTTP is allowed on loopback), without embedded credentials, query or fragment",
    );
  return url.href.replace(/\/$/, "");
}

/** A remote target never falls back to local files or jobs. */
export class TiltClient {
  constructor(readonly options: ClientOptions) {}
  async connection(): Promise<Connection> {
    if (this.options.url) {
      const origin = endpointURL(this.options.url, true);
      if (!this.options.token)
        throw new Error(
          "Missing TILT_TOKEN for the configured remote workspace. Inject its scoped credential at runtime.",
        );
      return { origin, token: this.options.token, remote: true };
    }
    let session: { origin: string; token: string; pid: number };
    try {
      session = JSON.parse(
        await fs.readFile(
          path.join(this.options.project, ".tilt", "session.json"),
          "utf8",
        ),
      );
    } catch {
      throw new Error(
        "Start Tilt in this project first (npm start), or configure TILT_URL and TILT_TOKEN.",
      );
    }
    if (!alive(session.pid))
      throw new Error(
        "The local Tilt runtime is stopped. Start it with npm start.",
      );
    if (typeof session.token !== "string" || !session.token)
      throw new Error("Invalid local runtime credential; restart Tilt");
    return {
      origin: endpointURL(session.origin, false),
      token: session.token,
      remote: false,
    };
  }
  target(command: Record<string, unknown>) {
    return {
      ...(this.options.actorId ? { actorId: this.options.actorId } : {}),
      ...(this.options.viewId ? { viewId: this.options.viewId } : {}),
      ...(this.options.sceneId ? { sceneId: this.options.sceneId } : {}),
      ...command,
    };
  }
  async request(command: Record<string, unknown>) {
    let connection: Connection;
    try {
      connection = await this.connection();
    } catch (error) {
      if (
        this.options.url ||
        !["jobs", "cancel", "resume"].includes(String(command.type))
      )
        throw error;
      return this.offlineJob(command);
    }
    if (
      connection.remote &&
      ["desktop", "shutdown", "reveal", "reveal_job"].includes(
        String(command.type),
      )
    )
      throw new Error("This operation requires a local Tilt runtime");
    const response = await fetch(connection.origin + "/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + connection.token,
      },
      body: JSON.stringify(this.target(command)),
      redirect: "error",
      signal: AbortSignal.timeout(180000),
    });
    const result = (await response.json()) as any;
    if (!response.ok || result?.error)
      throw new Error(
        result?.error || "Tilt request failed (" + response.status + ")",
      );
    return result;
  }
  async snapshot() {
    if (this.options.url || this.options.viewId || this.options.sceneId)
      return this.request({ type: "context" });
    const snapshot = JSON.parse(
      await fs.readFile(
        path.join(this.options.project, ".tilt", "context.json"),
        "utf8",
      ),
    );
    if (
      snapshot.active &&
      Date.now() - Date.parse(snapshot.active.updatedAt) > 7000
    )
      snapshot.active.connected = false;
    for (const view of snapshot.views || [])
      if (Date.now() - Date.parse(view.updatedAt) > 7000)
        view.connected = false;
    return snapshot;
  }
  async *watch(
    filter: { viewId?: string; sceneId?: string } = {},
    signal?: AbortSignal,
  ): AsyncGenerator<{ event: string; data: any }> {
    let retry = 250;
    let connectedOnce = false;
    while (!signal?.aborted) {
      let connection: Connection;
      try {
        connection = await this.connection();
      } catch (error) {
        if (!connectedOnce) throw error;
        yield {
          event: "connection",
          data: { connected: false, retrying: true },
        };
        await delay(retry, undefined, { signal }).catch(() => {});
        retry = Math.min(retry * 2, 5000);
        continue;
      }
      const url = new URL(connection.origin + "/agent-events");
      const target = this.target(filter);
      if (target.viewId) url.searchParams.set("viewId", String(target.viewId));
      if (target.sceneId)
        url.searchParams.set("sceneId", String(target.sceneId));
      let response: Response;
      try {
        response = await fetch(url, {
          headers: {
            Authorization: "Bearer " + connection.token,
            Accept: "text/event-stream",
          },
          redirect: "error",
          signal,
        });
      } catch (error) {
        if (signal?.aborted) return;
        yield {
          event: "connection",
          data: { connected: false, retrying: true },
        };
        await delay(retry, undefined, { signal }).catch(() => {});
        retry = Math.min(retry * 2, 5000);
        continue;
      }
      if (!response.ok) {
        const result = (await response.json()) as any;
        throw new Error(
          result?.error || "Tilt watch failed (" + response.status + ")",
        );
      }
      if (
        !response.body ||
        !response.headers.get("content-type")?.includes("text/event-stream")
      )
        throw new Error("Expected a Tilt event stream");
      connectedOnce = true;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (!signal?.aborted) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder
            .decode(value, { stream: true })
            .replace(/\r\n/g, "\n");
          if (buffer.length > 4 * 1024 * 1024)
            throw new Error("Tilt event exceeds context limit");
          let end: number;
          while ((end = buffer.indexOf("\n\n")) >= 0) {
            const block = buffer.slice(0, end);
            buffer = buffer.slice(end + 2);
            const lines = block.split("\n");
            const data = lines
              .filter((line) => line.startsWith("data:"))
              .map((line) => line.slice(5).trimStart())
              .join("\n");
            if (!data) continue;
            const event =
              lines
                .find((line) => line.startsWith("event:"))
                ?.slice(6)
                .trim() || "message";
            retry = 250;
            yield { event, data: JSON.parse(data) };
            if (event === "error") return;
          }
        }
      } catch (error) {
        if (signal?.aborted) return;
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
      if (!signal?.aborted) {
        yield {
          event: "connection",
          data: { connected: false, retrying: true },
        };
        await delay(retry, undefined, { signal }).catch(() => {});
        retry = Math.min(retry * 2, 5000);
      }
    }
  }
  private async offlineJob(command: Record<string, unknown>) {
    const electronRoot = path.join(
      this.options.project,
      "node_modules",
      "electron",
    );
    const version = JSON.parse(
      await fs.readFile(path.join(electronRoot, "package.json"), "utf8"),
    ).version;
    const binary = path.join(
      electronRoot,
      "dist",
      process.platform === "darwin"
        ? "Electron.app/Contents/MacOS/Electron"
        : process.platform === "win32"
          ? "electron.exe"
          : "electron",
    );
    const jobs = new Jobs(
      this.options.project,
      path.join(this.options.project, "dist"),
      binary,
      version,
    );
    if (command.type === "jobs") return jobs.list();
    if (command.type === "cancel") return jobs.cancel(String(command.id));
    return jobs.resume(String(command.id));
  }
}
export const client = new TiltClient({
  project,
  actorId,
  url: process.env.TILT_URL,
  token: process.env.TILT_TOKEN,
  viewId: process.env.TILT_VIEW,
  sceneId: process.env.TILT_SCENE,
});
export const request = (command: Record<string, unknown>) =>
  client.request(command);
