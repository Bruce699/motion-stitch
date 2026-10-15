import assert from "node:assert/strict";
import test from "node:test";
import {
  editorPanelSizes,
  isExpandedPanelSize,
  toggleEditorPanel,
  type EditorPanelId,
} from "../src/renderer/editor-panel-state";

function panelStub(pixels = 0, collapsed = true) {
  const actions: (string | number)[] = [];
  return {
    actions,
    collapse: () => {
      actions.push("collapse");
    },
    expand: () => {
      actions.push("expand");
    },
    resize: (size: number | string) => {
      actions.push(size);
    },
    isCollapsed: () => collapsed,
    getSize: () => ({ inPixels: pixels, asPercentage: 0 }),
  };
}

test("collapsed panels recover from unusable remembered widths", () => {
  for (const id of Object.keys(editorPanelSizes) as EditorPanelId[]) {
    for (const value of [null, "0", "1", "60", "NaN", "Infinity", "-20"]) {
      const panel = panelStub();
      toggleEditorPanel(panel, id, () => value);
      assert.deepEqual(panel.actions, [editorPanelSizes[id].defaultSize]);
    }
  }
});

test("reopening preserves valid widths and corrects pixel rounding", () => {
  const panel = panelStub();
  toggleEditorPanel(panel, "inspector", () => "380");
  toggleEditorPanel(panel, "inspector", () => "239");
  assert.deepEqual(panel.actions, [380, 240]);
  assert.equal(isExpandedPanelSize("inspector", 1), false);
  assert.equal(isExpandedPanelSize("inspector", 120), false);
  assert.equal(isExpandedPanelSize("timeline", 48), false);
  assert.equal(isExpandedPanelSize("inspector", 239), true);
});

test("unavailable storage and rounded collapsed layouts still reopen", () => {
  const unavailableStorage = () => {
    throw new Error("Storage unavailable");
  };
  const panel = panelStub(1, false);
  toggleEditorPanel(panel, "inspector", unavailableStorage);
  assert.deepEqual(panel.actions, [304]);
  const timeline = panelStub(49, false);
  toggleEditorPanel(timeline, "timeline", unavailableStorage);
  assert.deepEqual(timeline.actions, [180]);
});

test("expanded panels collapse normally", () => {
  const panel = panelStub(304, false);
  toggleEditorPanel(panel, "inspector");
  assert.deepEqual(panel.actions, ["collapse"]);
  assert.doesNotThrow(() => toggleEditorPanel(null, "inspector"));
});
