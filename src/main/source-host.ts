import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import {
  SourceServerSchema,
  type SourceServer,
  type SourceSpec,
} from "../core/schema";
import { safePath } from "./files";

async function availablePort() {
  const server = net.createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = (server.address() as net.AddressInfo).port;
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

/** Avoid inheriting NODE_OPTIONS, application secrets, or a user's shell config. */
export function sourceEnvironment(
  port: number,
  environment: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  const result: NodeJS.ProcessEnv = {
    PATH: environment.PATH ?? "/usr/bin:/bin",
    LANG: "C.UTF-8",
    TZ: "UTC",
    NODE_ENV: "production",
    HOST: "127.0.0.1",
    PORT: String(port),
    ELECTRON_RUN_AS_NODE: "1",
  };
  if (environment.SystemRoot) result.SystemRoot = environment.SystemRoot;
  return result;
}

async function validateTree(directory: string, packaged: boolean) {
  for (const item of await fs.readdir(directory, { withFileTypes: true })) {
    if (item.isSymbolicLink())
      throw new Error(
        `Managed source inputs must be local files, not symlinks: ${item.name}`,
      );
    if (packaged && (item.name.startsWith(".") || item.name === "node_modules"))
      throw new Error(
        `Packaged source contains ${item.name}, which is excluded from scene snapshots. Bundle dependencies into visible local files.`,
      );
    if (item.isDirectory())
      await validateTree(path.join(directory, item.name), packaged);
    else if (!item.isFile())
      throw new Error(`Unsupported managed source input: ${item.name}`);
  }
}

/** Called before freezing, against the original scene rather than a filtered copy. */
export async function validatePackagedSource(
  spec: SourceSpec,
  directory: string,
) {
  if (spec.url)
    throw new Error(
      "A live URL cannot be frozen reliably. Use a local entry or packaged server.",
    );
  if (!spec.server) return;
  const server = SourceServerSchema.parse(spec.server);
  if (server.export !== "packaged")
    throw new Error(
      `Source ${spec.id} needs server.export: 'packaged' and a self-contained local fixture bundle before export.`,
    );
  if (server.executable !== "node")
    throw new Error(
      `Packaged source ${spec.id} must use the bundled Node runtime with executable: 'node'.`,
    );
  const cwd = await safePath(directory, server.cwd);
  if (!(await fs.stat(cwd)).isDirectory())
    throw new Error("Managed source cwd must be a directory");
  const entry = server.args[0];
  if (!entry || entry.startsWith("-") || !/\.(?:mjs|cjs|js)$/.test(entry))
    throw new Error(
      `Packaged source ${spec.id} needs a relative local JavaScript entry as its first argument.`,
    );
  const file = await safePath(cwd, entry);
  if (!(await fs.stat(file)).isFile())
    throw new Error("Packaged server entry must be a file");
  await validateTree(cwd, true);
}

function probe(url: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const request = http.get(url, { timeout: timeoutMs }, (response) => {
      const ready = response.statusCode! >= 200 && response.statusCode! < 300;
      response.destroy();
      resolve(ready);
    });
    request.once("timeout", () => request.destroy());
    request.once("error", () => resolve(false));
  });
}

/** Owns one process group and its writable copy of an immutable scene input. */
export class ManagedSourceHost {
  private child?: ChildProcess;
  private temporary?: string;
  private failure?: Error;
  private stopped = false;
  private stopping?: Promise<void>;
  private launching?: Promise<string>;
  private onParentExit = () => this.signal("SIGKILL");
  url = "";
  get pid() {
    return this.child?.pid;
  }

  constructor(
    private server: SourceServer,
    private directory: string,
  ) {}

  async start(timeoutMs = 30000) {
    if (this.launching || this.stopped)
      throw new Error("Managed source host can only be started once");
    this.launching = this.launch(timeoutMs);
    try {
      return await this.launching;
    } catch (error) {
      await this.dispose();
      throw error;
    }
  }
  private async launch(timeoutMs: number) {
    const end = performance.now() + timeoutMs;
    const server = SourceServerSchema.parse(this.server);
    const cwd = await safePath(this.directory, server.cwd);
    if (!(await fs.stat(cwd)).isDirectory())
      throw new Error("Managed source cwd must be a directory");
    await validateTree(cwd, false);
    // Framework caches and server writes cannot mutate the journal/export snapshot.
    this.temporary = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-source-"));
    const work = path.join(this.temporary, "app");
    await fs.cp(cwd, work, { recursive: true });
    const executable =
      server.executable === "node"
        ? process.execPath
        : server.executable.includes("/")
          ? await safePath(work, server.executable)
          : server.executable;
    const port = await availablePort();
    this.assertRunning();
    this.url = server.url.replace("{port}", String(port));
    this.child = spawn(
      executable,
      server.args.map((arg) => arg.replaceAll("{port}", String(port))),
      {
        cwd: work,
        env: sourceEnvironment(port),
        shell: false,
        detached: process.platform !== "win32",
        stdio: "ignore",
      },
    );
    this.child.once("error", (error) => {
      this.failure = new Error(
        `Managed source could not start: ${error.message}`,
      );
    });
    this.child.once("exit", (code, signal) => {
      if (!this.stopped)
        this.failure = new Error(
          `Managed source exited before it was disposed (${signal ?? `code ${code}`})`,
        );
    });
    process.once("exit", this.onParentExit);
    while (!this.stopped) {
      this.assertRunning();
      const remaining = end - performance.now();
      if (remaining <= 0)
        throw new Error(
          `Managed source readiness timed out after ${timeoutMs} ms`,
        );
      const ready = await probe(this.url, Math.min(500, remaining));
      this.assertRunning();
      if (ready) return this.url;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(50, Math.max(1, end - performance.now()))),
      );
    }
    throw new Error("Managed source was disposed during startup");
  }

  assertRunning() {
    if (this.failure) throw this.failure;
    if (this.stopped) throw new Error("Managed source has been disposed");
  }

  private signal(signal: NodeJS.Signals) {
    if (!this.child?.pid) return;
    try {
      if (process.platform === "win32") this.child.kill(signal);
      else process.kill(-this.child.pid, signal);
    } catch (error: any) {
      if (error.code !== "ESRCH") throw error;
    }
  }

  dispose(): Promise<void> {
    if (this.stopping) return this.stopping;
    this.stopped = true;
    process.removeListener("exit", this.onParentExit);
    this.signal("SIGTERM");
    this.stopping = (async () => {
      await this.launching?.catch(() => {});
      if (this.child?.pid) {
        this.signal("SIGTERM");
        // Kill the group even if its leader exited: framework launchers may leave children.
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
        this.signal("SIGKILL");
      }
      if (this.temporary)
        await fs.rm(this.temporary, { recursive: true, force: true });
    })();
    return this.stopping;
  }
}
