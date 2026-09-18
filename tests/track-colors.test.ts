import { test } from "node:test";
import assert from "node:assert/strict";
import { timelineColor } from "../src/renderer/timeline-colors";

test("children follow group hue regardless of saved color or array order", () => {
  const tracks = [
    { id: "child", parentId: "group", color: "#ff6600" },
    { id: "sibling", parentId: "group", color: "#047efe" },
    { id: "group", color: "#00bca6" },
    { id: "nested", parentId: "child", color: "#ff2796" },
    { id: "camera", color: "#8c51fe" },
  ];
  const before = structuredClone(tracks);
  const child = timelineColor(tracks[0], tracks);
  assert.match(child, /#00bca6/);
  assert.equal(child, timelineColor(tracks[1], tracks));
  assert.equal(child, timelineColor(tracks[0], [...tracks].reverse()));
  assert.notEqual(child, timelineColor(tracks[3], tracks));
  assert.equal(timelineColor(tracks[4], tracks), "#8c51fe");
  assert.equal(timelineColor({ ...tracks[0], parentId: undefined }, tracks), "#ff6600");
  assert.deepEqual(tracks, before);
});
