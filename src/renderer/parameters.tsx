import { Icon } from "./icons";
import { CameraControls } from "./camera-controls";
import type { LensPreview } from "./camera-gesture";
import type { CameraSettings } from "../core/camera";
import type { SceneDocument } from "../core/schema";
import React, { useEffect, useRef, useState } from "react";
import {
  parameterGroups,
  type Parameter,
  type ParameterValue,
} from "../core/parameters";
import { call } from "./bridge";
import { queueControlEdit } from "./control-edits";
import { Slider } from "./vendor/dialkit/components/Slider";
import { Toggle } from "./vendor/dialkit/components/Toggle";
import { SelectControl } from "./vendor/dialkit/components/SelectControl";
import { SegmentedControl } from "./vendor/dialkit/components/SegmentedControl";
import { DialPad } from "./vendor/dialkit/components/DialPad";
import { ColorControl } from "./vendor/dialkit/components/ColorControl";
import { TextControl } from "./vendor/dialkit/components/TextControl";

export function NumberValue({
  label,
  value,
  min,
  max,
  step,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const editing = useRef(false),
    cancelled = useRef(false);
  useEffect(() => {
    if (!editing.current) setDraft(String(value));
  }, [value]);
  return (
    <input
      aria-label={label}
      type="number"
      min={min}
      max={max}
      step={step}
      value={draft}
      onFocus={() => {
        editing.current = true;
        cancelled.current = false;
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        editing.current = false;
        const next = Number(draft);
        if (
          !cancelled.current &&
          draft.trim() &&
          Number.isFinite(next) &&
          next >= min &&
          next <= max
        ) {
          if (next !== value) onCommit(next);
        } else setDraft(String(value));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          cancelled.current = true;
          setDraft(String(value));
          e.currentTarget.blur();
        }
      }}
    />
  );
}

export function ColorValue({
  label,
  value,
  sceneId,
  onCommit,
}: {
  label: string;
  value: string;
  sceneId: string;
  onCommit: (value: string) => void;
}) {
  const active = useRef(false);
  const group = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const enqueue = (operation: () => Promise<unknown>) => {
    void queueControlEdit(operation).catch((error) => setError(String(error)));
  };
  const begin = () => {
    if (active.current) return;
    active.current = true;
    setError(null);
    enqueue(async () => {
      const edit = await call({
        type: "edit_begin",
        sceneId,
        label,
        kind: "gesture",
        paths: ["scene.json"],
      });
      group.current = edit.id;
    });
  };
  const finish = () => {
    if (!active.current) return;
    active.current = false;
    enqueue(async () => {
      if (!group.current) return;
      await call({ type: "edit_apply", sceneId, id: group.current });
      group.current = null;
    });
  };
  useEffect(() => () => finish(), []);
  return (
    <>
      <ColorControl
        label={label}
        value={value}
        onChange={onCommit}
        onInteractionStart={begin}
        onInteractionEnd={finish}
      />
      {error && <span role="alert">{error}</span>}
    </>
  );
}

