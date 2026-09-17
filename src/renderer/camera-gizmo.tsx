import React, { useRef, useState } from "react";
import type { Inspection } from "../core/context";
import { defaultInspection } from "../core/context";
import { Icon } from "./icons";
import {
  rotateInspection,
  rotationDegrees,
  type RotationAxis,
} from "./inspection-rotation";

// Project actual orientation rings; the gizmo and the saved shot share angles.
function ringGeometry(inspection: Inspection, axis: RotationAxis) {
  const az = inspection.orbitX, el = inspection.orbitY + Math.PI / 2, roll = inspection.orbitZ;
  const project = ([x,y,z]: number[]) => {
    const right = x*Math.cos(az) + y*Math.sin(az);
    const up = -x*Math.sin(az)*Math.sin(el) + y*Math.cos(az)*Math.sin(el) + z*Math.cos(el);
    return [64 + 43*(right*Math.cos(roll)+up*Math.sin(roll)), 62 - 43*(up*Math.cos(roll)-right*Math.sin(roll))];
  };
  const points = Array.from({length:65},(_,i)=>{
    const t = i*Math.PI/32, c=Math.cos(t), s=Math.sin(t);
    return project(axis === "X" ? [0,c,s] : axis === "Y" ? [c,0,s] : [c,s,0]);
  });
  return { path: points.map(([x,y],i)=>`${i ? "L" : "M"}${x},${y}`).join(" "),
    label: project(axis === "X" ? [1.2,0,0] : axis === "Y" ? [0,1.2,0] : [0,0,1.2]) };
}

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
  const [active, setActive] = useState<RotationAxis | null>(null);
  const gesture = useRef<{
    id: number;
    axis: RotationAxis;
    x: number;
    y: number;
    initial: Inspection;
  } | null>(null);
  const cancel = () => {
    if (gesture.current) onChange(gesture.current.initial);
    gesture.current = null;
    setActive(null);
    onInteractionEnd();
  };
  return (
    <div
      className="camera-gizmo"
      role="group"
      aria-label="Camera rotation"
      data-disabled={disabled}
    >
      <svg viewBox="0 0 128 128" aria-label="Drag an axis to rotate the view">
        {(["X", "Y", "Z"] as const).map((axis) => {
          const {path, label} = ringGeometry(inspection, axis);
          return (
          <g
            key={axis}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={`Rotate ${axis}`}
            aria-disabled={disabled}
            aria-valuenow={rotationDegrees(inspection, axis)}
            aria-valuetext={`${rotationDegrees(inspection, axis)} degrees`}
            className="camera-gizmo-axis"
            data-active={active === axis}
            onPointerEnter={() => {
              if (!gesture.current) setActive(axis);
            }}
            onPointerLeave={() => {
              if (!gesture.current) setActive(null);
            }}
            onFocus={() => setActive(axis)}
            onBlur={() => {
              if (!gesture.current) setActive(null);
            }}
            onPointerDown={(event) => {
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
            }}
            onPointerMove={(event) => {
              const drag = gesture.current;
              if (!drag || drag.id !== event.pointerId) return;
              const pixels =
                axis === "X" ? drag.y - event.clientY : event.clientX - drag.x;
              onChange(
                rotateInspection(
                  drag.initial,
                  axis,
                  pixels * 0.01,
                  event.shiftKey,
                ),
              );
            }}
            onPointerUp={(event) => {
              if (gesture.current?.id !== event.pointerId) return;
              gesture.current = null;
              event.currentTarget.releasePointerCapture(event.pointerId);
              onInteractionEnd();
            }}
            onPointerCancel={cancel}
            onLostPointerCapture={() => {
              if (gesture.current) onInteractionEnd();
              gesture.current = null;
            }}
            onKeyDown={(event) => {
              if (disabled) return;
              if (event.key === "Escape") {
                event.preventDefault();
                cancel();
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
              const delta =
                event.key === "Home"
                  ? -rotationDegrees(inspection, axis, false)
                  : direction * (event.shiftKey ? 15 : step);
              onChange(
                rotateInspection(inspection, axis, (delta * Math.PI) / 180),
              );
              onInteractionEnd();
            }}
          >
            <title>{`${axis} rotation · Drag ${axis === "X" ? "vertically" : "horizontally"} · Shift to snap 15°`}</title>
            <path className="gizmo-hit" d={path} />
            <path className="gizmo-ring" d={path} />
            <text x={label[0]} y={label[1]}>
              {axis}
            </text>
          </g>
        ); })}
        <circle className="gizmo-center" cx="64" cy="62" r="3" />
      </svg>
      <button
        className="ui-button icon-button camera-reset"
        data-variant="ghost"
        data-size="icon"
        aria-label="Reset camera"
        title="Reset camera"
        disabled={disabled}
        onClick={() => {
          gesture.current = null;
          setActive(null);
          onChange({ ...defaultInspection(), alignment: "front" });
          onInteractionEnd();
        }}
      >
        <Icon name="undo" size={18} />
      </button>
    </div>
  );
}
