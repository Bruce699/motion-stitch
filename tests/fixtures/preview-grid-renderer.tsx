import React, { useLayoutEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { PreviewGrid } from "../../src/renderer/preview-grid";
import "../../src/renderer/project-workspace.css";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const root = createRoot(document.getElementById("root")!);
const ids = ["a", "b", "c", "d"];

function Picture({ id }: { id: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const context = canvas.current!.getContext("2d")!;
    const index = ids.indexOf(id);
    context.fillStyle = ["#abd5e7", "#dac2e6", "#e8d393", "#b9d6bb"][index];
    context.fillRect(0, 0, 640, 360);
    context.strokeStyle = "#252525";
    context.lineWidth = 5;
    context.strokeRect(240, 100, 160, 160);
    context.font = "500 28px sans-serif";
    context.fillStyle = "#252525";
    context.fillText(`Scene ${id.toUpperCase()}`, 28, 48);
  }, [id]);
  return <canvas ref={canvas} width={640} height={360} />;
}

function render(count: number) {
  flushSync(() =>
    root.render(
      <section className="playground-preview">
        <PreviewGrid ids={ids.slice(0, count)} aspect={16 / 9}>
          {(id) => <Picture id={id} />}
        </PreviewGrid>
        <div className="preview-transport">Playground comparison</div>
      </section>,
    ),
  );
}

const rectangle = (element: Element) => {
  const { x, y, width, height } = element.getBoundingClientRect();
  return { x, y, width, height };
};
function snapshot() {
  return Object.fromEntries(
    ids.flatMap((id) => {
      const picture = document.querySelector<HTMLElement>(
        `[data-preview-root="${id}"]`,
      );
      if (!picture) return [];
      const style = getComputedStyle(picture);
      const transform = new DOMMatrixReadOnly(style.transform);
      return [
        [
          id,
          {
            cell: rectangle(picture.closest(".preview-cell")!),
            picture: rectangle(picture),
            opacity: Number(style.opacity),
            scale: transform.a,
          },
        ],
      ];
    }),
  );
}
type Frame = ReturnType<typeof snapshot>;
type Sample = { elapsed: number; frames: Frame };

async function record(start: number, duration = 420) {
  const samples: Sample[] = [];
  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = performance.now() - start;
      samples.push({ elapsed, frames: snapshot() });
      if (elapsed >= duration) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  return samples;
}

function ease(t: number) {
  // Solve x of cubic-bezier(.5,0,0,1), independently of the animation library.
  let lo = 0,
    hi = 1;
  for (let iteration = 0; iteration < 25; iteration++) {
    const u = (lo + hi) / 2;
    const x = 1.5 * (1 - u) ** 2 * u + u ** 3;
    if (x < t) lo = u;
    else hi = u;
  }
  const u = (lo + hi) / 2;
  return 3 * (1 - u) * u * u + u ** 3;
}

