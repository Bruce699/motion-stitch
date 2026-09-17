import type { Inspection } from "../core/context";
export type RotationAxis = "X" | "Y" | "Z";
// Existing orbitX is yaw (around Y); orbitY is pitch (around X).
const field = { X: "orbitY", Y: "orbitX", Z: "orbitZ" } as const;
export function rotationDegrees(
  value: Inspection,
  axis: RotationAxis,
  rounded = true,
) {
  const degrees = ((value[field[axis]] ?? 0) * 180) / Math.PI;
  return rounded ? Math.round(degrees) : degrees;
}
export function rotateInspection(
  value: Inspection,
  axis: RotationAxis,
  delta: number,
  snap = false,
): Inspection {
  const key = field[axis];
  const next = (value[key] ?? 0) + delta;
  const stop = Math.PI / 12;
  return { ...value, [key]: snap ? Math.round(next / stop) * stop : next };
}
