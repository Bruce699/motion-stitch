import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Jobs } from "../src/main/jobs";
import { atomicWrite } from "../src/main/files";
test("export freezes a history snapshot inside a hidden runtime directory", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-export-"));
  try {
    const scene = JSON.parse(
      await fs.readFile(
        new URL("../scenes/interface/scene.json", import.meta.url),
        "utf8",
      ),
    );
    const dir = path.join(root, ".tilt", "history", "previews", "revision");
    scene.size = { width: 3840, height: 2160 };
    scene.capture = { density: 4 };
    await atomicWrite(path.join(dir, "scene.json"), JSON.stringify(scene));
    await atomicWrite(
      path.join(dir, "source", "index.html"),
      "<html>Fixture</html>",
    );
    await atomicWrite(path.join(dir, ".complete"), "ready");
    const runtime = path.join(root, "dist");
    await atomicWrite(path.join(runtime, "main.cjs"), "// runtime");
    const module = path.join(root, "scene.js");
    await atomicWrite(module, "// scene");
    const jobs = new Jobs(root, runtime, "unused", "test");
    jobs.startCoordinator = async () => {};
    const result = await jobs.submit(scene, dir, async () => module, "one");
    assert.equal(result.phase, "queued");
    const frozen = path.join(jobs.directory, result.id, "scene");
    const frozenScene = JSON.parse(
      await fs.readFile(path.join(frozen, "scene.json"), "utf8"),
    );
    assert.deepEqual(frozenScene.capture, { density: 4 });
    assert.deepEqual(frozenScene.size, { width: 3840, height: 2160 });
    assert.equal(
      await fs.readFile(path.join(frozen, "source", "index.html"), "utf8"),
      "<html>Fixture</html>",
    );
    await assert.rejects(fs.access(path.join(frozen, ".complete")));
    assert.equal(
      (await jobs.submit(scene, dir, async () => module, "one")).id,
      result.id,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