export function ParameterControl({
  name,
  parameter: p,
  sceneId,
  reportError,
  onValue,
  exposed,
  onExpose,
}: {
  name: string;
  exposed?: boolean;
  onExpose?: () => void;
  onValue?: (value: ParameterValue) => Promise<unknown>;
  parameter: Parameter;
  sceneId: string;
  reportError: (error: unknown) => void;
}) {
  const [draft, setDraft] = useState<ParameterValue>(p.value);
  const latest = useRef(p);
  latest.current = p;
  const active = useRef(false),
    pending = useRef(0),
    group = useRef<string | null>(null);
  useEffect(() => {
    if (!active.current && !pending.current) setDraft(p.value);
  }, [p.value]);
  const enqueue = (fn: () => Promise<unknown>) => {
    pending.current++;
    void queueControlEdit(fn)
      .catch((e) => {
        setDraft(latest.current.value);
        reportError(e);
      })
      .finally(() => {
        pending.current--;
      });
  };
  const change = (value: ParameterValue) => {
    setDraft(value);
    enqueue(() =>
      onValue
        ? onValue(value)
        : call({ type: "set_parameter", sceneId, key: name, value }),
    );
  };
  const begin = () => {
    if (active.current) return;
    active.current = true;
    enqueue(async () => {
      const edit = await call({
        type: "edit_begin",
        sceneId,
        label: p.label,
        kind: "gesture",
        paths: ["scene.json"],
      });
      group.current = edit.id;
    });
  };
  const finish = () => {
    if (!active.current) return;
    active.current = false;
    enqueue(async () => {
      if (group.current) {
        const id = group.current;
        await call({ type: "edit_apply", sceneId, id });
        group.current = null;
      }
    });
  };
  useEffect(() => () => finish(), []);
  const lifecycle = { onInteractionStart: begin, onInteractionEnd: finish };
  const content = (() => {
    if (p.type === "boolean")
      return (
        <Toggle label={p.label} checked={draft as boolean} onChange={change} />
      );
    if (p.type === "color")
      return (
        <ColorControl
          label={p.label}
          value={draft as string}
          onChange={change}
          {...lifecycle}
        />
      );
    if (p.type === "text")
      return (
        <TextControl
          label={p.label}
          value={draft as string}
          placeholder={p.placeholder}
          onChange={change}
          {...lifecycle}
        />
      );
    if (p.type === "select") {
      if (p.control === "segmented")
        return (
          <div className="dialkit-labeled-control parameter-segmented">
            <span className="dialkit-labeled-control-label">{p.label}</span>
            <SegmentedControl
              value={draft as string}
              options={p.options}
              onChange={change}
            />
          </div>
        );
      return (
        <SelectControl
          label={p.label}
          value={draft as string}
          options={p.options}
          onChange={change}
        />
      );
    }
    if (p.type === "pad") {
      const axis = (r: typeof p.x): [number, number, number, number] => [
        r.default ?? Math.max(r.min, Math.min(r.max, 0)),
        r.min,
        r.max,
        r.step,
      ];
      return (
        <DialPad
          label={p.label}
          value={draft as { x: number; y: number }}
          x={axis(p.x)}
          y={axis(p.y)}
          labels={p.labels}
          onChange={change}
          {...lifecycle}
        />
      );
    }
    if (p.type === "vector3")
      return (
        <div className="vector-parameter">
          <div className="vector-heading">
            {p.label}
            {p.unit && <span>{p.unit}</span>}
          </div>
          <div className="vector-control">
            {["X", "Y", "Z"].map((axis, i) => (
              <label key={axis}>
                <span>{axis}</span>
                <NumberValue
                  label={`${p.label} ${axis}`}
                  value={(draft as number[])[i]}
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  onCommit={(value) => {
                    const next = [...(draft as [number, number, number])] as [
                      number,
                      number,
                      number,
                    ];
                    next[i] = value;
                    change(next);
                  }}
                />
              </label>
            ))}
          </div>
        </div>
      );
    if (p.control === "number")
      return (
        <label className="dialkit-labeled-control number-control">
          <span className="dialkit-labeled-control-label">{p.label}</span>
          <span className="number-value">
            <NumberValue
              label={p.label + " value"}
              value={draft as number}
              min={p.min}
              max={p.max}
              step={p.step}
              onCommit={change}
            />
            {p.unit && <span>{p.unit}</span>}
          </span>
        </label>
      );
    return (
      <Slider
        label={p.label}
        value={draft as number}
        min={p.min}
        max={p.max}
        step={p.step}
        unit={p.unit}
        onChange={change}
        {...lifecycle}
      />
    );
  })();
  return (
    <div className="parameter-control">
      {content}
      {onExpose && (
        <button
          className="expose-control"
          aria-label={`${exposed ? "Stop exposing" : "Expose"} ${p.label}`}
          aria-pressed={exposed}
          onClick={onExpose}
        >
          {exposed ? "Exposed" : "Expose"}
        </button>
      )}
    </div>
  );
}

