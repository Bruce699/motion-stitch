import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import electron from "electron";
import { Jobs } from "../src/main/jobs";
import { compileScene } from "../src/main/scene-session";
import { SceneSchema, type RenderJob } from "../src/core/schema";

const runtime = process.env.TILT_EXPORT_RUNTIME!,
  output = process.env.TILT_EXPORT_OUTPUT!;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const hash = (data: Buffer) => createHash("sha256").update(data).digest("hex");
async function decodedHash(file: string) {
  const digest = createHash("sha256");
  const child = spawn(
    "ffmpeg",
    ["-v", "error", "-i", file, "-f", "rawvideo", "-pix_fmt", "rgba", "pipe:1"],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let error = "";
  child.stdout.on("data", (data) => digest.update(data));
  child.stderr.on("data", (data) => (error += data));
  await new Promise<void>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(error)),
    );
  });
  return digest.digest("hex");
}
async function main() {
  const project = await fs.mkdtemp(
    path.join(os.tmpdir(), "tilt-export-project-"),
  );
  const directory = path.join(project, "scenes", "fixture");
  await fs.mkdir(path.join(directory, "source"), { recursive: true });
  await fs.mkdir(output, { recursive: true });
  await fs.symlink(
    path.resolve("node_modules"),
    path.join(project, "node_modules"),
  );
  const version = String(
    execFileSync(
      electron as unknown as string,
      ["-p", "process.versions.electron"],
      { env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" }, encoding: "utf8" },
    ),
  ).trim();
  const jobs = new Jobs(
    project,
    runtime,
    electron as unknown as string,
    version,
  );
  const wait = async (id: string, test: (job: RenderJob) => boolean) => {
    const end = Date.now() + 120000;
    while (Date.now() < end) {
      const job = await jobs.get(id);
      if (test(job)) return job;
      if (["failed", "interrupted", "cancelled"].includes(job.phase))
        throw new Error(`Unexpected ${job.phase}: ${job.error ?? "no detail"}`);
      await pause(50);
    }
    throw new Error("Timed out awaiting isolated job " + id);
  };
  const signalJob = async (id: string, signal: NodeJS.Signals) => {
    const job = await jobs.get(id);
    assert.ok(job.pid);
    const command = execFileSync(
      "ps",
      ["-p", String(job.pid), "-o", "command="],
      { encoding: "utf8" },
    );
    assert.ok(
      command.includes("--job " + id) && command.includes(project),
      "Only signal this harness's exact worker",
    );
    process.kill(job.pid, signal);
  };
  try {
    await fs.writeFile(
      path.join(directory, "source/index.html"),
      '<!doctype html><style>body{margin:0;background:#e9edf3;color:#20345c;font:18px sans-serif}main{position:absolute;top:26px;width:170px;height:110px;background:#fff;padding:16px;border-radius:12px}</style><main data-tilt-id="card"><strong>Export fixture</strong><p></p></main><script>window.tiltSource={ready:()=>document.fonts.ready,sample:({time})=>{document.querySelector("main").style.left=(24+Math.round(time*20))+"px";document.querySelector("p").textContent="Frame "+Math.round(time*30);return {revision:time}}};</script>',
    );
    await fs.writeFile(
      path.join(directory, "scene.ts"),
      `export default ({THREE,world,camera,surfaces})=>{const material=new THREE.MeshBasicMaterial({map:surfaces.ui});const plane=new THREE.Mesh(new THREE.PlaneGeometry(4,3),material);world.add(plane);const shader=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float time;varying vec2 uv0;void main(){gl_FragColor=vec4(uv0.x,.25+.2*sin(time),uv0.y,1.);}',side:THREE.DoubleSide});const card=new THREE.Mesh(new THREE.PlaneGeometry(.55,.55),shader);card.position.set(1.35,-.85,.08);world.add(card);camera.position.z=6;return {sample({time}){plane.rotation.y=.08*Math.sin(time);shader.uniforms.time.value=time;card.rotation.z=time*.1;}};}`,
    );
    const scene = SceneSchema.parse({
      version: 1,
      id: "fixture",
      name: "Export regression",
      duration: 2,
      fps: 30,
      size: { width: 320, height: 240 },
      background: "#172032",
      entry: "scene.ts",
      capture: { density: 1 },
      ...(process.env.TILT_EXPORT_DOF === "1"
        ? {
            camera: {
              projection: "perspective",
              depthOfField: { enabled: true, focusPlane: 0.15, blur: 0.3 },
            },
          }
        : {}),
      parameters: {},
      render: { encoding: "pipelined" },
      sources: [
        {
          id: "ui",
          kind: "web",
          entry: "source/index.html",
          width: 320,
          height: 240,
          sampling: "controlled",
          layers: [],
        },
      ],
    });
    await fs.writeFile(
      path.join(directory, "scene.json"),
      JSON.stringify(scene),
    );
    const compile = () => compileScene(project, directory, scene);
    const [first, duplicate] = await Promise.all([
      jobs.submit(scene, directory, compile, "isolated-stream"),
      jobs.submit(scene, directory, compile, "isolated-stream"),
    ]);
    assert.equal(first.id, duplicate.id, "Submission must remain idempotent");
    const running = await wait(
      first.id,
      (job) => job.phase === "capturing" && job.frame >= 4,
    );
    const firstFile = path.join(jobs.directory, first.id, "frames/000000.png");
    const firstHash = hash(await fs.readFile(firstFile));
    await signalJob(first.id, "SIGKILL");
    const interrupted = await wait(
      first.id,
      (job) => job.phase === "interrupted",
    );
    await jobs.resume(first.id);
    await wait(
      first.id,
      (job) => job.phase === "capturing" && job.frame >= interrupted.frame + 4,
    );
    await jobs.cancel(first.id);
    const cancelled = await wait(first.id, (job) => job.phase === "cancelled");
    assert.equal(
      cancelled.output,
      undefined,
      "Cancelled job must not publish output",
    );
    await jobs.resume(first.id);
    const complete = await wait(first.id, (job) => job.phase === "complete");
    assert.equal(
      hash(await fs.readFile(firstFile)),
      firstHash,
      "Resume must preserve completed frame checkpoints",
    );
    const checkpoint = SceneSchema.parse({
      ...scene,
      render: { encoding: "checkpoint" },
    });
    await fs.writeFile(
      path.join(directory, "scene.json"),
      JSON.stringify(checkpoint),
    );
    const second = await jobs.submit(
      checkpoint,
      directory,
      () => compileScene(project, directory, checkpoint),
      "isolated-checkpoint",
    );
    const comparison = await wait(second.id, (job) => job.phase === "complete");
    for (let index = 0; index < complete.total; index++) {
      const relative = `frames/${String(index).padStart(6, "0")}.png`;
      assert.equal(
        hash(await fs.readFile(path.join(jobs.directory, first.id, relative))),
        hash(await fs.readFile(path.join(jobs.directory, second.id, relative))),
        "Pipelined/resumed and checkpoint export must render the same absolute frame " +
          index,
      );
    }
    const streamHash = await decodedHash(complete.output!),
      checkpointHash = await decodedHash(comparison.output!);
    assert.equal(
      streamHash,
      checkpointHash,
      "Decoded MP4 frame stream must match checkpoint encoding",
    );
    const probes = [complete, comparison].map(
      (job) =>
        JSON.parse(
          execFileSync(
            "ffprobe",
            [
              "-v",
              "error",
              "-count_frames",
              "-show_entries",
              "stream=width,height,nb_read_frames,r_frame_rate",
              "-of",
              "json",
              job.output!,
            ],
            { encoding: "utf8" },
          ),
        ).streams[0],
    );
    for (const probe of probes) {
      assert.equal(Number(probe.nb_read_frames), 60);
      assert.equal(probe.width, 320);
      assert.equal(probe.height, 240);
      assert.equal(probe.r_frame_rate, "30/1");
    }
    await fs.copyFile(complete.output!, path.join(output, "pipelined.mp4"));
    await fs.copyFile(comparison.output!, path.join(output, "checkpoint.mp4"));
    await fs.copyFile(firstFile, path.join(output, "first.png"));
    const report = {
      measuredAt: new Date().toISOString(),
      runtime,
      electron: version,
      fixture: {
        duration: 2,
        fps: 30,
        total: 60,
        width: 320,
        height: 240,
        controlledDOM: true,
        arbitraryShader: true,
      },
      proof: {
        idempotentSubmission: true,
        verifiedWorkerInterrupted: true,
        interruptedAt: interrupted.frame,
        cancelledAt: cancelled.frame,
        noCancelledPublication: true,
        resumed: true,
        existingFrameRetained: true,
        all60RawFrameHashesEqual: true,
        decodedVideosEqual: true,
      },
      hashes: { firstFrame: firstHash, decodedVideo: streamHash },
      probes,
    };
    await fs.writeFile(
      path.join(output, "results.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report));
  } catch (error) {
    for (const job of await jobs.list()) {
      const log = await fs
        .readFile(path.join(jobs.directory, job.id, "worker.log"), "utf8")
        .catch(() => "");
      console.error(JSON.stringify({ job, log: log.slice(-5000) }));
    }
    throw error;
  } finally {
    for (const job of await jobs.list())
      if (job.pid) {
        try {
          const command = execFileSync(
            "ps",
            ["-p", String(job.pid), "-o", "command="],
            { encoding: "utf8" },
          );
          if (command.includes(project)) process.kill(job.pid, "SIGTERM");
        } catch {}
      }
    await pause(200);
    await fs.rm(project, { recursive: true, force: true });
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
