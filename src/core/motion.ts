export const clamp = (v: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const segment = (time: number, start: number, end: number) =>
  ease((time - start) / (end - start));

/** Transport intent is independent of readiness; preparation never consumes time. */
export class SceneClock {
  time = 0;
  playing = false;
  ready = false;
  constructor(
    public duration: number,
    public fps: number,
  ) {}
  play() {
    if (this.time >= this.duration) this.time = 0;
    this.playing = true;
  }
  pause() {
    this.playing = false;
  }
  seek(time: number) {
    this.time = clamp(time, 0, this.duration);
    return this.time;
  }
  next() {
    return this.seek(this.time + 1 / this.fps);
  }
  advance(seconds: number) {
    if (this.playing && this.ready) {
      this.seek(this.time + Math.min(seconds, 0.1));
      if (this.time >= this.duration) this.pause();
    }
    return this.time;
  }
}

/** One in-flight render. Rapid seeks replace the pending request, never queue a backlog. */
export class LatestFrame<T> {
  private generation = 0;
  private epoch = 0;
  private running = false;
  private pending: { value: T; generation: number; epoch: number } | null =
    null;
  constructor(
    private render: (value: T, isCurrent: () => boolean) => Promise<void>,
    private onError: (error: unknown) => void,
    private presentCompleted = false,
  ) {}
  request(value: T) {
    this.pending = { value, generation: ++this.generation, epoch: this.epoch };
    if (!this.running) void this.drain();
  }
  invalidate() {
    this.generation++;
    this.epoch++;
    this.pending = null;
  }
  private async drain() {
    this.running = true;
    while (this.pending) {
      const p = this.pending;
      this.pending = null;
      try {
        // A slower controlled source must still present completed frames while
        // scrubbing. New times replace the pending sample; explicit invalidation
        // (reload/capture/scene replacement) also rejects the in-flight sample.
        await this.render(
          p.value,
          () =>
            p.epoch === this.epoch &&
            (this.presentCompleted || p.generation === this.generation),
        );
      } catch (e) {
        if (p.generation === this.generation) this.onError(e);
      }
    }
    this.running = false;
  }
}