async function checkAddition(count: number) {
  const before = snapshot();
  const retained = ids.slice(0, count - 1).map((id) => ({
    id,
    picture: document.querySelector(`[data-preview-root="${id}"]`),
    canvas: document.querySelector(`[data-preview-root="${id}"] canvas`),
  }));
  const start = performance.now();
  render(count);
  const initial = snapshot();
  const added = ids[count - 1];
  assert(
    initial[added].opacity < 0.02,
    `${count}: entry must start transparent`,
  );
  assert(
    Math.abs(initial[added].scale - 0.6) < 0.02,
    `${count}: entry must start at 60% scale`,
  );
  const samples = await record(start);
  const end = snapshot();
  (window as any).previewGridLastCheck = {
    count,
    before,
    initial,
    samples,
    end,
  };
  for (const { id, picture, canvas } of retained) {
    assert(
      document.querySelector(`[data-preview-root="${id}"]`) === picture,
      `${count}: retained picture ${id} remounted`,
    );
    assert(
      document.querySelector(`[data-preview-root="${id}"] canvas`) === canvas,
      `${count}: retained canvas ${id} remounted`,
    );
    for (const key of ["x", "y", "width", "height"] as const) {
      const first = before[id].cell[key],
        last = end[id].cell[key];
      if (Math.abs(first - last) < 2) continue;
      assert(
        samples.some(({ frames }) => {
          const progress = (frames[id].cell[key] - first) / (last - first);
          return progress > 0.02 && progress < 0.98;
        }),
        `${count}: retained frame ${id} ${key} jumped directly to final position`,
      );
    }
  }
  const entryMidpoint = samples.reduce((best, sample) =>
    Math.abs(sample.elapsed - 150) < Math.abs(best.elapsed - 150)
      ? sample
      : best,
  );
  assert(
    Math.abs(
      entryMidpoint.frames[added].opacity - entryMidpoint.elapsed / 300,
    ) < 0.1,
    `${count}: entry opacity must fade linearly over 300ms`,
  );
  assert(
    Math.abs(
      entryMidpoint.frames[added].scale -
        (0.6 + 0.4 * ease(entryMidpoint.elapsed / 300)),
    ) < 0.04,
    `${count}: entry scale must retain the requested cubic easing over 300ms`,
  );
  const visible = samples.find(({ frames }) => frames[added].opacity >= 0.999);
  assert(
    visible && visible.elapsed >= 265 && visible.elapsed <= 355,
    `${count}: entry should complete within 300ms (plus animation-frame scheduling), got ${visible?.elapsed}`,
  );
  const layoutSettled = samples.find(({ frames }) =>
    retained.every(({ id }) =>
      (["x", "y", "width", "height"] as const).every(
        (key) => Math.abs(frames[id].cell[key] - end[id].cell[key]) < 0.5,
      ),
    ),
  );
  assert(
    layoutSettled && layoutSettled.elapsed <= 355,
    `${count}: retained frames must settle alongside entry within 300ms, got ${layoutSettled?.elapsed}`,
  );
  assert(
    end[added].opacity === 1 && Math.abs(end[added].scale - 1) < 0.001,
    `${count}: entry must settle fully visible at natural scale`,
  );
  const picture = document.querySelector(`[data-preview-root="${added}"]`)!;
  const pictureStyle = getComputedStyle(picture);
  const stroke = getComputedStyle(picture, "::after");
  assert(
    pictureStyle.borderRadius === "2px" &&
      pictureStyle.overflow === "hidden" &&
      stroke.borderRadius === "2px",
    `${count}: preview and stroke must share clipped 2px corners`,
  );
  assert(
    stroke.borderTopWidth === "1px" &&
      stroke.borderTopStyle === "solid" &&
      stroke.borderTopColor === "rgb(232, 232, 232)" &&
      stroke.pointerEvents === "none" &&
      pictureStyle.borderTopWidth === "0px",
    `${count}: subtle stroke must overlay the preview without affecting layout or input`,
  );
  if (count === 3) {
    const grid = rectangle(document.querySelector(".preview-grid")!);
    const third = end.c.cell;
    assert(
      Math.abs(third.x + third.width / 2 - grid.x - grid.width / 2) < 1,
      "Third preview must be centered on its second row",
    );
  }
  return {
    count,
    completedAt: visible!.elapsed,
    layoutCompletedAt: layoutSettled!.elapsed,
    retainedNodes: retained.length,
    midpoint: entryMidpoint,
    before,
    end,
  };
}

