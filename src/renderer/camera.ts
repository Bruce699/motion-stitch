import * as THREE from "three";
import { CAMERA_STOPS, type CameraSettings } from "../core/camera";
import type { Inspection } from "../core/context";

/** Adapt the prototype's XZ camera math to upright XY UI without moving artwork. */
export function applyIsometricCamera(
  camera: THREE.OrthographicCamera,
  authored: THREE.PerspectiveCamera,
  settings: CameraSettings,
  frame: THREE.Object3D,
  view: Pick<Inspection, "zoom" | "panX" | "panY">,
) {
  frame.updateWorldMatrix(true, false);
  const basisX = new THREE.Vector3().setFromMatrixColumn(frame.matrixWorld, 0);
  const basisY = new THREE.Vector3().setFromMatrixColumn(frame.matrixWorld, 1);
  const basisZ = new THREE.Vector3().setFromMatrixColumn(frame.matrixWorld, 2);
  if (Math.min(basisX.length(), basisY.length(), basisZ.length()) < 1e-9)
    throw new Error("The isometric camera frame must have nonzero scale");
  basisX.normalize();
  basisY.normalize();
  basisZ.normalize();
  if (
    Math.max(
      Math.abs(basisX.dot(basisY)),
      Math.abs(basisX.dot(basisZ)),
      Math.abs(basisY.dot(basisZ)),
    ) > 1e-6
  )
    throw new Error(
      "The isometric camera frame is sheared. Register a frame with perpendicular axes.",
    );
  const target = new THREE.Vector3().setFromMatrixPosition(frame.matrixWorld);
  const distance = Math.max(0.1, authored.position.distanceTo(target));
  // Match the perspective camera's plane-height so switching doesn't arbitrarily rescale the UI.
  const height =
    (2 * distance * Math.tan(THREE.MathUtils.degToRad(authored.fov / 2))) /
    authored.zoom;
  const stop = CAMERA_STOPS[settings.preset];
  const az = stop.azimuth * (settings.side === "left" ? -1 : 1);
  const el = stop.elevation;
  const direction = new THREE.Vector3()
    .addScaledVector(basisX, Math.cos(el) * Math.sin(az))
    .addScaledVector(basisY, -Math.cos(el) * Math.cos(az))
    .addScaledVector(basisZ, Math.sin(el));
  camera.position.copy(target).addScaledVector(direction, distance);
  // At the front pole the up vector fixes roll exactly, rather than relying on lookAt's epsilon.
  camera.up.copy(
    el === Math.PI / 2
      ? new THREE.Vector3()
          .addScaledVector(basisX, -Math.sin(az))
          .addScaledVector(basisY, Math.cos(az))
      : basisZ,
  );
  camera.lookAt(target);
  camera.left = (-height * authored.aspect) / 2;
  camera.right = -camera.left;
  camera.top = height / 2;
  camera.bottom = -camera.top;
  camera.zoom = view.zoom;
  camera.near = authored.near;
  camera.far = Math.max(authored.far, distance * 2);
  camera.position.addScaledVector(
    new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion),
    (-view.panX * height * authored.aspect) / view.zoom,
  );
  camera.position.addScaledVector(
    new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion),
    (view.panY * height) / view.zoom,
  );
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return camera;
}
