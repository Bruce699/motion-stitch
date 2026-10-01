import type { Inspection } from "../core/context";

// Fixed observer: the camera moves around the target, never the target around the camera.
export function orbitPoint(heading: number, elevation: number, radius = 61) {
  const x = Math.sin(heading) * Math.cos(elevation);
  const y = Math.sin(elevation);
  const z = Math.cos(heading) * Math.cos(elevation);
  return {
    x: 112 + radius * (x * 0.87 + z * 0.5),
    y: 82 + radius * (x * 0.24 - y * 0.87 - z * 0.42),
    depth: z,
  };
}
export function orbitDrag(
  initial: Inspection,
  dx: number,
  dy: number,
  snap = false,
): Inspection {
  const stop = Math.PI / 12;
  const quantize = (v: number) => (snap ? Math.round(v / stop) * stop : v);
  return {
    ...initial,
    alignment: undefined,
    orbitX: quantize(initial.orbitX + dx * 0.012),
    orbitY: Math.max(
      -Math.PI / 2,
      Math.min(0, quantize(initial.orbitY - dy * 0.012)),
    ),
  };
}
export function orbitPath(heading: number | null, elevation: number) {
  return Array.from({ length: 65 }, (_, i) => {
    const p =
      heading === null
        ? orbitPoint((i / 64) * Math.PI * 2, elevation)
        : orbitPoint(heading, ((i / 64) * Math.PI) / 2);
    return `${i ? "L" : "M"}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }).join(" ");
}