async function checkRapidRetarget() {
  render(1);
  await wait(350);
  render(2);
  await wait(75);
  const before = snapshot();
  const canvas = document.querySelector('[data-preview-root="a"] canvas');
  render(3);
  const samples = await record(performance.now());
  const after = samples[0].frames;
  // Retargeting must continue from current pixels rather than jumping back to
  // the old endpoint; allow one frame of movement along the new trajectory.
  const end = snapshot();
  for (const key of ["x", "y", "width", "height"] as const) {
    const span = Math.abs(end.a.cell[key] - before.a.cell[key]);
    assert(
      Math.abs(after.a.cell[key] - before.a.cell[key]) <
        Math.max(8, span * 0.25),
      `Rapid retarget unexpectedly jumped frame A's ${key}`,
    );
  }
  assert(
    canvas === document.querySelector('[data-preview-root="a"] canvas'),
    "Rapid selection must retain the existing renderer canvas",
  );
  assert(
    Object.values(end).every(
      (frame) => frame.opacity === 1 && Math.abs(frame.scale - 1) < 0.001,
    ),
    "Rapid selection must leave no partial entry transform",
  );
  return { from: before, firstRetargetFrame: after, end };
}

async function checkResponsiveSizing() {
  const host = document.getElementById("root")!;
  const results = [];
  for (const [width, height] of [
    [600, 760],
    [1060, 360],
  ]) {
    host.style.width = `${width}px`;
    host.style.height = `${height}px`;
    for (const count of [1, 2, 3, 4]) {
      render(count);
      await wait(350);
      await waitForSettledLayout();
      const frames = snapshot();
      const grid = rectangle(document.querySelector(".preview-grid")!);
      (window as any).previewGridLastCheck = {
        width,
        height,
        count,
        frames,
        grid,
      };
      for (const [id, frame] of Object.entries(frames)) {
        assert(
          Math.abs(frame.picture.width / frame.picture.height - 16 / 9) < 0.01,
          `${width}x${height}/${count}: frame ${id} must retain its aspect ratio`,
        );
        assert(
          frame.picture.x >= grid.x - 1 &&
            frame.picture.y >= grid.y - 1 &&
            frame.picture.x + frame.picture.width <= grid.x + grid.width + 1 &&
            frame.picture.y + frame.picture.height <= grid.y + grid.height + 1,
          `${width}x${height}/${count}: frame ${id} must fit within the grid`,
        );
      }
      results.push({ width, height, count, frames });
    }
  }
  host.style.removeProperty("width");
  host.style.removeProperty("height");
  return results;
}

async function waitForSettledLayout() {
  const deadline = performance.now() + 1000;
  let previous = "",
    stableFrames = 0;
  while (performance.now() < deadline) {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    const settled = Array.from(
      document.querySelectorAll(".preview-cell, .preview-picture"),
    ).every((element) => {
      const style = getComputedStyle(element);
      return (
        Number(style.opacity) === 1 &&
        new DOMMatrixReadOnly(style.transform).isIdentity
      );
    });
    const current = JSON.stringify(snapshot());
    stableFrames = settled && current === previous ? stableFrames + 1 : 0;
    if (stableFrames >= 2) return;
    previous = current;
  }
  throw new Error("Responsive preview layout did not settle within one second");
}

async function run() {
  render(1);
  await wait(360);
  const additions = [];
  for (const count of [2, 3, 4]) additions.push(await checkAddition(count));
  const rapid = await checkRapidRetarget();
  render(2);
  await wait(350);
  assert(
    Object.keys(snapshot()).length === 2,
    "Deselection should remove extra preview windows",
  );
  const responsive = await checkResponsiveSizing();
  return { passed: true, additions, rapid, deselection: true, responsive };
}

async function reducedMotion() {
  assert(
    matchMedia("(prefers-reduced-motion: reduce)").matches,
    "Reduced motion must be emulated",
  );
  render(1);
  await wait(80);
  render(2);
  await wait(60);
  const frames = snapshot();
  assert(
    frames.b.opacity === 1 && Math.abs(frames.b.scale - 1) < 0.001,
    "Reduced motion must skip entry transforms",
  );
  const before = JSON.stringify(frames);
  await wait(80);
  assert(
    JSON.stringify(snapshot()) === before,
    "Reduced motion must settle without layout tweening",
  );
  return { passed: true, reducedMotion: true, frames };
}

(window as any).previewGridHarness = { render, snapshot, run, reducedMotion };
