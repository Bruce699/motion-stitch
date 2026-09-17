import { cameraAngles, defaultCamera, type CameraSettings } from "../core/camera";
import { defaultInspection, type Inspection } from "../core/context";
const rad = Math.PI / 180;
const wrap = (degrees: number) => ((degrees + 180) % 360 + 360) % 360 - 180;

/** A shared control representation, not an extra transform on the rendered shot. */
export function cameraNavigation(camera: CameraSettings = defaultCamera()): Inspection {
  const angles = cameraAngles(camera);
  return { ...defaultInspection(), zoom: camera.zoom ?? 1, panX: camera.panX ?? 0,
    panY: camera.panY ?? 0, orbitX: angles.rotation * rad,
    orbitY: (angles.elevation - 90) * rad, orbitZ: (camera.roll ?? 0) * rad };
}
export function cameraNavigationPatch(next: Inspection, camera: CameraSettings = defaultCamera()) {
  if (next.alignment === "front") return { rotation: 0, elevation: 90, roll: 0, zoom: 1, panX: 0, panY: 0 };
  const previous = cameraNavigation(camera);
  const step = camera.projection === "orthographic" ? 5 : 1;
  const snap = (value: number) => Math.round(value / step) * step;
  return {
    rotation: next.orbitX === previous.orbitX ? cameraAngles(camera).rotation : wrap(snap(next.orbitX / rad)),
    elevation: next.orbitY === previous.orbitY ? cameraAngles(camera).elevation : Math.max(0, Math.min(90, snap(next.orbitY / rad + 90))),
    roll: next.orbitZ === previous.orbitZ ? camera.roll ?? 0 : wrap(snap(next.orbitZ / rad)),
    zoom: Math.max(0.1, Math.min(12, next.zoom)), panX: next.panX, panY: next.panY,
  };
}
