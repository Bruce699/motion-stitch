import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ProjectLibrary } from "../src/main/projects";
import { SceneStore } from "../src/main/store";

test("project library preserves folder identity across aliases and independent runtimes", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-projects-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const library = new ProjectLibrary(path.join(root, "library"));
  const one = await library.create(path.join(root, "First project"));
  const two = await new ProjectLibrary(library.directory).create(
    path.join(root, "Second project"),
  );
  await fs.symlink(one.path, path.join(root, "alias"));
  assert.equal((await library.open(path.join(root, "alias"))).id, one.id);
  assert.equal((await library.list()).length, 2);
  assert.equal(
    (await new SceneStore(two.path).list())[0].name,
    "Composition 1",
  );
  await fs.writeFile(path.join(one.path, "keep.txt"), "source files stay put");
  assert.match(await fs.readFile(path.join(one.path, "AGENTS.md"), "utf8"), /motion-design/);
  await fs.writeFile(path.join(one.path, "AGENTS.md"), "Project-specific instructions");
  await library.open(one.path);
  assert.equal(await fs.readFile(path.join(one.path, "AGENTS.md"), "utf8"), "Project-specific instructions");
  await assert.rejects(library.create(one.path), /EEXIST/);
  assert.equal(
    await fs.readFile(path.join(one.path, "keep.txt"), "utf8"),
    "source files stay put",
  );
  await fs.rename(two.path, path.join(root, "moved"));
  assert.equal(
    (await library.list()).find((p) => p.id === two.id)?.available,
    false,
  );
  await assert.rejects(library.get(two.id), /unavailable/);
  await assert.rejects(library.open(root), /no Tilt compositions/);
  await assert.rejects(library.get("../unknown"), /unavailable/);
});
