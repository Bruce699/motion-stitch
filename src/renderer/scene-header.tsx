import { FRAME_RATES } from "../core/schema";
import { Icon } from "./icons";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SceneDocument } from "../core/schema";
import { NumberValue, ColorValue } from "./parameters";
import {
  CANVAS_PRESETS,
  MAX_CANVAS_EDGE,
  MAX_CANVAS_PIXELS,
  captureQuality,
  type SourceQuality,
} from "../core/quality";

export function SceneHeader({
  scene,
  disabled,
  onSetting,
  sourceQuality,
}: {
  scene: SceneDocument;
  disabled: boolean;
  onSetting: (
    key: string,
    value: string | number | { width: number; height: number },
  ) => Promise<unknown>;
  sourceQuality: SourceQuality[];
}) {
  const [sizeAttempt, setSizeAttempt] = useState(0);
  const saveDimension = async (key: "width" | "height", value: number) => {
    await onSetting(key, value);
    setSizeAttempt((n) => n + 1);
  };
  const preset = CANVAS_PRESETS.find(
    (p) => p.width === scene.size.width && p.height === scene.size.height,
  );
  const qualities = scene.sources.map(
    (source) =>
      sourceQuality.find((q) => q.sourceId === source.id) ??
      captureQuality(scene.size, source, scene.capture),
  );
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
          aria-label="Composition name"
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
        aria-label="Composition settings"
        title="Composition settings"
        aria-expanded={open}
        aria-controls="scene-settings"
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <Icon name="chevron" size={16} />
      </button>
      {open && (
        <div
          ref={panel}
          id="scene-settings"
          data-dialkit-popover-root
          className="ui-popover settings-popover"
          role="dialog"
          aria-label="Composition settings"
          onBlur={(e) => {
            if (
              e.relatedTarget &&
              !container.current?.contains(e.relatedTarget as Node)
            )
              setOpen(false);
          }}
        >
          <label className="field canvas-preset">
            <span>Canvas</span>
            <select
              aria-label="Canvas resolution"
              value={preset?.label ?? "custom"}
              onChange={(e) => {
                const p = CANVAS_PRESETS.find(
                  (p) => p.label === e.target.value,
                );
                if (p)
                  void onSetting("size", { width: p.width, height: p.height });
              }}
            >
              {!preset && <option value="custom">Custom</option>}
              {CANVAS_PRESETS.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label} · {p.width} × {p.height}
                </option>
              ))}
            </select>
          </label>
          <div className="field-pair">
            {(["width", "height"] as const).map((key) => (
              <label className="field" key={key}>
                <span>{key === "width" ? "Width" : "Height"}</span>
                <div className="input-unit">
                  <NumberValue
                    key={`${sizeAttempt}:${scene.size[key]}`}
                    label={`Canvas ${key}`}
                    value={scene.size[key]}
                    min={64}
                    max={Math.min(
                      MAX_CANVAS_EDGE,
                      2 *
                        Math.floor(
                          MAX_CANVAS_PIXELS /
                            scene.size[key === "width" ? "height" : "width"] /
                            2,
                        ),
                    )}
                    step={2}
                    onCommit={(value) => void saveDimension(key, value)}
                  />
                  <span>px</span>
                </div>
              </label>
            ))}
          </div>
          <label className="field density-field">
            <span>UI density</span>
            <select
              aria-label="UI density"
              title="Raster pixels per CSS pixel. Auto follows canvas resolution; choose a higher density for authored close-ups. Layout stays unchanged."
              value={scene.capture?.density ?? "auto"}
              onChange={(e) =>
                void onSetting(
                  "density",
                  e.target.value === "auto" ? "auto" : Number(e.target.value),
                )
              }
            >
              <option value="auto">Auto</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n}×
                </option>
              ))}
            </select>
          </label>
          <div className="capture-sizes" aria-label="UI capture resolution">
            {qualities.map((q, i) => {
              const exported = captureQuality(
                scene.size,
                scene.sources[i],
                scene.capture,
              );
              const differs = exported.density !== q.density;
              return (
                <div key={q.sourceId}>
                  <output>
                    {qualities.length > 1 ? `${q.sourceId}: ` : ""}
                    {differs ? "Preview · " : ""}
                    {q.width} × {q.height} · {q.density}×
                    {q.limited ? " · limit reached" : ""}
                  </output>
                  {differs && (
                    <output>
                      Export · {exported.width} × {exported.height} ·{" "}
                      {exported.density}×
                      {exported.limited ? " · limit reached" : ""}
                    </output>
                  )}
                </div>
              );
            })}
          </div>
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
                {FRAME_RATES.map((fps) => (
                  <option key={fps} value={fps}>
                    {fps} fps
                  </option>
                ))}
              </select>
            </label>
          </div>
          <ColorValue
            label="Background"
            sceneId={scene.id}
            value={scene.background}
            onCommit={(value) => void onSetting("background", value)}
          />
        </div>
      )}
    </div>
  );
}
