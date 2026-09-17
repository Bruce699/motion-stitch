import { app, nativeImage } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { Reviews } from "../src/main/review";
import { SceneStore } from "../src/main/store";
import { SceneSchema } from "../src/core/schema";
import { ReviewRequestSchema } from "../src/core/review";
const out = path.resolve(".tilt/checks/review");
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function main() {
  app.setPath("userData", path.join(out, "electron"));
  app.dock?.hide();
  await app.whenReady();
  const root = await fs.mkdtemp(path.join(out, "project-"));
  await fs.symlink(
    path.resolve("node_modules"),
    path.join(root, "node_modules"),
  );
  const dir = path.join(root, "scenes", "fixture");
  await fs.mkdir(path.join(dir, "source"), { recursive: true });
  const html = (color: string) =>
    `<!doctype html><style>body{margin:0;background:#ddd;font:24px sans-serif}main{position:absolute;left:60px;top:60px;background:${color};width:180px;height:100px;padding:12px}</style><main data-tilt-id="card">Review 1401</main><script>window.tiltSource={ready:()=>document.fonts.ready,sample:()=>({revision:1})}</script>`;
  await fs.writeFile(path.join(dir, "source/index.html"), html("#d6edfb"));
  await fs.writeFile(
    path.join(dir, "scene.ts"),
    `export default({world,camera,createLayeredSource})=>{const ui=createLayeredSource('ui',{width:4});world.add(ui.group);camera.position.z=5;return {sample({time}){ui.get('card').object.position.x=time*.1;ui.get('card').object.position.z=.15;}};}`,
  );
  const doc = SceneSchema.parse({
    version: 1,
    id: "fixture",
    name: "Review fixture",
    duration: 2,
    fps: 30,
    size: { width: 640, height: 360 },
    background: "#101010",
    entry: "scene.ts",
    camera: {
      projection: "perspective",
      depthOfField: { enabled: true, focusPlane: 0.15, blur: 0.2 },
    },
    capture: { density: 2 },
    sources: [
      {
        id: "ui",
        kind: "web",
        entry: "source/index.html",
        width: 400,
        height: 300,
        sampling: "static",
        layers: [{ id: "card", selector: '[data-tilt-id="card"]' }],
      },
    ],
    parameters: {},
    tracks: [],
  });
  await fs.writeFile(path.join(dir, "scene.json"), JSON.stringify(doc));
  const store = new SceneStore(root);
  await store.open("fixture");
  const stores = new Map([["fixture", store]]);
  const reviews = new Reviews(root, path.resolve("dist"), async (id) => {
    assert.ok(stores.has(id));
    return stores.get(id)!;
  });
  try {
    const request = (x: object) =>
      reviews.review("fixture", ReviewRequestSchema.parse(x));
    const first = await request({
      times: [0, 1],
      focus: ["ui/card"],
      includeImages: true,
    });
    assert.equal(first.inlineImages?.length, 3);
    assert.equal(first.frames.length, 2);
    assert.deepEqual(
      nativeImage.createFromPath(first.frames[0].path).getSize(),
      { width: 640, height: 360 },
    );
    const pixel = async (file: string) =>
      nativeImage.createFromBuffer(await fs.readFile(file)).toBitmap();
    const warm = await request({ times: [1.8, 0, 1, 1.5], focus: ["ui/card"] });
    assert.deepEqual(
      await pixel(first.frames[1].path),
      await pixel(warm.frames[2].path),
    );
    await assert.rejects(
      request({ revision: "stale", times: [0] }),
      /revision changed/,
    );
    await assert.rejects(request({ focus: ["ui/missing"] }), /Unknown focus/);
    await fs.writeFile(path.join(dir, "source/index.html"), html("#fbe3ba"));
    await store.sync();
    const changed = await request({
      compareTo: first.id,
      times: [0, 1.5],
      focus: ["ui/card"],
      motion: { start: 0, end: 0.2, fps: 30 },
    });
    assert.notDeepEqual(
      await pixel(first.frames[0].path),
      await pixel(changed.frames[0].path),
    );
    assert.deepEqual(
      await pixel(path.join(root, ".tilt/reviews", changed.id, "before-1.png")),
      await pixel(warm.frames[3].path),
    );
    const unchanged = await reviews.status(first.id, true);
    assert.equal(unchanged.revision, first.revision);
    const end = Date.now() + 30000;
    let motion = await reviews.status(changed.id);
    while (motion.motion?.phase !== "complete" && Date.now() < end) {
      assert.notEqual(motion.motion?.phase, "failed", motion.motion?.error);
      await pause(100);
      motion = await reviews.status(changed.id);
    }
    assert.equal(motion.motion?.phase, "complete");
    const probe = JSON.parse(
      execFileSync(
        "ffprobe",
        [
          "-v",
          "error",
          "-show_entries",
          "stream=width,height,nb_frames",
          "-of",
          "json",
          motion.motion!.path!,
        ],
        { encoding: "utf8" },
      ),
    );
    assert.equal(probe.streams[0].nb_frames, "6");
    assert.equal(motion.motion!.renderedFrames, 6);
    const strip = await reviews.status(changed.id, true, [
      motion.motion!.artifactIndex!,
    ]);
    assert.equal(strip.inlineImages!.length, 1);
    assert.deepEqual(strip.inlineArtifactIndices, [
      motion.motion!.artifactIndex!,
    ]);
    await assert.rejects(
      reviews.status(changed.id, true, [999]),
      /Unknown review artifact/,
    );
    const group = await store.begin("Open group", "verify", store.revision);
    await assert.rejects(request({ times: [0] }), /open edit/);
    await store.cancel(group.id, "verify");
    const code = await fs.readFile(path.join(dir, "scene.ts"), "utf8");
    await fs.writeFile(
      path.join(dir, "scene.ts"),
      'export default()=>{throw new Error("intentional review failure")}',
    );
    await store.sync();
    await assert.rejects(request({ times: [0] }), /intentional review failure/);
    await fs.writeFile(path.join(dir, "scene.ts"), code);
    await store.sync();
    const recovered = await request({ times: [0] });
    assert.equal(recovered.frames.length, 1);
    const parentDir = path.join(root, "scenes", "parent");
    await fs.mkdir(parentDir);
    const parentDoc = SceneSchema.parse({
      ...doc,
      id: "parent",
      name: "Nested review",
      sources: [],
      clips: [
        {
          id: "use",
          compositionId: "fixture",
          label: "Fixture",
          start: 0,
          end: 2,
          sourceIn: 0,
        },
      ],
      camera: { projection: "perspective" },
    });
    await fs.writeFile(
      path.join(parentDir, "scene.json"),
      JSON.stringify(parentDoc),
    );
    await fs.writeFile(
      path.join(parentDir, "scene.ts"),
      "export default()=>({sample(){}})",
    );
    const parent = new SceneStore(root);
    await parent.open("parent");
    stores.set("parent", parent);
    const nested = await reviews.review(
      "parent",
      ReviewRequestSchema.parse({ times: [0] }),
    );
    assert.equal(Object.keys(nested.graphRevisions).length, 2);
    await fs.writeFile(path.join(dir, "source/index.html"), html("#c8fbd2"));
    await store.sync();
    const nestedAfter = await reviews.review(
      "parent",
      ReviewRequestSchema.parse({ compareTo: nested.id, times: [0, 1] }),
    );
    assert.equal(nested.revision, nestedAfter.revision);
    assert.notEqual(
      nested.graphRevisions.fixture,
      nestedAfter.graphRevisions.fixture,
    );
    assert.notDeepEqual(
      await pixel(nested.frames[0].path),
      await pixel(nestedAfter.frames[0].path),
    );
    const report = {
      passed: true,
      viewerConnected: false,
      coldMs: first.elapsedMs,
      warmMs: warm.elapsedMs,
      compareMs: changed.elapsedMs,
      motion: motion.motion,
      sourceQuality: first.frames[0].sourceQuality,
      first: first.id,
      changed: changed.id,
      root,
    };
    await fs.writeFile(
      path.join(out, "report.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await reviews.dispose();
    for (const store of stores.values()) store.watcher?.close();
  }
  app.exit(0);
}
main().catch((error) => {
  console.error(error);
  app.exit(1);
});
