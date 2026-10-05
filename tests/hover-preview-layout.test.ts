import test from "node:test";
import assert from "node:assert/strict";
import {
  computeHoverPreviewLayout,
  type HoverPreviewLayoutInput,
} from "../src/core/hover-preview-layout";

const base: HoverPreviewLayoutInput = {
  anchor: { left: 180, top: 460, width: 220, height: 32 },
  viewport: { width: 1200, height: 800 },
  count: 1,
  frameWidth: 240,
  frameHeight: 135,
  gap: 8,
  offset: 12,
  padding: 4,
};

test("a single preview floats above and aligns with the clip's left edge", () => {
  assert.deepEqual(computeHoverPreviewLayout(base), {
    left: 180,
    top: 305,
    width: 248,
    height: 143,
    frameWidth: 240,
    frameHeight: 135,
    gap: 8,
    padding: 4,
  });
});

test("connected previews share one side-by-side row anchored to the head", () => {
  const layout = computeHoverPreviewLayout({ ...base, count: 2 })!;
  assert.equal(layout.left, base.anchor.left);
  assert.equal(layout.width, 496);
  assert.equal(layout.height, 143);
  assert.equal(layout.frameWidth, 240);
  assert.equal(layout.gap, 8);
});

test("a long sequence uniformly shrinks into a phone viewport", () => {
  const layout = computeHoverPreviewLayout({
    ...base,
    viewport: { width: 390, height: 844 },
    count: 6,
  })!;
  assert.equal(layout.left, 8);
  assert.equal(layout.width, 374);
  assert.equal(layout.left + layout.width, 382);
  assert.ok(Math.abs(layout.frameWidth / layout.frameHeight - 16 / 9) < 1e-12);
  assert.equal(layout.gap / layout.padding, 2);
  assert.ok(
    Math.abs(
      layout.frameWidth * 6 +
        layout.gap * 5 +
        layout.padding * 2 -
        layout.width,
    ) < 1e-12,
  );
});

test("the row flips below a clip when there is insufficient room above", () => {
  const layout = computeHoverPreviewLayout({
    ...base,
    anchor: { ...base.anchor, top: 30 },
  })!;
  assert.equal(layout.top, 74);
});

test("right-edge and vertically constrained rows remain within viewport margins", () => {
  const layout = computeHoverPreviewLayout({
    ...base,
    anchor: { left: 370, top: 30, width: 20, height: 32 },
    viewport: { width: 390, height: 100 },
  })!;
  assert.ok(layout.left >= 8);
  assert.ok(layout.left + layout.width <= 382);
  assert.equal(layout.top, 8);
  assert.equal(layout.height, 84);
  assert.ok(Math.abs(layout.frameWidth / layout.frameHeight - 16 / 9) < 1e-12);
});

test("an offscreen head still anchors a visible connected tail unless hiding is requested", () => {
  const input = { ...base, anchor: { ...base.anchor, left: -300 } };
  assert.equal(computeHoverPreviewLayout(input)?.left, 8);
  assert.equal(
    computeHoverPreviewLayout({ ...input, hideOffscreenAnchor: true }),
    null,
  );
  assert.ok(
    computeHoverPreviewLayout({
      ...input,
      anchor: { ...input.anchor, left: -100 },
      hideOffscreenAnchor: true,
    }),
  );
});

test("empty or invalid geometry produces no floating row", () => {
  assert.equal(computeHoverPreviewLayout({ ...base, count: 0 }), null);
  assert.equal(computeHoverPreviewLayout({ ...base, count: Number.NaN }), null);
  assert.equal(computeHoverPreviewLayout({ ...base, frameWidth: 0 }), null);
  assert.equal(
    computeHoverPreviewLayout({
      ...base,
      viewport: { width: 16, height: 100 },
    }),
    null,
  );
});