export function ParameterPanel({
  mode,
  parameters,
  tracks,
  selectedId,
  duration,
  fps,
  onDeselect,
  camera,
  cameraId,
  cameraGizmo,
  lensPreview,
  sources,
  sceneId,
  reportError,
  disabled,
  exposedParameters,
}: {
  mode: "source" | "camera";
  exposedParameters?: string[];
  parameters: Record<string, Parameter>;
  tracks: SceneDocument["tracks"];
  selectedId?: string;
  duration: number;
  fps: number;
  onDeselect: () => void;
  camera?: CameraSettings;
  cameraId?: string;
  cameraGizmo?: React.ReactNode;
  lensPreview?: LensPreview;
  sources: SceneDocument["sources"];
  sceneId: string;
  reportError: (error: unknown) => void;
  disabled: boolean;
}) {
  const selected = tracks.find((track) => track.id === selectedId);
  const parent = tracks.find((track) => track.id === selected?.parentId);
  const contextualKeys = new Set(
    tracks.flatMap((track) => track.parameterKeys),
  );
  const groups = parameterGroups(
    Object.fromEntries(
      Object.entries(parameters).filter(
        ([key, parameter]) =>
          !contextualKeys.has(key) &&
          (mode === "camera" || parameter.group !== "Camera"),
      ),
    ),
  );
  const timing = (edge: "start" | "end", value: number) => {
    if (!selected) return;
    void queueControlEdit(async () => {
      await call({
        type: "set_track",
        sceneId,
        id: selected.id,
        base: { start: selected.start, end: selected.end },
        timing: { start: selected.start, end: selected.end, [edge]: value },
      });
    }).catch(reportError);
  };
  if (mode === "camera" && !groups.some((group) => group.name === "Camera"))
    groups.unshift({ name: "Camera", entries: [] });
  return (
    <aside className="inspector" aria-label="Parameters">
      {selected && (
        <fieldset
          className="parameter-group contextual-parameters"
          disabled={disabled}
          inert={disabled}
        >
          <legend>
            {selected.label}
            <button
              className="context-dismiss"
              onClick={onDeselect}
              aria-label="Deselect animation"
            >
              <Icon name="close" />
            </button>
          </legend>
          <label className="dialkit-labeled-control number-control">
            <span className="dialkit-labeled-control-label">Start</span>
            <span className="number-value">
              <NumberValue
                label="Start"
                value={selected.start}
                min={parent?.start ?? 0}
                max={selected.end - 1 / fps}
                step={1 / fps}
                onCommit={(value) => timing("start", value)}
              />
              <span>s</span>
            </span>
          </label>
          <label className="dialkit-labeled-control number-control">
            <span className="dialkit-labeled-control-label">
              {selected.durationLabel ?? "Duration"}
            </span>
            <span className="number-value">
              <NumberValue
                label={selected.durationLabel ?? "Duration"}
                value={selected.end - selected.start}
                min={1 / fps}
                max={(parent?.end ?? duration) - selected.start}
                step={1 / fps}
                onCommit={(value) => timing("end", selected.start + value)}
              />
              <span>s</span>
            </span>
          </label>
          {selected.parameterKeys.map(
            (key) =>
              parameters[key] &&
              (mode === "camera" || parameters[key].group !== "Camera") && (
                <ParameterControl
                  key={sceneId + key}
                  name={key}
                  parameter={parameters[key]}
                  exposed={exposedParameters?.includes(key)}
                  onExpose={() => {
                    void queueControlEdit(() =>
                      call({
                        type: "expose_parameter",
                        sceneId,
                        key,
                        exposed: !exposedParameters?.includes(key),
                      }),
                    ).catch(reportError);
                  }}
                  sceneId={sceneId}
                  reportError={reportError}
                />
              ),
          )}
        </fieldset>
      )}
      {groups.map((group) => (
        <fieldset
          className="parameter-group"
          key={group.name}
          disabled={disabled}
          inert={disabled}
        >
          {group.name && <legend>{group.name}</legend>}
          {group.name === "Camera" && (
            <CameraControls
              camera={camera}
              cameraId={cameraId}
              sources={sources}
              sceneId={sceneId}
              reportError={reportError}
              lensPreview={lensPreview}
            />
          )}
          {group.entries.map(({ key, parameter }) => (
            <ParameterControl
              key={sceneId + ":" + key + ":" + parameter.type + ":" + disabled}
              name={key}
              parameter={parameter}
              exposed={exposedParameters?.includes(key)}
              onExpose={() => {
                void queueControlEdit(() =>
                  call({
                    type: "expose_parameter",
                    sceneId,
                    key,
                    exposed: !exposedParameters?.includes(key),
                  }),
                ).catch(reportError);
              }}
              sceneId={sceneId}
              reportError={reportError}
            />
          ))}
          {group.name === "Camera" && cameraGizmo}
        </fieldset>
      ))}
    </aside>
  );
}
