import React from "react";
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  type PanelImperativeHandle,
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
function rememberPanel(
  control: PanelControl,
  id: string,
  pixels: number,
  open: boolean,
) {
  control.onOpen(open);
  if (open) {
    try {
      localStorage.setItem(`tilt-panel-expanded-${id}`, String(pixels));
    } catch {}
  }
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
  return (
    <div className="editor-main">
      {header}
      <Group
        orientation="horizontal"
        className="editor-panels"
        defaultLayout={horizontal.defaultLayout}
        onLayoutChanged={horizontal.onLayoutChanged}
      >
        <Panel id="editor" minSize={540}>
          <Group
            orientation="vertical"
            className="editor-rows"
            defaultLayout={vertical.defaultLayout}
            onLayoutChanged={vertical.onLayoutChanged}
          >
            <Panel id="canvas" minSize={180}>
              <Group
                orientation="horizontal"
                className="viewer-panels"
                defaultLayout={viewer.defaultLayout}
                onLayoutChanged={viewer.onLayoutChanged}
              >
                <Panel
                  id="compositions"
                  panelRef={left.ref}
                  defaultSize={190}
                  minSize={150}
                  maxSize={280}
                  collapsible
                  onResize={(size) =>
                    rememberPanel(
                      left,
                      "compositions",
                      size.inPixels,
                      size.inPixels > 0,
                    )
                  }
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
              onResize={(size) =>
                rememberPanel(
                  bottom,
                  "timeline",
                  size.inPixels,
                  size.inPixels > 49,
                )
              }
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
          onResize={(size) =>
            rememberPanel(right, "inspector", size.inPixels, size.inPixels > 0)
          }
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
