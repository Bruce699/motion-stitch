import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

export const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
export async function atomicWrite(file: string, data: string | Buffer) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temp, data);
    await fs.rename(temp, file);
  } finally {
    await fs.rm(temp, { force: true });
  }
}
export async function readJSON<T = any>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, "utf8"));
}
export async function safePath(root: string, relative: string, create = false) {
  if (
    !relative ||
    path.isAbsolute(relative) ||
    relative.split(/[\\/]/).some((v) => v === ".." || v.startsWith("."))
  )
    throw new Error(
      "Path must stay inside this scene and cannot name hidden files",
    );
  const base = await fs.realpath(root);
  const full = path.resolve(base, relative);
  let parent = create ? path.dirname(full) : full;
  while (true) {
    try {
      parent = await fs.realpath(parent);
      break;
    } catch (e: any) {
      if (e.code !== "ENOENT" || parent === base) throw e;
      parent = path.dirname(parent);
    }
  }
  if (parent !== base && !parent.startsWith(base + path.sep))
    throw new Error("Symlink escapes the scene");
  try {
    const real = await fs.realpath(full);
    if (!real.startsWith(base + path.sep))
      throw new Error("Symlink escapes the scene");
  } catch (e: any) {
    if (e.code !== "ENOENT") throw e;
  }
  return full;
}
export async function manifest(root: string) {
  const entries: Record<string, string> = {};
  async function walk(dir: string) {
    for (const d of await fs.readdir(dir, { withFileTypes: true })) {
      if (
        d.name.startsWith(".") ||
        d.name === "node_modules" ||
        d.name.endsWith(".tmp")
      )
        continue;
      const file = path.join(dir, d.name);
      if (d.isSymbolicLink())
        throw new Error(`Freeze requires local files, not symlinks: ${d.name}`);
      if (d.isDirectory()) await walk(file);
      else entries[path.relative(root, file)] = hash(await fs.readFile(file));
    }
  }
  await walk(root);
  return Object.fromEntries(
    Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)),
  );
}
export function alive(pid?: number) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
