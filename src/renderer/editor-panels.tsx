import React, { useCallback, useEffect, useRef } from "react";
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  type PanelImperativeHandle,
  type PanelSize,
} from "react-resizable-panels";

export function toggleEditorPanel(
  panel: PanelImperativeHandle | null,
  id: string,
) {
  if (!panel) return;
  if (panel.isCollapsed()) {
    let size = 0;
    try {
      size = Number(localStorage.getItem(`tilt-panel-expanded-${id}`));
    } catch {}
    if (Number.isFinite(size) && size > 0) panel.resize(size);
    else panel.expand();
  } else panel.collapse();
}
/** Keep synchronous storage off the live-resize path; flush before leaving. */
function useSettledSave<T extends unknown[]>(save: (...args: T) => void) {
  const latest = useRef(save);
  latest.current = save;
  const pending = useRef<T | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    const args = pending.current;
    pending.current = null;
    if (args) latest.current(...args);
  }, []);
  const schedule = useCallback(
    (...args: T) => {
      pending.current = args;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 150);
    },
    [flush],
  );
  useEffect(() => {
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);
  return { schedule, flush };
}

function usePanelMemory(control: PanelControl, id: string, collapsed = 0) {
  const save = useSettledSave((pixels: number) => {
    try {
      localStorage.setItem(`tilt-panel-expanded-${id}`, String(pixels));
    } catch {}
  });
  return (size: PanelSize) => {
    const open = size.inPixels > collapsed;
    if (open !== control.open) control.onOpen(open);
    if (open) save.schedule(size.inPixels);
    // Preserve the last expanded size even if collapse precedes the debounce.
    else save.flush();
  };
}

type PanelControl = {
  ref: React.RefObject<PanelImperativeHandle | null>;
  open: boolean;
  onOpen: (open: boolean) => void;
};

/** Keep the canvas mounted when panels collapse; layout is inspection state. */
export function EditorPanels({
  project,
  header,
  workspace,
  timeline,
  inspector,
  left,
  right,
  bottom,
}: {
  project: React.ReactNode;
  header: React.ReactNode;
  workspace: React.ReactNode;
  timeline: React.ReactNode;
  inspector: React.ReactNode;
  left: PanelControl;
  right: PanelControl;
  bottom: PanelControl;
}) {
  const horizontal = useDefaultLayout({
    id: "tilt-editor-columns-v2",
  });
  const viewer = useDefaultLayout({
    id: "tilt-viewer-columns",
  });
  const vertical = useDefaultLayout({
    id: "tilt-editor-rows-v2",
  });
  const saveHorizontal = useSettledSave(horizontal.onLayoutChanged);
  const saveViewer = useSettledSave(viewer.onLayoutChanged);
  const saveVertical = useSettledSave(vertical.onLayoutChanged);
  const rememberLeft = usePanelMemory(left, "compositions");
  const rememberRight = usePanelMemory(right, "inspector");
  const rememberBottom = usePanelMemory(bottom, "timeline", 49);
  return (
    <div className="editor-main">
      {header}
      <Group
        orientation="horizontal"
        className="editor-panels"
        defaultLayout={horizontal.defaultLayout}
        onLayoutChanged={saveHorizontal.schedule}
      >
        <Panel id="editor" minSize={540}>
          <Group
            orientation="vertical"
            className="editor-rows"
            defaultLayout={vertical.defaultLayout}
            onLayoutChanged={saveVertical.schedule}
          >
            <Panel id="canvas" minSize={180}>
              <Group
                orientation="horizontal"
                className="viewer-panels"
                defaultLayout={viewer.defaultLayout}
                onLayoutChanged={saveViewer.schedule}
              >
                <Panel
                  id="compositions"
                  panelRef={left.ref}
                  defaultSize={190}
                  minSize={150}
                  maxSize={280}
                  collapsible
                  groupResizeBehavior="preserve-pixel-size"
                  onResize={rememberLeft}
                >
                  <div
                    className="panel-content"
                    inert={!left.open}
                    aria-hidden={!left.open}
                  >
                    {project}
                  </div>
                </Panel>
                <Separator
                  className="resize-handle resize-sidebar"
                  aria-label="Resize compositions"
                />
                <Panel id="viewer" minSize={300}>
                  {workspace}
                </Panel>
              </Group>
            </Panel>
            <Separator
              className="resize-handle resize-timeline"
              aria-label="Resize timeline"
            />
            <Panel
              id="timeline"
              panelRef={bottom.ref}
              defaultSize={180}
              minSize={100}
              maxSize="65%"
              collapsible
              collapsedSize={48}
              groupResizeBehavior="preserve-pixel-size"
              onResize={rememberBottom}
            >
              {timeline}
            </Panel>
          </Group>
        </Panel>
        <Separator
          className="resize-handle resize-sidebar"
          aria-label="Resize inspector"
        />
        <Panel
          id="inspector"
          panelRef={right.ref}
          defaultSize={304}
          minSize={240}
          maxSize="45%"
          collapsible
          groupResizeBehavior="preserve-pixel-size"
          onResize={rememberRight}
        >
          <div
            className="panel-content"
            inert={!right.open}
            aria-hidden={!right.open}
          >
            {inspector}
          </div>
        </Panel>
      </Group>
    </div>
  );
}
