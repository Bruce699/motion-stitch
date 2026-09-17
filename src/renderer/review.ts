import { SceneEngine } from "./engine";
import { cameraDocument, type CompositionGraph } from "../core/compositions";
import { FRAME_CONTENT_TYPE, decodeFrame } from "../core/frame-wire";
import type { ReviewRect } from "../core/review";

async function call(command: object) {
  const response = await fetch("/api", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: FRAME_CONTENT_TYPE },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.headers.get("content-type")?.includes(FRAME_CONTENT_TYPE)
    ? decodeFrame(await response.arrayBuffer())
    : response.json();
}
let engine: SceneEngine | undefined;
let key = "";
async function prepare(cameraId?: string) {
  const prep = await call({ type: "prepare" });
  const nextKey = prep.key + ":" + (cameraId ?? "default");
  if (nextKey === key && engine) return;
  engine?.dispose();
  engine = undefined;
  key = "";
  const scene = cameraDocument(prep.scene, cameraId ?? undefined);
  const next = new SceneEngine(
    scene,
    (time, revision, captureZoom, knownImages, overrides) =>
      call({
        type: "frame",
        sceneId: scene.id,
        time,
        revision,
        captureZoom,
        knownImages,
        overrides,
        includeContext: true,
      }),
  );
  try {
    next.cameraId = cameraId ?? scene.defaultCameraId ?? "main";
    await next.init(
      prep.url,
      prep.compositions as CompositionGraph,
      (sceneId, time, revision, captureZoom, knownImages, overrides) =>
        call({
          type: "frame",
          sceneId,
          time,
          revision,
          captureZoom,
          knownImages,
          overrides,
          includeContext: true,
        }),
    );
    engine = next;
    key = nextKey;
    document.body.replaceChildren(next.canvas);
  } catch (error) {
    next.dispose();
    throw error;
  }
}
const bitmap = async (data: string) =>
  createImageBitmap(await (await fetch(data)).blob());
async function sheet(
  items: { data: string; label: string }[],
  columns: number,
  cellWidth = 640,
) {
  const first = await bitmap(items[0].data);
  const height = Math.round((cellWidth * first.height) / first.width);
  first.close();
  const canvas = document.createElement("canvas");
  canvas.width = columns * cellWidth;
  canvas.height = Math.ceil(items.length / columns) * (height + 32);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#111318";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#ffffff";
  for (const [i, item] of items.entries()) {
    const image = await bitmap(item.data),
      x = (i % columns) * cellWidth,
      y = Math.floor(i / columns) * (height + 32);
    ctx.drawImage(image, x, y, cellWidth, height);
    image.close();
    ctx.fillText(item.label, x + 12, y + height + 21);
  }
  return canvas.toDataURL("image/png");
}
Object.assign(window, {
  __tiltReview: {
    prepare,
    async frame(time: number) {
      if (!engine) throw new Error("Review is not prepared");
      await engine.sample(time);
      return {
        data: engine.canvas.toDataURL("image/png"),
        context: engine.reviewContext(),
      };
    },
    async motionFrame(time: number) {
      if (!engine) throw new Error("Review is not prepared");
      await engine.sample(time);
      const canvas = document.createElement("canvas");
      const scale = Math.min(
        1,
        1920 / engine.canvas.width,
        1080 / engine.canvas.height,
      );
      canvas.width = Math.max(
        2,
        Math.round((engine.canvas.width * scale) / 2) * 2,
      );
      canvas.height = Math.max(
        2,
        Math.round((engine.canvas.height * scale) / 2) * 2,
      );
      canvas
        .getContext("2d")!
        .drawImage(engine.canvas, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/png");
    },
    sheet,
    async crop(data: string, rect: ReviewRect) {
      const image = await bitmap(data),
        canvas = document.createElement("canvas");
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas
        .getContext("2d")!
        .drawImage(
          image,
          rect.x,
          rect.y,
          rect.width,
          rect.height,
          0,
          0,
          rect.width,
          rect.height,
        );
      image.close();
      return canvas.toDataURL("image/png");
    },
    dispose() {
      engine?.dispose();
      engine = undefined;
      key = "";
    },
  },
});
