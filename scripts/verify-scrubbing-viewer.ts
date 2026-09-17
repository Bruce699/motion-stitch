import { SceneEngine } from "../src/renderer/engine";
import { LatestFrame } from "../src/core/motion";
async function api(c: unknown) {
  const r = await fetch("/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(c),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error);
  return j;
}
function stats(values: number[]) {
  const a = [...values].sort((a, b) => a - b);
  return {
    count: a.length,
    p50: a[Math.floor(a.length * 0.5)] ?? null,
    p95: a[Math.floor(a.length * 0.95)] ?? null,
    max: a.at(-1) ?? null,
  };
}
async function run() {
  const { scene, url } = await api({ type: "config" });
  const requests: number[] = [];
  const engine = new SceneEngine(
    scene,
    async (time, _revision, captureZoom, knownImages) => {
      const at = performance.now();
      const frame = await api({
        type: "frame",
        time,
        captureZoom,
        knownImages,
      });
      requests.push(performance.now() - at);
      return frame;
    },
  );
  engine.setPreviewViewport(818, 511, 2);
  document.body.append(engine.canvas);
  await engine.init(url);
  const shots: Record<string, string> = {};
  const reports: unknown[] = [];
  const startup: unknown[] = [];
  const gpu: unknown[] = [];
  try {
    for (const enabled of [false, true]) {
      engine.document = {
        ...engine.document,
        camera: {
          ...engine.document.camera!,
          depthOfField: { ...engine.document.camera!.depthOfField!, enabled },
        },
      };
      const first = performance.now();
      await engine.sample(4.236333188043403);
      engine.renderer.getContext().finish();
      startup.push({ enabled, firstFrameMs: performance.now() - first });
      shots[enabled ? "on" : "off"] = engine.canvas.toDataURL();
      for (const time of [0, 2, 4, 6]) {
        await engine.sample(time);
        if (enabled) shots["on-" + time] = engine.canvas.toDataURL();
      }
      requests.length = 0;
      const presented: number[] = [];
      const latency: number[] = [];
      const allSamples: number[] = [];
      let inputs = 0,
        lastPromise: Promise<unknown> = Promise.resolve();
      const errors: unknown[] = [];
      const scheduler = new LatestFrame<{ time: number; at: number }>(
        async ({ time, at }, valid) => {
          const start = performance.now();
          const p = engine.sample(time, engine.document, valid);
          lastPromise = p;
          await p;
          allSamples.push(performance.now() - start);
          if (valid()) {
            presented.push(performance.now());
            latency.push(performance.now() - at);
          }
        },
        (e) => errors.push(String(e)),
        true,
      );
      const start = performance.now();
      let end = start;
      await new Promise<void>((resolve) => {
        function tick(now: number) {
          end = now;
          const elapsed = (now - start) / 1000;
          if (elapsed >= 5) {
            resolve();
            return;
          }
          const phase = (elapsed % 2) / 2;
          const time = phase < 0.5 ? phase * 12 : (1 - phase) * 12;
          inputs++;
          scheduler.request({ time, at: performance.now() });
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
      await lastPromise;
      await new Promise((r) => setTimeout(r, 120));
      const report = {
        enabled,
        inputs,
        seconds: (end - start) / 1000,
        presentedFrames: presented.filter((t) => t <= end).length,
        presentedFps:
          presented.filter((t) => t <= end).length / ((end - start) / 1000),
        frameGapsMs: stats(presented.slice(1).map((t, i) => t - presented[i])),
        inputToFrameMs: stats(latency),
        sampleMs: stats(allSamples),
        sourceMs: stats(requests),
        errors,
      };
      reports.push(report);
      await api({ type: "progress", message: report });
    }
    const gl = engine.renderer.getContext() as WebGL2RenderingContext;
    const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
    const previewSize = [engine.canvas.width, engine.canvas.height];
    for (const [width, height] of [
      [1636, 1023],
      [1440, 900],
      [3840, 2160],
    ]) {
      engine.document = { ...engine.document, size: { width, height } };
      engine.setPreviewViewport(width, height, 1);
      for (const enabled of [false, true]) {
        engine.document = {
          ...engine.document,
          camera: {
            ...engine.document.camera!,
            depthOfField: { ...engine.document.camera!.depthOfField!, enabled },
          },
        };
        await engine.sample(4);
        if (ext) {
          const query = gl.createQuery()!;
          gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
          for (let i = 0; i < 60; i++) engine.renderView();
          gl.endQuery(ext.TIME_ELAPSED_EXT);
          gl.flush();
          const deadline = performance.now() + 10000;
          while (!gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) {
            if (performance.now() > deadline)
              throw new Error("GPU query timeout");
            await new Promise((r) => setTimeout(r, 10));
          }
          if (gl.getParameter(ext.GPU_DISJOINT_EXT))
            throw new Error("GPU timing invalid");
          gpu.push({
            size: [engine.canvas.width, engine.canvas.height],
            enabled,
            gpuMsPerFrame:
              gl.getQueryParameter(query, gl.QUERY_RESULT) / 60 / 1e6,
          });
          gl.deleteQuery(query);
        }
      }
    }
    return {
      reports,
      startup,
      gpu,
      shots,
      size: previewSize,
      density: engine.quality,
    };
  } finally {
    engine.dispose();
  }
}
(window as any).runScrubbingChecks = run;
