import React, { useEffect, useRef, useState } from "react";
import {
  parameterGroups,
  type Parameter,
  type ParameterValue,
} from "../core/parameters";
import { call } from "./bridge";

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
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false),
    cancelled = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);
  return (
    <div className="color-value">
      <input
        type="color"
        aria-label={label + " picker"}
        value={value}
        onChange={(e) => onCommit(e.target.value)}
      />
      <input
        type="text"
        aria-label={label}
        value={draft}
        maxLength={7}
        spellCheck={false}
        onFocus={() => {
          focused.current = true;
          cancelled.current = false;
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          focused.current = false;
          if (!cancelled.current && /^#[0-9a-fA-F]{6}$/.test(draft)) {
            if (draft !== value) onCommit(draft);
          } else setDraft(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            cancelled.current = true;
            setDraft(value);
            e.currentTarget.blur();
          }
        }}
      />
    </div>
  );
}

function ParameterControl({
  name,
  parameter: p,
  sceneId,
  reportError,
}: {
  name: string;
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
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    if (!active.current && !pending.current) setDraft(p.value);
  }, [p.value]);
  const enqueue = (fn: () => Promise<unknown>) => {
    pending.current++;
    queue.current = queue.current
      .then(fn)
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
    enqueue(() => call({ type: "set_parameter", sceneId, key: name, value }));
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
  if (p.type === "boolean")
    return (
      <label className="parameter control-row">
        <span>{p.label}</span>
        <input
          type="checkbox"
          role="switch"
          aria-label={p.label}
          checked={draft as boolean}
          onChange={(e) => change(e.target.checked)}
        />
      </label>
    );
  if (p.type === "select")
    return (
      <label className="parameter control-row">
        <span>{p.label}</span>
        <select
          aria-label={p.label}
          value={draft as string}
          onChange={(e) => change(e.target.value)}
        >
          {p.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  if (p.type === "color")
    return (
      <div className="parameter control-row">
        <span>{p.label}</span>
        <ColorValue label={p.label} value={draft as string} onCommit={change} />
      </div>
    );
  if (p.type === "vector3")
    return (
      <div className="parameter">
        <div className="control-row">
          <span>{p.label}</span>
          {p.unit && <span className="parameter-unit">{p.unit}</span>}
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
  return (
    <div className="parameter">
      <div className="control-row">
        <span>{p.label}</span>
        <div className="number-value">
          <NumberValue
            label={p.label + " value"}
            value={draft as number}
            min={p.min}
            max={p.max}
            step={p.step}
            onCommit={change}
          />
          {p.unit && <span className="parameter-unit">{p.unit}</span>}
        </div>
      </div>
      {p.control === "slider" && (
        <input
          type="range"
          aria-label={p.label}
          min={p.min}
          max={p.max}
          step={p.step}
          value={draft as number}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            begin();
          }}
          onChange={(e) => change(Number(e.target.value))}
          onPointerUp={finish}
          onPointerCancel={finish}
          onLostPointerCapture={finish}
          onKeyDown={(e) => {
            if (
              [
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                "ArrowDown",
                "Home",
                "End",
                "PageUp",
                "PageDown",
              ].includes(e.key)
            )
              begin();
          }}
          onKeyUp={finish}
          onBlur={finish}
        />
      )}
    </div>
  );
}

export function ParameterPanel({
  parameters,
  sceneId,
  reportError,
  disabled,
}: {
  parameters: Record<string, Parameter>;
  sceneId: string;
  reportError: (error: unknown) => void;
  disabled: boolean;
}) {
  return (
    <aside className="inspector" aria-label="Parameters">
      <div className="inspector-heading">Parameters</div>
      {parameterGroups(parameters).map((group) => (
        <fieldset
          className="parameter-group"
          key={group.name}
          disabled={disabled}
        >
          {group.name && <legend>{group.name}</legend>}
          {group.entries.map(({ key, parameter }) => (
            <ParameterControl
              key={sceneId + ":" + key + ":" + parameter.type}
              name={key}
              parameter={parameter}
              sceneId={sceneId}
              reportError={reportError}
            />
          ))}
        </fieldset>
      ))}
    </aside>
  );
}
