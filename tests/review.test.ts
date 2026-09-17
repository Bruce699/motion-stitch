import test from "node:test";
import assert from "node:assert/strict";
import {
  ReviewRequestSchema,
  detailRect,
  reviewTimes,
  reviewToolContent,
} from "../src/core/review";
import { parseCLI } from "../src/core/cli";
test("review validates bounded evidence and motion requests", () => {
  assert.throws(() =>
    ReviewRequestSchema.parse({ motion: { start: 0, end: 5 } }),
  );
  assert.throws(() => ReviewRequestSchema.parse({ times: [] }));
  assert.throws(() => ReviewRequestSchema.parse({ focus: ["../file"] }));
  assert.deepEqual(reviewTimes([2, 0, 2], 4, 60), [2, 0]);
  assert.throws(() => reviewTimes([5], 4, 60));
  assert.equal(
    parseCLI(["review", '{"times":[2,0]}', "--scene", "fixture"]).command?.type,
    "review",
  );
});
test("detail windows use the same native pixels even when a layer moves or leaves frame", () => {
  assert.equal(
    detailRect([{ x: -200, y: 0, width: 100, height: 100 }], 640, 360),
    null,
  );
  const rect = detailRect(
    [
      { x: 10, y: 30, width: 30, height: 30 },
      { x: 300, y: 30, width: 40, height: 40 },
    ],
    640,
    360,
  )!;
  assert.equal(rect.width, 378);
  assert.ok(rect.x <= 10 && rect.x + rect.width >= 340);
  assert.ok(rect.y >= 0 && rect.y + rect.height <= 360);
  assert.equal(
    detailRect([{ x: -100, y: -100, width: 2000, height: 2000 }], 1920, 1080)
      ?.width,
    960,
  );
});
test("MCP returns image content, not base64 hidden in JSON metadata", () => {
  const content = reviewToolContent({
    id: "a",
    inlineImages: [{ label: "Detail", mimeType: "image/png", data: "pixels" }],
  });
  assert.equal(content.length, 3);
  assert.deepEqual(content[2], {
    type: "image",
    mimeType: "image/png",
    data: "pixels",
  });
  assert.ok(!content[0].text!.includes("pixels"));
});
