import fs from "node:fs/promises";
import path from "node:path";
import { PlaygroundSchema, type PlaygroundDocument } from "../core/playground";
import { atomicWrite, hash } from "./files";

export const EMPTY_WORKSPACE_REVISION = "missing";

export type ProjectWorkspaceSnapshot = {
  workspace: PlaygroundDocument;
  revision: string;
};

export class ProjectWorkspaceConflictError extends Error {
  constructor(
    readonly expectedRevision: string,
    readonly actualRevision: string,
  ) {
    super(
      "Playground revision conflict. Reload the project before saving your changes.",
    );
    this.name = "ProjectWorkspaceConflictError";
  }
}

// Runtime requests can overlap, including requests through different store
// instances. Serialize their read/compare/write transaction per project file.
const writes = new Map<string, Promise<void>>();

function exclusive<T>(file: string, action: () => Promise<T>): Promise<T> {
  const previous = writes.get(file) ?? Promise.resolve();
  const result = previous.then(action);
  const settled = result.then(
    () => {},
    () => {},
  );
  writes.set(file, settled);
  void settled.then(() => {
    if (writes.get(file) === settled) writes.delete(file);
  });
  return result;
}

async function readDocument(file: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

/** Authored arrangement and connections live beside the project's scene files.
 * Reconcile composition IDs in the caller; reading never rewrites the document.
 * The revision hashes the actual bytes so external file edits invalidate saves.
 */
export class ProjectWorkspaceStore {
  constructor(readonly root: string) {}

  get file() {
    return path.join(path.resolve(this.root), "playground.json");
  }

  async load(): Promise<ProjectWorkspaceSnapshot> {
    const raw = await readDocument(this.file);
    return {
      workspace: PlaygroundSchema.parse(
        raw === null
          ? { version: 1, tiles: [], canvasHeight: 320 }
          : JSON.parse(raw.toString("utf8")),
      ),
      revision: raw === null ? EMPTY_WORKSPACE_REVISION : hash(raw),
    };
  }

  async save(
    value: unknown,
    expectedRevision: string,
  ): Promise<ProjectWorkspaceSnapshot> {
    const workspace = PlaygroundSchema.parse(value);
    const root = await fs.realpath(this.root);
    const file = path.join(root, "playground.json");
    return exclusive(file, async () => {
      const raw = await readDocument(file);
      const revision = raw === null ? EMPTY_WORKSPACE_REVISION : hash(raw);
      if (expectedRevision !== revision)
        throw new ProjectWorkspaceConflictError(expectedRevision, revision);
      const serialized = JSON.stringify(workspace, null, 2) + "\n";
      await atomicWrite(file, serialized);
      return { workspace, revision: hash(serialized) };
    });
  }
}
