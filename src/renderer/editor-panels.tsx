import React from "react";
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
} from "react-resizable-panels";

/** The same accessible resize primitive used by shadcn/ui, with Tilt's tokens. */
export function EditorPanels({
  header,
  workspace,
  timeline,
  inspector,
}: {
  header: React.ReactNode;
  workspace: React.ReactNode;
  timeline: React.ReactNode;
  inspector: React.ReactNode;
}) {
  const horizontal = useDefaultLayout({
    id: "tilt-editor-columns",
    onlySaveAfterUserInteractions: true,
  });
  const vertical = useDefaultLayout({
    id: "tilt-editor-rows",
    onlySaveAfterUserInteractions: true,
  });
  return (
    <Group
      orientation="horizontal"
      className="editor-panels"
      defaultLayout={horizontal.defaultLayout}
      onLayoutChanged={horizontal.onLayoutChanged}
    >
      <Panel id="editor" minSize={440}>
        <div className="editor-main">
          {header}
          <Group
            orientation="vertical"
            className="editor-rows"
            defaultLayout={vertical.defaultLayout}
            onLayoutChanged={vertical.onLayoutChanged}
          >
            <Panel id="canvas" minSize={180}>
              {workspace}
            </Panel>
            <Separator
              className="resize-handle resize-timeline"
              aria-label="Resize timeline"
            />
            <Panel id="timeline" defaultSize={250} minSize={130} maxSize="65%">
              {timeline}
            </Panel>
          </Group>
        </div>
      </Panel>
      <Separator
        className="resize-handle resize-sidebar"
        aria-label="Resize sidebar"
      />
      <Panel id="inspector" defaultSize={304} minSize={240} maxSize="45%">
        {inspector}
      </Panel>
    </Group>
  );
}
