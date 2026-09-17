import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import type { SourceSpec } from "../core/schema";
import { safePath } from "./files";

/** Hash the entire browser-visible root, including lazy-loaded routes and assets.
 * Do not infer dependencies from HTML or a particular framework's bundle.
 * The caller owns an immutable snapshot and caches this by its revision.
 */
export async function sourceFingerprint(directory: string, spec: SourceSpec) {
  const digest = createHash("sha256").update(JSON.stringify(spec));
  const root = spec.server
    ? await safePath(directory, spec.server.cwd)
    : spec.entry
      ? path.dirname(await safePath(directory, spec.entry))
      : null;
  if (root) {
    async function visit(dir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      entries.sort((a, b) => a.name.localeCompare(b.name));
      for (const entry of entries) {
        const file = path.join(dir, entry.name);
        if (entry.isSymbolicLink())
          throw new Error(`Source snapshot must contain local files: ${file}`);
        if (entry.isDirectory()) {
          digest.update(JSON.stringify(path.relative(root!, file) + path.sep));
          await visit(file);
        } else if (entry.isFile()) {
          // Delimit names and content hashes to avoid ambiguous file boundaries.
          digest.update(JSON.stringify(path.relative(root!, file)));
          digest.update(
            createHash("sha256")
              .update(await fs.readFile(file))
              .digest(),
          );
        }
      }
    }
    await visit(root);
  }
  return digest.digest("hex");
}
