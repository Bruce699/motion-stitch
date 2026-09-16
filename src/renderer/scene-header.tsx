import { Icon } from "./icons";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SceneDocument } from "../core/schema";
import { NumberValue, ColorValue } from "./parameters";

export function SceneHeader({
  scene,
  disabled,
  onSetting,
}: {
  scene: SceneDocument;
  disabled: boolean;
  onSetting: (key: string, value: string | number) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false),
    [draft, setDraft] = useState(scene.name),
    [open, setOpen] = useState(false);
  const title = useRef<HTMLInputElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    container = useRef<HTMLDivElement>(null),
    panel = useRef<HTMLDivElement>(null);
  const cancelled = useRef(false),
    saving = useRef(false);
  useEffect(() => {
    if (!editing) setDraft(scene.name);
  }, [scene.name, editing]);
  useEffect(() => {
    if (editing) title.current?.select();
  }, [editing]);
  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      if (!trigger.current || !panel.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      const width = panel.current.offsetWidth;
      panel.current.style.left = `${Math.max(8, Math.min(anchor.right - width, window.innerWidth - width - 8))}px`;
      panel.current.style.top = `${anchor.bottom + 6}px`;
    };
    position();
    window.addEventListener("resize", position);
    return () => window.removeEventListener("resize", position);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLInputElement>("input")?.focus();
    const outside = (e: PointerEvent) => {
      if (!container.current?.contains(e.target as Node)) {
        if (panel.current?.contains(document.activeElement))
          (document.activeElement as HTMLElement).blur();
        setOpen(false);
      }
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const start = () => {
    if (disabled) return;
    setOpen(false);
    setDraft(scene.name);
    cancelled.current = false;
    setEditing(true);
  };
  const save = async () => {
    if (saving.current || cancelled.current) return;
    const name = draft.trim();
    if (!name || name === scene.name) {
      setEditing(false);
      return;
    }
    saving.current = true;
    try {
      if (await onSetting("name", name)) setEditing(false);
    } finally {
      saving.current = false;
    }
  };
  return (
    <div className="document-title" ref={container}>
      {editing ? (
        <input
          ref={title}
          className="ui-input title-input"
          aria-label="Scene name"
          maxLength={100}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void save()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void save();
            }
            if (e.key === "Escape") {
              e.stopPropagation();
              cancelled.current = true;
              setEditing(false);
            }
          }}
        />
      ) : (
        <button
          className="ui-button title-name"
          data-variant="ghost"
          data-size="toolbar"
          title="Double-click to rename"
          aria-label={`Rename ${scene.name}`}
          onDoubleClick={start}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "F2") {
              e.preventDefault();
              start();
            }
          }}
        >
          {scene.name}
        </button>
      )}
      <button
        ref={trigger}
        className="ui-button icon-button"
        data-variant="ghost"
        data-size="icon"
        aria-label="Scene settings"
        title="Scene settings"
        aria-expanded={open}
        aria-controls="scene-settings"
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <Icon name="settings" size={18} />
      </button>
      {open && (
        <div
          ref={panel}
          id="scene-settings"
          className="ui-popover settings-popover"
          role="dialog"
          aria-label="Scene settings"
          onBlur={(e) => {
            if (
              e.relatedTarget &&
              !container.current?.contains(e.relatedTarget as Node)
            )
              setOpen(false);
          }}
        >
          <div className="field-pair">
            <label className="field">
              <span>Duration</span>
              <div className="input-unit">
                <NumberValue
                  label="Duration"
                  value={scene.duration}
                  min={0.1}
                  max={600}
                  step={0.1}
                  onCommit={(value) => void onSetting("duration", value)}
                />
                <span>s</span>
              </div>
            </label>
            <label className="field">
              <span>Frame rate</span>
              <select
                aria-label="Frame rate"
                value={scene.fps}
                onChange={(e) => void onSetting("fps", Number(e.target.value))}
              >
                {[...new Set([24, 25, 30, 60, 120, scene.fps])]
                  .sort((a, b) => a - b)
                  .map((fps) => (
                    <option key={fps} value={fps}>
                      {fps} fps
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className="control-row">
            <span>Background</span>
            <ColorValue
              label="Background"
              value={scene.background}
              onCommit={(value) => void onSetting("background", value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
