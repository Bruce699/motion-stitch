import React, { useEffect, useRef, useState } from "react";
import type { Inspection } from "../core/context";
import { defaultInspection } from "../core/context";
import { Icon } from "./icons";
import {
  rotateInspection,
  rotationDegrees,
  type RotationAxis,
} from "./inspection-rotation";
import { orbitDrag, orbitPath, orbitPoint } from "./camera-gizmo-geometry";
import "./camera-gizmo.css";

type Control = RotationAxis | "orbit";
export function CameraGizmo({
  inspection,
  disabled,
  onChange,
  onInteractionEnd,
  step = 1,
}: {
  inspection: Inspection;
  disabled: boolean;
  onChange: (next: Inspection) => void;
  onInteractionEnd: () => void;
  step?: number;
}) {
  const [active, setActive] = useState<Control | null>(null);
  const gesture = useRef<{
    id: number;
    axis: Control;
    x: number;
    y: number;
    initial: Inspection;
  } | null>(null);
  const latest = useRef({ onChange, onInteractionEnd });
  latest.current = { onChange, onInteractionEnd };
  const finish = (cancel = false) => {
    const drag = gesture.current;
    if (!drag) return;
    gesture.current = null;
    if (cancel) latest.current.onChange(drag.initial);
    setActive(null);
    latest.current.onInteractionEnd();
  };
  useEffect(() => {
    const blur = () => finish();
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("blur", blur);
      if (gesture.current) {
        gesture.current = null;
        latest.current.onInteractionEnd();
      }
    };
  }, []);
  useEffect(() => {
    if (disabled) finish();
  }, [disabled]);
  function handlers(axis: Control) {
    return {
      onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
        if (disabled || event.button !== 0 || gesture.current) return;
        event.preventDefault();
        event.currentTarget.focus();
        event.currentTarget.setPointerCapture(event.pointerId);
        gesture.current = {
          id: event.pointerId,
          axis,
          x: event.clientX,
          y: event.clientY,
          initial: { ...inspection },
        };
        setActive(axis);
      },
      onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
        const drag = gesture.current;
        if (!drag || drag.id !== event.pointerId) return;
        const dx = event.clientX - drag.x,
          dy = event.clientY - drag.y;
        onChange(
          axis === "orbit"
            ? orbitDrag(drag.initial, dx, dy, event.shiftKey)
            : {
                ...rotateInspection(
                  drag.initial,
                  axis,
                  (axis === "X" ? -dy : dx) * 0.01,
                  event.shiftKey,
                ),
                alignment: undefined,
              },
        );
      },
      onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
        if (gesture.current?.id !== event.pointerId) return;
        finish();
        event.currentTarget.releasePointerCapture(event.pointerId);
      },
      onPointerCancel: () => finish(true),
      onLostPointerCapture: () => finish(),
      onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
        if (disabled) return;
        if (event.key === "Escape" && gesture.current) {
          event.preventDefault();
          event.stopPropagation();
          finish(true);
          return;
        }
        if (gesture.current) return;
        const direction = ["ArrowRight", "ArrowUp"].includes(event.key)
          ? 1
          : ["ArrowLeft", "ArrowDown"].includes(event.key)
            ? -1
            : 0;
        if (!direction && event.key !== "Home") return;
        event.preventDefault();
        event.stopPropagation();
        const target =
          axis === "orbit"
            ? ["ArrowUp", "ArrowDown"].includes(event.key)
              ? "X"
              : "Y"
            : axis;
        const delta =
          event.key === "Home"
            ? -rotationDegrees(inspection, target, false)
            : direction * (event.shiftKey ? 15 : step);
        onChange({
          ...rotateInspection(inspection, target, (delta * Math.PI) / 180),
          alignment: undefined,
        });
        onInteractionEnd();
      },
    };
  }
  const elevation = inspection.orbitY + Math.PI / 2;
  const axisValue = (axis: RotationAxis) =>
    axis === "X"
      ? Math.round((elevation * 180) / Math.PI)
      : rotationDegrees(inspection, axis);
  const camera = orbitPoint(inspection.orbitX, elevation);
  const base = orbitPoint(inspection.orbitX, 0);
  return (
    <div
      className="camera-orbit-widget"
      role="group"
      aria-label="Camera rotation"
      data-disabled={disabled}
      data-dragging={active !== null}
    >
      <div
        className="camera-orbit-pad"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Orbit camera"
        aria-disabled={disabled}
        aria-valuemin={-180}
        aria-valuemax={180}
        aria-valuenow={rotationDegrees(inspection, "Y")}
        aria-valuetext={`Heading ${rotationDegrees(inspection, "Y")} degrees, elevation ${Math.round((elevation * 180) / Math.PI)} degrees`}
        title="Drag to orbit camera · Arrow keys to rotate · Shift to snap 15°"
        {...handlers("orbit")}
      >
        <svg viewBox="0 0 224 166" aria-hidden="true">
          <path className="orbit-floor" d={orbitPath(null, 0)} />
          <path
            className="orbit-meridian"
            d={orbitPath(inspection.orbitX, 0)}
          />
          <path className="orbit-latitude" d={orbitPath(null, elevation)} />
          <path
            className="orbit-drop"
            d={`M${camera.x},${camera.y}L${base.x},${base.y}`}
          />
          <path
            className="orbit-target"
            d="M100,80 L113,73 L125,80 L112,87 Z M100,80 L100,88 L112,95 L125,88 L125,80 M112,87 L112,95"
          />
          <path className="orbit-sight" d={`M112,82L${camera.x},${camera.y}`} />
          <circle className="orbit-pivot" cx="112" cy="82" r="3" />
          <g transform={`translate(${camera.x} ${camera.y})`}>
            <circle className="orbit-halo" r="19" />
            <circle className="orbit-handle" r="12" />
            <foreignObject x="-8" y="-8" width="16" height="16">
              <span
                className="orbit-camera-icon"
                style={{ transform: `rotate(${inspection.orbitZ}rad)` }}
              >
                <Icon name="camera" size={16} />
              </span>
            </foreignObject>
          </g>
        </svg>
      </div>
      <div className="camera-orbit-controls">
        {(["X", "Y", "Z"] as const).map((axis) => (
          <div
            key={axis}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={`Rotate ${axis}`}
            aria-disabled={disabled}
            aria-valuemin={axis === "X" ? 0 : -180}
            aria-valuemax={axis === "X" ? 90 : 180}
            aria-valuenow={axisValue(axis)}
            aria-valuetext={`${axisValue(axis)} degrees`}
            className="orbit-axis"
            data-active={active === axis}
            title={`${axis === "X" ? "Elevation" : axis === "Y" ? "Heading" : "Roll"} · Drag ${axis === "X" ? "vertically" : "horizontally"}`}
            {...handlers(axis)}
          >
            {axis}
            <span>{axisValue(axis)}°</span>
          </div>
        ))}
        <button
          className="ui-button icon-button"
          data-variant="ghost"
          data-size="icon"
          aria-label="Reset camera"
          title="Reset camera"
          disabled={disabled}
          onClick={() => {
            finish();
            onChange({ ...defaultInspection(), alignment: "front" });
            onInteractionEnd();
          }}
        >
          <Icon name="undo" size={16} />
        </button>
      </div>
    </div>
  );
}
