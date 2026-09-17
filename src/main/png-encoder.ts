import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

export function mp4EncodingArguments(total: number, output: string) {
  return [
    "-frames:v",
    String(total),
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    output,
  ];
}

/** Streams already checkpointed PNGs with backpressure; a restart replays the checkpoints. */
export class PNGEncoder {
  private child: ChildProcessWithoutNullStreams;
  private completed: Promise<void>;
  private failure?: Error;
  private ended = false;
  private exited = false;
  private stderr = "";
  constructor(
    fps: number,
    total: number,
    output: string,
    executable = "ffmpeg",
  ) {
    this.child = spawn(
      executable,
      [
        "-y",
        "-v",
        "error",
        "-f",
        "image2pipe",
        "-framerate",
        String(fps),
        "-vcodec",
        "png",
        "-i",
        "pipe:0",
        ...mp4EncodingArguments(total, output),
      ],
      { stdio: "pipe" },
    );
    this.child.stdout.resume();
    this.child.stderr.on("data", (data) => {
      this.stderr = (this.stderr + data.toString()).slice(-16000);
    });
    // Failed stdin writes can precede the process's close event.
    this.child.stdin.on("error", (error) => {
      this.failure ??= error;
    });
    this.completed = new Promise((resolve, reject) => {
      this.child.once("error", (error) => {
        this.failure = error;
        reject(error);
      });
      this.child.once("close", (code) => {
        this.exited = true;
        if (code === 0 && !this.failure) resolve();
        else {
          this.failure ??= new Error(
            `ffmpeg: ${this.stderr || `encoder exited (${code})`}`,
          );
          reject(this.failure);
        }
      });
    });
    // The owner may still be capturing when an encoder fails; report on write/finish.
    void this.completed.catch(() => {});
  }
  async write(png: Buffer) {
    if (this.failure) throw this.failure;
    if (this.ended || this.exited) throw new Error("PNG encoder is closed");
    await new Promise<void>((resolve, reject) => {
      this.child.stdin.write(png, (error) =>
        error ? reject(error) : resolve(),
      );
    });
    if (this.failure) throw this.failure;
  }
  async finish() {
    if (!this.ended) {
      this.ended = true;
      this.child.stdin.end();
    }
    await this.completed;
  }
  async abort() {
    this.ended = true;
    if (!this.exited) {
      this.child.stdin.destroy();
      this.child.kill("SIGKILL");
    }
    await this.completed.catch(() => {});
  }
}
