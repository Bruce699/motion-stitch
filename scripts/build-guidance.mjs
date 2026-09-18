import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const digest = (text) => createHash("sha256").update(text).digest("hex");
// Product guidance only: never package project files, research media or private notes.
const contracts = [
  "AGENTS.md", "README.md",
  ...["agent-interface", "agent-review", "animation-groups", "architecture", "camera", "compositions", "design-system", "layers", "parameters", "resolution", "source-hosting"].map(name => `docs/${name}.md`),
  ...["runtime", "schema", "parameters", "camera", "compositions", "tracks"].map(name => `src/core/${name}.ts`),
  "src/renderer/vendor/dialkit/UPSTREAM.md",
];

export async function buildGuidance(root, output) {
  const documents = {};
  async function add(relative) {
    const file = path.join(root, relative);
    if (!(await fs.lstat(file)).isFile()) throw new Error(`Guidance must be a regular file: ${relative}`);
    const content = await fs.readFile(file, "utf8");
    documents[relative] = { path: relative, hash: digest(content), content };
  }
  async function walk(relative) {
    for (const entry of (await fs.readdir(path.join(root, relative), { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
      if (entry.isSymbolicLink()) throw new Error(`Guidance symlink is not allowed: ${relative}/${entry.name}`);
      if (entry.isDirectory()) await walk(`${relative}/${entry.name}`);
      else if (entry.name.endsWith(".md") && entry.name !== "EVALUATION.md") await add(`${relative}/${entry.name}`);
    }
  }
  await walk(".agents/skills");
  for (const relative of contracts) await add(relative);
  const skills = Object.values(documents).filter(d => /^\.agents\/skills\/[^/]+\/SKILL\.md$/.test(d.path)).map(d => {
    const header = d.content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const name = header?.[1].match(/^name:\s*(.+)$/m)?.[1].trim();
    let description = header?.[1].match(/^description:\s*(.+)$/m)?.[1].trim();
    if (description?.startsWith('"')) description = JSON.parse(description);
    if (!name || !description || d.path !== `.agents/skills/${name}/SKILL.md`) throw new Error(`Invalid skill metadata: ${d.path}`);
    return { name, description, path: d.path, hash: d.hash,
      files: Object.keys(documents).filter(p => p.startsWith(`.agents/skills/${name}/`)) };
  });
  for (const doc of Object.values(documents)) {
    const candidates = [...doc.content.matchAll(/\]\(([^)]+)\)/g)].map(m => m[1]);
    candidates.push(...[...doc.content.matchAll(/`((?:docs\/|src\/core\/)[^` ]+\.(?:md|ts))`/g)].map(m => m[1]));
    doc.links = [...new Set(candidates.map(link => {
      if (/^[a-z]+:/i.test(link) || link.startsWith("#")) return null;
      const clean = link.split("#")[0];
      const resolved = Object.hasOwn(documents, clean) ? clean : path.posix.normalize(path.posix.join(path.posix.dirname(doc.path), clean));
      return Object.hasOwn(documents, resolved) ? resolved : null;
    }).filter(Boolean))];
  }
  const bundle = { schemaVersion: 1, version: digest(JSON.stringify(documents)), skills, documents };
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(bundle));
  return bundle;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  await buildGuidance(process.cwd(), path.resolve(process.argv[2] || "dist/guidance.json"));
