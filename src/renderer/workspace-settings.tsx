import React from "react";
import * as Popover from "@radix-ui/react-popover";
import { Slider } from "./vendor/dialkit/components/Slider";
import { Icon } from "./icons";
import type { WorkspaceUI } from "../core/workspace-display";

const frameControls = [
  { key: "previewPaddingTop", label: "Above frame", min: 0, max: 120 },
  { key: "previewPaddingBottom", label: "Below frame", min: 0, max: 120 },
  { key: "previewPaddingX", label: "Side padding", min: 0, max: 120 },
] as const;
const playbackControls = [
  { key: "previewTransportHeight", label: "Row height", min: 32, max: 120 },
  { key: "previewTransportGap", label: "Control spacing", min: 0, max: 32 },
  { key: "previewTransportPaddingX", label: "Side inset", min: 0, max: 120 },
  {
    key: "previewTransportMaxWidth",
    label: "Maximum width",
    min: 320,
    max: 1600,
  },
] as const;
const hoverControls = [
  {
    key: "hoverPreviewWidth",
    label: "Frame width",
    min: 80,
    max: 480,
    unit: "px",
  },
  {
    key: "hoverPreviewHeight",
    label: "Frame height",
    min: 45,
    max: 320,
    unit: "px",
  },
  {
    key: "hoverPreviewGap",
    label: "Frame spacing",
    min: 0,
    max: 32,
    unit: "px",
  },
  {
    key: "hoverPreviewOffset",
    label: "Above clip",
    min: 0,
    max: 80,
    unit: "px",
  },
  {
    key: "hoverPreviewRadius",
    label: "Frame corners",
    min: 0,
    max: 32,
    unit: "px",
  },
  {
    key: "hoverPreviewPadding",
    label: "Window padding",
    min: 0,
    max: 24,
    unit: "px",
  },
  {
    key: "hoverPreviewOuterRadius",
    label: "Window corners",
    min: 0,
    max: 40,
    unit: "px",
  },
  { key: "hoverPreviewFPS", label: "Frame rate", min: 4, max: 24, unit: "fps" },
  {
    key: "hoverPreviewDelay",
    label: "Hover delay",
    min: 0,
    max: 800,
    unit: "ms",
  },
] as const;

type SettingsProps = {
  onOpenChange?: (open: boolean) => void;
  ui: WorkspaceUI;
  showPreviewSpacing: boolean;
  onPreview: (key: keyof WorkspaceUI, value: number) => void;
  onCommit: () => void;
  onReset: () => void;
  onResetStage: () => void;
  onResetHover: () => void;
};

export function WorkspaceSettings({
  onOpenChange,
  ui,
  showPreviewSpacing,
  onPreview,
  onCommit,
  onReset,
  onResetStage,
  onResetHover,
}: SettingsProps) {
  return (
    <Popover.Root
      modal={false}
      onOpenChange={(open) => {
        if (!open) onCommit();
        onOpenChange?.(open);
      }}
    >
      <Popover.Trigger asChild>
        <button
          className="ui-button preview-dialkit-trigger"
          aria-label="Dial Kit"
          title="Workspace settings"
        >
          <Icon name="settings" size={18} />
          <span>Dial Kit</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="ui-popover workspace-settings dialkit-root tilt-ui"
          sideOffset={10}
          align="end"
          collisionPadding={12}
          aria-label="Workspace Dial Kit"
          data-transport-keys="ignore"
          data-dialkit-popover-root
        >
          <div className="workspace-settings-heading">
            <span>Dial Kit</span>
            <Popover.Close
              className="ui-button icon-button"
              aria-label="Close Dial Kit"
            >
              <Icon name="close" />
            </Popover.Close>
          </div>
          <details open>
            <summary>View pill</summary>
            <div className="workspace-settings-controls">
              <Slider
                label="Font size"
                value={ui.switchFontSize}
                min={10}
                max={24}
                step={1}
                unit="px"
                onChange={(value) => onPreview("switchFontSize", value)}
                onInteractionEnd={onCommit}
              />
              <Slider
                label="Horizontal padding"
                value={ui.switchPaddingX}
                min={6}
                max={40}
                step={1}
                unit="px"
                onChange={(value) => onPreview("switchPaddingX", value)}
                onInteractionEnd={onCommit}
              />
              <Slider
                label="Vertical padding"
                value={ui.switchPaddingY}
                min={4}
                max={20}
                step={1}
                unit="px"
                onChange={(value) => onPreview("switchPaddingY", value)}
                onInteractionEnd={onCommit}
              />
            </div>
          </details>
          {showPreviewSpacing && (
            <>
              <details open>
                <summary>Hover previews</summary>
                <div className="workspace-settings-controls">
                  {hoverControls.map(({ key, label, min, max, unit }) => (
                    <Slider
                      key={key}
                      label={label}
                      value={ui[key]}
                      min={min}
                      max={max}
                      step={1}
                      unit={unit}
                      onChange={(value) => onPreview(key, value)}
                      onInteractionEnd={onCommit}
                    />
                  ))}
                </div>
                <button
                  className="ui-button workspace-settings-reset"
                  onClick={onResetHover}
                >
                  Reset hover previews
                </button>
              </details>
              <details open>
                <summary>Play stage</summary>
                <div className="workspace-settings-controls">
                  {frameControls.map(({ key, label, min, max }) => (
                    <Slider
                      key={key}
                      label={label}
                      value={ui[key]}
                      min={min}
                      max={max}
                      step={1}
                      unit="px"
                      onChange={(value) => onPreview(key, value)}
                      onInteractionEnd={onCommit}
                    />
                  ))}
                </div>
              </details>
              <details>
                <summary>Playback controls</summary>
                <div className="workspace-settings-controls">
                  {playbackControls.map(({ key, label, min, max }) => (
                    <Slider
                      key={key}
                      label={label}
                      value={ui[key]}
                      min={min}
                      max={max}
                      step={1}
                      unit="px"
                      onChange={(value) => onPreview(key, value)}
                      onInteractionEnd={onCommit}
                    />
                  ))}
                </div>
              </details>
              <button
                className="ui-button workspace-settings-reset"
                onClick={onResetStage}
              >
                Reset stage spacing
              </button>
              <details>
                <summary>Preview spacing</summary>
                <div className="workspace-settings-controls">
                  <Slider
                    label="Horizontal gap"
                    value={ui.previewColumnGap}
                    min={0}
                    max={120}
                    step={1}
                    unit="px"
                    onChange={(value) => onPreview("previewColumnGap", value)}
                    onInteractionEnd={onCommit}
                  />
                  <Slider
                    label="Vertical gap"
                    value={ui.previewRowGap}
                    min={0}
                    max={120}
                    step={1}
                    unit="px"
                    onChange={(value) => onPreview("previewRowGap", value)}
                    onInteractionEnd={onCommit}
                  />
                </div>
                <button
                  className="ui-button workspace-settings-reset"
                  onClick={onReset}
                >
                  Reset preview spacing
                </button>
              </details>
            </>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
