import { SceneEngine } from "../src/renderer/engine";
import type { CapturedFrame } from "../src/core/layers";
import type { SceneDocument } from "../src/core/schema";

let latestImages: Record<string, string> = {};
const decodeImage = HTMLImageElement.prototype.decode;
HTMLImageElement.prototype.decode = async function () {
  try {
    await decodeImage.call(this);
  } catch (error) {
    const id = Object.entries(latestImages).find(
      ([, data]) => data === this.src,
    )?.[0];
    throw new Error(
      `${String(error)} (texture ${id}, ${this.naturalWidth}x${this.naturalHeight}, ${this.src.length} data URL characters)`,
    );
  }
};

type Exchange = {
  bytes: number;
  responseText?: string;
  milliseconds: number;
  images: string[];
  known: Record<string, string>;
  versions: Record<string, string>;
  fault?: { id: string; version: string };
};
const ensure = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};
async function api<T = any>(body: unknown): Promise<T> {
  const response = await fetch("/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}
async function receiver(mode: "full" | "delta") {
  const { scene, url } = await api<{ scene: SceneDocument; url: string }>({
    type: "config",
  });
  const exchanges: Exchange[] = [];
  const engine = new SceneEngine(
    scene,
    async (time, revision, captureZoom, knownImages) => {
      const start = performance.now();
      const known = mode === "delta" ? { ...knownImages } : undefined;
      const response = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "frame",
          time,
          revision,
          captureZoom,
          knownImages: known,
        }),
      });
      const text = await response.text();
      const frame = JSON.parse(text) as CapturedFrame & {
        error?: string;
        testFault?: Exchange["fault"];
      };
      if (!response.ok) throw new Error(frame.error);
      latestImages = frame.images;
      exchanges.push({
        bytes: 0,
        responseText: text,
        milliseconds: performance.now() - start,
        images: Object.keys(frame.images),
        known: known || {},
        versions: frame.imageVersions || {},
        fault: frame.testFault,
      });
      return frame;
    },
  );
  document.body.append(engine.canvas);
  await engine.init(url);
  return {
    engine,
    exchanges,
    close() {
      engine.dispose();
      engine.canvas.remove();
    },
  };
}
async function hash(engine: SceneEngine) {
  const png = engine.canvas.toDataURL("image/png");
  const bytes = Uint8Array.from(atob(png.split(",")[1]), (c) =>
    c.charCodeAt(0),
  );
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
const percentile = (values: number[], p: number) =>
  [...values].sort((a, b) => a - b)[
    Math.min(values.length - 1, Math.floor(values.length * p))
  ];
async function sequence(mode: "full" | "delta", times: number[]) {
  const client = await receiver(mode);
  try {
    await client.engine.sample(2);
    ensure(
      client.exchanges.at(-1)!.images.length === 6,
      "Fresh renderer must receive all six source textures",
    );
    client.exchanges.length = 0;
    const samples: number[] = [],
      hashes: Record<string, string> = {};
    for (let i = 0; i < times.length; i++) {
      const start = performance.now();
      await client.engine.sample(times[i]);
      samples.push(performance.now() - start);
      // Count UTF-8 bytes outside the sampling timer so instrumentation does not
      // make the full-response baseline pay an extra encoding cost.
      const exchange = client.exchanges.at(-1)!;
      exchange.bytes = new TextEncoder().encode(
        exchange.responseText!,
      ).byteLength;
      delete exchange.responseText;
      if (
        times.length <= 8 ||
        i === 0 ||
        i === Math.floor(times.length / 2) ||
        i === times.length - 1
      )
        hashes[`${i}:${times[i]}`] = await hash(client.engine);
    }
    return {
      mode,
      frames: times.length,
      responseBytes: client.exchanges.reduce((n, e) => n + e.bytes, 0),
      imageCount: client.exchanges.reduce((n, e) => n + e.images.length, 0),
      totalSampleMs: samples.reduce((a, b) => a + b, 0),
      medianSampleMs: percentile(samples, 0.5),
      p95SampleMs: percentile(samples, 0.95),
      totalRequestMs: client.exchanges.reduce((n, e) => n + e.milliseconds, 0),
      hashes,
    };
  } finally {
    client.close();
  }
}
const parity = (
  a: { hashes: Record<string, string> },
  b: { hashes: Record<string, string> },
) =>
  ensure(
    JSON.stringify(a.hashes) === JSON.stringify(b.hashes),
    "Composed PNG hashes differ between full and delta transfer",
  );

(window as any).tiltTransferBenchmark = {
  async run(options: { frames: number; trials: number; changing: boolean }) {
    ensure(
      options.frames >= 2 && options.trials >= 1,
      "Use at least two frames and one trial",
    );
    const camera = Array.from(
      { length: options.frames },
      (_, i) => 2 + (i * 0.8) / options.frames,
    );
    camera.push(2.1, 2.7, 2); // backward seeking while the source pixels remain unchanged
    const trials = [];
    for (let trial = 0; trial < options.trials; trial++) {
      await api({
        type: "progress",
        message: `camera trial ${trial + 1}/${options.trials}`,
      });
      const order: ("full" | "delta")[] =
        trial % 2 ? ["delta", "full"] : ["full", "delta"];
      const results = [];
      const before = await api({ type: "stats" });
      // Both variants warm the same source revision before timing.
      for (const mode of order) results.push(await sequence(mode, camera));
      const full = results.find((r) => r.mode === "full")!,
        delta = results.find((r) => r.mode === "delta")!;
      parity(full, delta);
      ensure(
        delta.imageCount === 0,
        "Camera-only delta frames must transfer no PNGs",
      );
      ensure(
        full.imageCount === camera.length * 6,
        "Baseline must really transfer full PNGs",
      );
      ensure(
        delta.responseBytes < full.responseBytes,
        "Delta payload must be smaller",
      );
      const after = await api({ type: "stats" });
      trials.push({
        kind: "camera-only",
        order,
        full,
        delta,
        capturesIncludingWarmup: after.captureCount - before.captureCount,
      });
    }
    if (options.changing) {
      await api({
        type: "progress",
        message: "changing UI and backward-seek parity",
      });
      const times = [0.5, 1, 3.5, 5.8, 3.5, 0.5];
      const full = await sequence("full", times),
        delta = await sequence("delta", times);
      parity(full, delta);
      ensure(
        full.imageCount === times.length * 6 &&
          delta.imageCount === full.imageCount,
        "Changing UI must keep delivering all changed textures",
      );
      trials.push({
        kind: "changing-ui",
        order: ["full", "delta"],
        full,
        delta,
      });
    }
    return {
      density: (await api({ type: "config" })).density,
      trials,
      assertions: [
        "full/delta composed PNG equality",
        "backward seeking",
        "fresh receiver gets six PNGs",
        "camera-only delta omits all PNGs",
        "changing source pixels still transferred",
      ],
    };
  },
  async verifyRecoveryAndDensity() {
    await api({
      type: "progress",
      message: "independent receivers, failed decode, reload and live density",
    });
    await api({ type: "density", value: 3 });
    const a = await receiver("delta"),
      b = await receiver("delta");
    try {
      await a.engine.sample(2);
      await b.engine.sample(2);
      ensure(
        a.exchanges[0].images.length === 6 &&
          b.exchanges[0].images.length === 6,
        "Receivers must independently fetch their initial textures",
      );
      ensure(
        (await hash(a.engine)) === (await hash(b.engine)),
        "Independent initial receivers differ",
      );
      await a.engine.sample(2);
      await b.engine.sample(2);
      ensure(
        a.exchanges.at(-1)!.images.length === 0 &&
          b.exchanges.at(-1)!.images.length === 0,
        "Independent receivers must each reuse their textures",
      );
      await api({ type: "fault" });
      let rejected = false;
      try {
        await a.engine.sample(3.5);
      } catch {
        rejected = true;
      }
      ensure(rejected, "Corrupted PNG must reject sampling");
      const fault = a.exchanges.at(-1)!.fault!;
      ensure(fault, "Fault injection metadata missing");
      await a.engine.sample(3.5);
      const retry = a.exchanges.at(-1)!;
      ensure(
        retry.known[fault.id] !== fault.version &&
          retry.images.includes(fault.id),
        "Failed image must not be acknowledged and must be retransmitted",
      );
      ensure(
        retry.known.ui === retry.versions.ui && !retry.images.includes("ui"),
        "First successfully decoded image must stay acknowledged after the second image fails",
      );
      ensure(
        retry.images.length === 5,
        "Retry must resend failed and unprocessed images only",
      );
      await b.engine.sample(3.5);
      ensure(
        (await hash(a.engine)) === (await hash(b.engine)),
        "Retry must compose exactly the independent receiver's pixels",
      );
      await api({ type: "visibility", hidden: true });
      await a.engine.sample(3.6);
      ensure(
        a.engine.layerFrames[0].regions.find((r) => r.id === "summary")
          ?.visible === false,
        "Hidden layer metadata must reach receiver",
      );
      ensure(
        !a.exchanges.at(-1)!.images.includes("ui/summary"),
        "Hidden layer should not need a PNG",
      );
      await api({ type: "visibility", hidden: false });
      await a.engine.sample(3.61);
      ensure(
        a.engine.layerFrames[0].regions.find((r) => r.id === "summary")
          ?.visible === true,
        "Restored layer metadata must reach receiver",
      );
      ensure(
        a.exchanges.at(-1)!.images.includes("ui/summary"),
        "Restored layer must receive its current PNG",
      );
      await b.engine.sample(3.61);
      ensure(
        (await hash(a.engine)) === (await hash(b.engine)),
        "Restored layer output differs from independent receiver",
      );
      b.close();
      const reload = await receiver("delta");
      try {
        await reload.engine.sample(3.61);
        ensure(
          reload.exchanges[0].images.length === 6,
          "Reload must fetch full textures despite another receiver's cache",
        );
        ensure(
          (await hash(reload.engine)) === (await hash(a.engine)),
          "Reload output differs",
        );
      } finally {
        reload.close();
      }
      await a.engine.sample(2);
      await api({ type: "density", value: 4 });
      await a.engine.sample(2);
      ensure(
        a.exchanges.at(-1)!.images.length === 6,
        "Live density change must send all replacement textures",
      );
      const liveImage = a.engine.textures.ui.image as HTMLImageElement;
      ensure(
        liveImage.width === 4000 && liveImage.height === 2560,
        "4x texture dimensions not installed",
      );
      const liveHash = await hash(a.engine),
        fresh = await receiver("delta");
      try {
        await fresh.engine.sample(2);
        const freshHash = await hash(fresh.engine);
        ensure(
          liveHash === freshHash,
          "Live density change must match a fresh high-density renderer",
        );
        return {
          independentReceivers: true,
          partialDecodeFailureKeepsOnlyAcceptedImage: true,
          retryMatchesIndependent: true,
          hiddenLayerRestored: true,
          reloadFetchesAll: true,
          liveDensityMatchesFresh: true,
          liveHash,
          freshHash,
          sourcePixels: [4000, 2560],
          outputPixels: [a.engine.canvas.width, a.engine.canvas.height],
          png: a.engine.canvas.toDataURL("image/png"),
        };
      } finally {
        fresh.close();
      }
    } finally {
      a.close();
      if (b.engine.canvas.isConnected) b.close();
    }
  },
};
