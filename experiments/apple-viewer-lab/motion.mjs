export const TAU = Math.PI * 2;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export function nearestTurn(angle, reference) {
  return (
    reference +
    Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference))
  );
}
export function nearestShot(shots, yaw, pitch, velocity = 0) {
  const projected = yaw + clamp(velocity * 0.14, -0.65, 0.65);
  return shots.reduce((best, s) => {
    const cost = (x) =>
      (nearestTurn(x.yaw, projected) - projected) ** 2 + (x.pitch - pitch) ** 2;
    return cost(s) < cost(best) ? s : best;
  });
}
export function approach(value, target, rate, dt) {
  return target + (value - target) * Math.exp(-rate * Math.min(dt, 0.05));
}
export const shots = [
  {
    id: "hero",
    label: "Three-quarter",
    yaw: -0.65,
    pitch: 0.12,
    zoom: 1,
    light: 0.25,
  },
  { id: "back", label: "Back", yaw: 0, pitch: 0, zoom: 1, light: 0 },
  {
    id: "edge",
    label: "Side",
    yaw: Math.PI / 2 - 0.035,
    pitch: 0.12,
    zoom: 1,
    light: 0.8,
  },
  { id: "front", label: "Front", yaw: Math.PI, pitch: 0, zoom: 1, light: 0.3 },
  {
    id: "front-angle",
    label: "Front three-quarter",
    yaw: Math.PI + 0.6,
    pitch: 0.09,
    zoom: 1,
    light: 0.7,
  },
  {
    id: "camera",
    label: "Camera detail",
    yaw: -0.3,
    pitch: 0.12,
    zoom: 1.8,
    light: 0.35,
    targetY: 0.58,
  },
];
export const duoShots = [
  {
    id: "hero",
    label: "Three-quarter",
    yaw: -0.65,
    pitch: 0.12,
    zoom: 1,
    light: 0.25,
    fold: 0,
    roll: 0,
  },
  {
    id: "closed",
    label: "Closed",
    yaw: Math.PI + 0.2,
    pitch: 0.06,
    zoom: 1,
    light: 0.3,
    fold: 0,
    roll: 0,
  },
  {
    id: "landscape",
    label: "Landscape",
    yaw: Math.PI + 0.15,
    pitch: 0.05,
    zoom: 1,
    light: 0.3,
    fold: 1,
    roll: 0,
  },
  {
    id: "portrait",
    label: "Portrait",
    yaw: Math.PI,
    pitch: 0.04,
    zoom: 1,
    light: 0.25,
    fold: 1,
    roll: -Math.PI / 2,
  },
  {
    id: "seated",
    label: "Seated",
    yaw: Math.PI + 0.45,
    pitch: 0.45,
    zoom: 1,
    light: 0.65,
    fold: 0.5,
    roll: -Math.PI / 2,
  },
  {
    id: "standing",
    label: "Standing",
    yaw: Math.PI + 0.35,
    pitch: 0.14,
    zoom: 1,
    light: 0.5,
    fold: 0.68,
    roll: 0,
  },
];
