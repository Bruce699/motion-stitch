import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { alive, atomicWrite, hash, readJSON } from "./files";
import { SceneStore } from "./store";
import { projectAgentInstructions } from "./guidance";

export type ProjectEntry = {
  id: string;
  name: string;
  path: string;
  openedAt: string;
  available: boolean;
};

/** A folder is the project boundary. One file per folder avoids lost updates
 * when independent project runtimes register themselves concurrently. */
export class ProjectLibrary {
  constructor(readonly directory: string, readonly agentInstructions = projectAgentInstructions()) {}
  async register(folder: string) {
    const root = await fs.realpath(folder);
    const entry = {
      id: hash(root),
      name: path.basename(root),
      path: root,
      openedAt: new Date().toISOString(),
    };
    await atomicWrite(
      path.join(this.directory, entry.id + ".json"),
      JSON.stringify(entry),
    );
    return { ...entry, available: true };
  }
  async list(): Promise<ProjectEntry[]> {
    await fs.mkdir(this.directory, { recursive: true });
    const entries = await Promise.all(
      (await fs.readdir(this.directory))
        .filter((name) => /^[a-f0-9]{64}\.json$/.test(name))
        .map(async (name) => {
          try {
            const entry = await readJSON(path.join(this.directory, name));
            if (
              typeof entry.path !== "string" ||
              !path.isAbsolute(entry.path) ||
              hash(entry.path) + ".json" !== name
            )
              return null;
            const available = await fs.stat(entry.path).then(
              (s) => s.isDirectory(),
              () => false,
            );
            return { ...entry, available } as ProjectEntry;
          } catch {
            return null;
          }
        }),
    );
    return entries
      .filter((entry): entry is ProjectEntry => !!entry)
      .sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  }
  async get(id: string) {
    const entry = (await this.list()).find((entry) => entry.id === id);
    if (!entry || !entry.available)
      throw new Error("Project folder is unavailable. Open its new location.");
    return entry;
  }
  async create(folder: string) {
    if (!path.isAbsolute(folder))
      throw new Error("Choose an absolute project path");
    // Never replace an existing folder or repository.
    await fs.mkdir(folder);
    await new SceneStore(folder).create("Composition 1");
    await fs.writeFile(
      path.join(folder, ".gitignore"),
      ".tilt/\nexports/\nnode_modules/\n",
    );
    await fs.writeFile(path.join(folder, "AGENTS.md"), this.agentInstructions, { flag: "wx" });
    return this.register(folder);
  }
  async open(folder: string) {
    const root = await fs.realpath(folder);
    let scenes;
    try {
      scenes = await new SceneStore(root).list();
    } catch {
      scenes = [];
    }
    if (!scenes.length)
      throw new Error(
        "This folder has no Tilt compositions. Choose a project containing a scenes folder.",
      );
    return this.register(root);
  }
}

export async function projectRuntime(
  root: string,
  runtime: string,
  library: ProjectLibrary,
) {
  const sessionFile = path.join(root, ".tilt", "session.json");
  async function running() {
    try {
      const session = await readJSON(sessionFile);
      if (session.project !== root || !alive(session.pid)) return null;
      const url = new URL(session.origin);
      if (url.protocol !== "http:" || url.hostname !== "127.0.0.1") return null;
      const response = await fetch(url.origin + "/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ type: "state" }),
        signal: AbortSignal.timeout(1500),
      });
      if (!response.ok) return null;
      const state = (await response.json()) as { project?: { path: string } };
      return state.project?.path === root
        ? session.publicOrigin || session.origin
        : null;
    } catch {
      return null;
    }
  }
  const existing = await running();
  if (existing) return existing as string;
  await fs.mkdir(path.join(root, ".tilt"), { recursive: true });
  const log = await fs.open(path.join(root, ".tilt", "runtime.log"), "a");
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "",
    TILT_PROJECTS_DIRECTORY: library.directory,
  };
  delete env.PORTLESS_URL;
  delete env.PORT;
  const child = spawn(
    process.execPath,
    [path.join(runtime, "main.cjs"), "--project", root, "--browser"],
    {
      detached: true,
      stdio: ["ignore", log.fd, log.fd],
      env,
    },
  );
  let failed: Error | undefined;
  child.once("error", (error) => {
    failed = error;
  });
  child.once("exit", (code) => {
    failed = new Error(
      `Project runtime stopped (${code}). See .tilt/runtime.log in the project folder.`,
    );
  });
  child.unref();
  await log.close();
  const until = Date.now() + 30000;
  while (Date.now() < until) {
    if (failed) throw failed;
    const origin = await running();
    if (origin) return origin as string;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("Project is still starting. Try opening it again.");
}
