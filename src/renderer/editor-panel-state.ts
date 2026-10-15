import type { PanelImperativeHandle } from "react-resizable-panels";

export const editorPanelSizes = {
  compositions: { defaultSize: 190, minSize: 150, collapsedSize: 0 },
  inspector: { defaultSize: 304, minSize: 240, collapsedSize: 0 },
  timeline: { defaultSize: 180, minSize: 100, collapsedSize: 48 },
} as const;

export type EditorPanelId = keyof typeof editorPanelSizes;

export function isExpandedPanelSize(id: EditorPanelId, pixels: number) {
  // Layout measurements round to whole pixels; ignore hidden/transient sizes.
  return Number.isFinite(pixels) && pixels >= editorPanelSizes[id].minSize - 1;
}

export function toggleEditorPanel(
  panel: PanelImperativeHandle | null,
  id: EditorPanelId,
  readSize = () => localStorage.getItem(`tilt-panel-expanded-${id}`),
) {
  if (!panel) return;
  const sizes = editorPanelSizes[id];
  if (
    panel.isCollapsed() ||
    panel.getSize().inPixels <= sizes.collapsedSize + 1
  ) {
    let saved = 0;
    try {
      saved = Number(readSize());
    } catch {}
    // A sub-minimum remembered width can snap straight back to collapsed.
    // Explicit defaults also recover a stale size remembered by the resize group.
    panel.resize(
      isExpandedPanelSize(id, saved)
        ? Math.max(sizes.minSize, saved)
        : sizes.defaultSize,
    );
  } else panel.collapse();
}
