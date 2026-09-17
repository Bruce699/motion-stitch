import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PNGEncoder, mp4EncodingArguments } from "../src/main/png-encoder";
const exec = promisify(execFile);

test("pipelined encoder and checkpoint fallback decode to identical frames; interrupted stream can replay checkpoints", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-encoder-"));
  let encoder: PNGEncoder | undefined;
  try {
    const sequence = path.join(directory, "%06d.png");
    await exec("ffmpeg", [
      "-v",
      "error",
      "-f",
      "lavfi",
      "-i",
      "testsrc2=size=64x48:rate=30",
      "-frames:v",
      "8",
      "-threads",
      "1",
      sequence,
    ]);
    const reference = path.join(directory, "reference.mp4"),
      streamed = path.join(directory, "streamed.mp4");
    await exec("ffmpeg", [
      "-y",
      "-v",
      "error",
      "-framerate",
      "30",
      "-i",
      sequence,
      ...mp4EncodingArguments(8, reference),
    ]);
    const frames = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        fs.readFile(
          path.join(directory, String(i + 1).padStart(6, "0") + ".png"),
        ),
      ),
    );
    encoder = new PNGEncoder(30, 8, streamed);
    for (const png of frames.slice(0, 3)) await encoder.write(png);
    await encoder.abort();
    // Recovery always starts a fresh encoder and replays all valid durable frames.
    encoder = new PNGEncoder(30, 8, streamed);
    for (const png of frames) await encoder.write(png);
    await encoder.finish();
    const digest = async (file: string) =>
      (
        await exec("ffmpeg", ["-v", "error", "-i", file, "-f", "framemd5", "-"])
      ).stdout
        .split("\n")
        .filter((line) => line && !line.startsWith("#"));
    assert.deepEqual(await digest(streamed), await digest(reference));
    const probe = JSON.parse(
      (
        await exec("ffprobe", [
          "-v",
          "error",
          "-count_frames",
          "-select_streams",
          "v:0",
          "-show_entries",
          "stream=width,height,nb_read_frames,r_frame_rate",
          "-of",
          "json",
          streamed,
        ])
      ).stdout,
    ).streams[0];
    assert.equal(probe.width, 64);
    assert.equal(probe.height, 48);
    assert.equal(probe.nb_read_frames, "8");
    assert.equal(probe.r_frame_rate, "30/1");
    assert.equal(
      (await fs.readdir(directory)).filter((file) => file.endsWith(".png"))
        .length,
      8,
    );
  } finally {
    await encoder?.abort();
    await fs.rm(directory, { recursive: true, force: true });
  }
});
test("encoder startup failures reject without an unhandled child-process error", async () => {
  const encoder = new PNGEncoder(
    30,
    1,
    "unused.mp4",
    "/nonexistent/tilt-ffmpeg",
  );
  await assert.rejects(encoder.finish());
  await encoder.abort();
});
