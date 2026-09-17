import { SceneEngine } from "../src/renderer/engine";
import { decodeFrame } from "../src/core/frame-wire";
import type { CapturedFrame } from "../src/core/layers";
import type { SceneDocument } from "../src/core/schema";

type Mode = "json" | "binary";
const ensure = (value: unknown, message: string) => {
  if (!value) throw new Error(message);
};
const stats = (values: number[]) => {
  const ordered = [...values].sort((a, b) => a - b);
  return {
    count: values.length,
    median: ordered[Math.floor(values.length / 2)],
    p95: ordered[Math.ceil(values.length * 0.95) - 1],
  };
};
const api = async (body: unknown) => {
  const response = await fetch("/api", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error);
  return value;
};
async function hash(engine: SceneEngine) {
  const png = engine.canvas.toDataURL("image/png"),
    bytes = Uint8Array.from(atob(png.split(",")[1]), (char) =>
      char.charCodeAt(0),
    );
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
  )
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}
async function receiver(mode: Mode) {
  const { scene } = (await api({ type: "config" })) as { scene: SceneDocument };
  const exchanges: {
    bytes: number;
    images: string[];
    known: Record<string, string>;
    versions: Record<string, string>;
  }[] = [];
  let fault = false;
  const engine = new SceneEngine(
    scene,
    async (time, _revision, _zoom, known) => {
      const response = await fetch("/api", {
        method: "POST",
        body: JSON.stringify({ type: "frame", time, mode, known }),
      });
      const packet = await response.arrayBuffer();
      if (!response.ok) throw new Error(new TextDecoder().decode(packet));
      const frame: CapturedFrame =
        mode === "binary"
          ? decodeFrame(packet)
          : JSON.parse(new TextDecoder().decode(packet));
      const images = Object.keys(
        mode === "binary" ? frame.surfaces! : frame.images,
      );
      exchanges.push({
        bytes: packet.byteLength,
        images,
        known: { ...known },
        versions: { ...frame.imageVersions },
      });
      if (fault) {
        ensure(
          mode === "binary" && images.length === 4,
          "Fault injection requires a complete binary frame",
        );
        const bad = frame.surfaces![images[1]];
        // Retain a genuine PNG header/dimensions, corrupt the compressed payload.
        // Wire parsing succeeds; the browser's real image decoder must reject it.
        const corrupt = new Uint8Array(bad.bytes);
        corrupt.fill(0, 33);
        frame.surfaces![images[1]] = { ...bad, bytes: corrupt };
        fault = false;
      }
      return frame;
    },
  );
  document.body.append(engine.canvas);
  await engine.init("/scene.js");
  return {
    engine,
    exchanges,
    failNext: () => {
      fault = true;
    },
    close: () => {
      engine.dispose();
      engine.canvas.remove();
    },
  };
}
async function sequence(mode: Mode, times: number[]) {
  const client = await receiver(mode);
  try {
    await client.engine.sample(0.25);
    client.exchanges.length = 0;
    const elapsed: number[] = [],
      hashes: Record<string, string> = {};
    for (const time of times) {
      const start = performance.now();
      await client.engine.sample(time);
      elapsed.push(performance.now() - start);
      hashes[String(time)] = await hash(client.engine);
    }
    return {
      mode,
      latency: stats(elapsed),
      responseBytes: client.exchanges.reduce((sum, e) => sum + e.bytes, 0),
      images: client.exchanges.reduce((sum, e) => sum + e.images.length, 0),
      hashes,
      metrics: client.engine.metrics,
    };
  } finally {
    client.close();
  }
}
(window as any).tiltSurfaceVerification = {
  async run() {
    const reports = [];
    for (let trial = 0; trial < 3; trial++) {
      const order: Mode[] = trial % 2 ? ["binary", "json"] : ["json", "binary"];
      const results = [];
      for (const mode of order)
        results.push(
          await sequence(mode, [0.2, 0.4, 0.8, 0.4, 1.2, 2.2, 1.2, 0.2]),
        );
      const json = results.find((result) => result.mode === "json")!,
        binary = results.find((result) => result.mode === "binary")!;
      ensure(
        JSON.stringify(json.hashes) === JSON.stringify(binary.hashes),
        "Binary and JSON frames must produce identical composed PNGs including backward seeks",
      );
      ensure(
        binary.images === json.images,
        "Both transports must transfer the same changed surface count",
      );
      ensure(
        binary.responseBytes < json.responseBytes,
        "Binary should reduce actual response bytes",
      );
      reports.push({ trial, order, json, binary });
    }
    const a = await receiver("binary"),
      b = await receiver("binary");
    try {
      await a.engine.sample(0.25);
      await b.engine.sample(0.25);
      ensure(
        a.exchanges[0].images.length === 4 &&
          b.exchanges[0].images.length === 4,
        "Each receiver independently obtains all initial surfaces",
      );
      const before = await hash(a.engine);
      await a.engine.sample(0.25);
      ensure(
        a.exchanges.at(-1)!.images.length === 0,
        "Accepted surfaces must not retransmit",
      );
      a.failNext();
      let rejected = false;
      try {
        await a.engine.sample(1.25);
      } catch {
        rejected = true;
      }
      ensure(rejected, "Corrupted image must reject frame preparation");
      ensure(
        (await hash(a.engine)) === before,
        "Rejected preparation must retain the last successful canvas pixels",
      );
      // The editor can redraw directly on resize, inspection and camera changes.
      // A partially decoded set must not leak into those draws after rejection.
      a.engine.mode = "source";
      a.engine.renderView();
      ensure(
        (await hash(a.engine)) === before,
        "Direct inspection redraw must not present partially prepared surfaces",
      );
      a.engine.mode = "camera";
      const failed = a.exchanges.at(-1)!;
      await a.engine.sample(1.25);
      const retry = a.exchanges.at(-1)!;
      ensure(
        retry.known.react === failed.versions.react,
        "Successfully decoded first surface must remain acknowledged",
      );
      ensure(
        !retry.images.includes("react") && retry.images.length === 3,
        "Retry must retransmit only failed/unprocessed images",
      );
      await b.engine.sample(1.25);
      ensure(
        (await hash(a.engine)) === (await hash(b.engine)),
        "Recovered frame must match an independent renderer",
      );
      const texture = a.engine.textures.react;
      await api({ type: "density", value: 3 });
      await a.engine.sample(1.25);
      ensure(
        a.engine.textures.react === texture,
        "Live density resize must preserve texture identity held by materials",
      );
      ensure(
        texture.image.width === 960 && texture.image.height === 720,
        "Density change must install correct source dimensions",
      );
      const fresh = await receiver("binary");
      try {
        await fresh.engine.sample(1.25);
        ensure(
          (await hash(fresh.engine)) === (await hash(a.engine)),
          "Live density resize must match a fresh renderer",
        );
        const metrics = a.engine.metrics;
        ensure(
          (metrics?.residentSurfaceBytes ?? 0) > 0 &&
            metrics!.residentSurfaceBytes <= metrics!.surfaceBudgetBytes,
          "Surface memory must be reported within its budget",
        );
        return {
          reports,
          proof: {
            transportPixelsIdentical: true,
            backwardSeeks: true,
            independentReceivers: true,
            partialDecodeRetry: true,
            failedFramePreservesCanvas: true,
            inspectionAfterFailurePreservesCanvas: true,
            textureIdentityPreserved: true,
            liveDensityMatchesFresh: true,
            sourceSize: [960, 720],
            outputSize: [a.engine.canvas.width, a.engine.canvas.height],
            metrics,
          },
          png: a.engine.canvas.toDataURL("image/png"),
        };
      } finally {
        fresh.close();
      }
    } finally {
      a.close();
      b.close();
    }
  },
};
