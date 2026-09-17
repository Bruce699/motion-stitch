import * as THREE from "three";
import { cameraAngles, type CameraSettings } from "../core/camera";
import type { Inspection } from "../core/context";

/** Center the actual source in its upright basis, including lifted layers. */
export function alignInspectionFront(
  camera: THREE.PerspectiveCamera,
  frame: THREE.Object3D,
) {
  frame.updateWorldMatrix(true, true);
  const orientation = frame.getWorldQuaternion(new THREE.Quaternion());
  const inverse = orientation.clone().invert();
  const bounds = new THREE.Box3();
  frame.traverseVisible((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.geometry) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    if (!box || box.isEmpty()) return;
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y])
        for (const z of [box.min.z, box.max.z])
          bounds.expandByPoint(
            new THREE.Vector3(x, y, z)
              .applyMatrix4(object.matrixWorld)
              .applyQuaternion(inverse),
          );
  });
  const center = bounds.isEmpty()
    ? frame.getWorldPosition(new THREE.Vector3()).applyQuaternion(inverse)
    : bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / camera.zoom;
  const distance = bounds.isEmpty()
    ? Math.max(
        1,
        camera.position.distanceTo(center.clone().applyQuaternion(orientation)),
      )
    : Math.max(
        0.1,
        size.z / 2 +
          1.1 * Math.max(size.y / 2 / tan, size.x / 2 / (tan * camera.aspect)),
      );
  const target = center.applyQuaternion(orientation);
  camera.quaternion.copy(orientation);
  camera.position
    .copy(target)
    .add(new THREE.Vector3(0, 0, distance).applyQuaternion(orientation));
  camera.far = Math.max(camera.far, distance + size.z + 1);
  camera.updateProjectionMatrix();
  return target;
}

/** Adapt the prototype's XZ camera math to upright XY UI without moving artwork. */
export function applyIsometricCamera(
  camera: THREE.OrthographicCamera,
  authored: THREE.PerspectiveCamera,
  settings: CameraSettings,
  frame: THREE.Object3D,
  view: Pick<Inspection, "zoom" | "panX" | "panY"> & Partial<Inspection>,
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
  if (view.alignment === "front") {
    authored = authored.clone();
    target.copy(alignInspectionFront(authored, frame));
  }
  const distance = Math.max(0.1, authored.position.distanceTo(target));
  // Match the perspective camera's plane-height so switching doesn't arbitrarily rescale the UI.
  const height =
    (2 * distance * Math.tan(THREE.MathUtils.degToRad(authored.fov / 2))) /
    authored.zoom;
  const angles = cameraAngles(settings);
  const az =
    view.alignment === "front" ? 0 : THREE.MathUtils.degToRad(angles.rotation);
  const el =
    view.alignment === "front"
      ? Math.PI / 2
      : THREE.MathUtils.degToRad(angles.elevation);
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
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const orbit = new THREE.Quaternion()
    .setFromAxisAngle(up, view.orbitX ?? 0)
    .multiply(new THREE.Quaternion().setFromAxisAngle(right, view.orbitY ?? 0));
  camera.position.sub(target).applyQuaternion(orbit).add(target);
  camera.quaternion.premultiply(orbit);
  camera.rotateZ(view.orbitZ ?? 0);
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
  // Scene-authored lens shifts also apply to the shared orthographic camera.
  // This lets a scene track through a shot without changing its saved orbit.
  if (authored.view?.enabled) {
    const v = authored.view;
    camera.setViewOffset(v.fullWidth, v.fullHeight, v.offsetX, v.offsetY, v.width, v.height);
  } else {
    camera.clearViewOffset();
  }
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return camera;
}
