import { SceneEngine } from "../src/renderer/engine";
async function api(body: any) {
  const r = await fetch("/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await r.json();
  if (!r.ok) throw Error(result.error);
  return result;
}
const ensure = (ok: unknown, message: string) => {
  if (!ok) throw Error(message);
};
let engine: SceneEngine;
(window as any).previewCheck = {
  async run() {
    const config = await api({ type: "config" }),
      stage = document.getElementById("stage")!;
    let requests = 0;
    engine = new SceneEngine(
      config.scene,
      async (time, revision, zoom, knownImages) => {
        requests++;
        return api({ type: "frame", time, knownImages });
      },
    );
    await engine.init(config.url);
    engine.mode = "source";
    engine.setPreviewViewport(innerWidth, innerHeight, devicePixelRatio);
    stage.append(engine.canvas);
    const baseline = [];
    for (const t of [1, 2, 3, 4]) {
      const start = performance.now();
      await engine.sample(t);
      baseline.push(performance.now() - start);
    }
    engine.mountSourcePreviews(stage, config.sourcePreviews);
    await engine.sample(0);
    const before = requests;
    const samples: number[] = [];
    const presented: number[] = [];
    const start = performance.now();
    while (performance.now() - start < 5000) {
      await new Promise(requestAnimationFrame);
      const now = performance.now();
      await engine.sample((now - start) / 1000);
      samples.push(performance.now() - now);
      presented.push(performance.now());
    }
    ensure(requests === before, "DOM playback requested raster captures");
    await engine.sample(10.8);
    await engine.sample(4.8);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const result = {
      baselineMs: baseline,
      domSamples: samples.length,
      elapsedMs: performance.now() - start,
      sampleP95: samples.sort((a, b) => a - b)[
        Math.floor(samples.length * 0.95)
      ],
      cadence:
        (1000 * (presented.length - 1)) / (presented.at(-1)! - presented[0]),
      rasterRequestsDuringPlayback: requests - before,
    };
    return result;
  },
  async camera() {
    engine.mode = "camera";
    await engine.sample(4.8);
    ensure(
      [...document.querySelectorAll("iframe")].every(
        (f) => f.parentElement!.style.display === "none",
      ),
      "Source overlay remains visible in camera mode",
    );
    return engine.metrics;
  },
  async source() {
    engine.mode = "source";
    await engine.sample(4.8);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  },
  async capture() {
    return engine.captureFrame(4.8, engine.document);
  },
  dispose() {
    engine.dispose();
    ensure(!document.querySelector("iframe"), "Preview iframe leaked");
  },
};
