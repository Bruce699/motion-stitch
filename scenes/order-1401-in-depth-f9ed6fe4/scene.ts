import type { SceneContext, SceneInstance } from "../../src/core/runtime";

/** A continuous detail-to-context shot, authored from the untouched order UI. */
export default function createScene({ THREE, world, camera, createLayeredSource, document }: SceneContext): SceneInstance {
  const ui = createLayeredSource("ui", { width: 7.2 });
  world.add(ui.group);
  const background = new THREE.Color(document.background);
  world.background = background;
  const destination = new THREE.Vector3();
  const eye = new THREE.Vector3();
  const smooth = (p: number) => p * p * p * (10 + p * (-15 + 6 * p));
  const cast = [
    { id: "payment", x: -0.16, y: -0.18, z: 0.88, tilt: -0.035 },
    { id: "fulfillment-0", x: -0.25, y: 0.22, z: 0.52, tilt: 0.025 },
    { id: "customer", x: 0.32, y: -0.05, z: 0.48, tilt: -0.025 },
    { id: "risk", x: 0.38, y: -0.10, z: 0.65, tilt: -0.02 },
    { id: "timeline", x: 0.44, y: -0.25, z: 0.82, tilt: 0.025 },
  ];
  for (const item of cast) ui.get(item.id).mesh.material.transparent = true;
  ui.base.material.transparent = true;
  camera.fov = 35;
  camera.near = 0.05;
  camera.far = 100;
  return {
    sample({ time, controls, document }) {
      const progress = (id: string) => {
        const t = document.tracks.find((track) => track.id === id)!;
        return smooth(Math.max(0, Math.min(1, (time - t.start) / Math.max(0.001, t.end - t.start))));
      };
      const unfold = progress("unfold");
      const close = progress("return");
      const spread = controls.number("spread");
      const depth = controls.number("separation");
      ui.group.position.set(0, 0, 0);
      ui.group.rotation.set(0, 0, 0);
      ui.group.scale.setScalar(1);
      background.set(document.background);
      ui.base.material.opacity = 1 - controls.number("baseDim") * unfold * (1 - close);
      for (const item of cast) {
        const lift = progress(`unfold-${item.id}`) * (1 - progress(`return-${item.id}`));
        const node = ui.get(item.id);
        node.object.position.set(item.x * spread * lift, item.y * spread * lift, item.z * depth * lift);
        node.object.rotation.set(item.tilt * lift, -item.tilt * 0.7 * lift, item.tilt * 0.15 * lift);
        node.object.scale.setScalar(1);
        node.mesh.material.opacity = 1;
      }
      const detail = progress("detail") * (1 - progress("return-payment-surface"));
      ui.get("payment-surface").object.position.set(0, 0, controls.number("detailLift") * detail);
      ui.get("payment-surface").object.rotation.set(0, 0, 0);
      const trace = progress("macro");
      const reveal = progress("reveal");
      const orbit = progress("orbit");
      const hero = progress("hero");
      const travel = controls.number("travel");
      // Each move owns one expandable interval; additive blends maintain continuity.
      eye.set(-2.0 + 0.55 * trace + 5.7 * reveal - 1.35 * orbit - 2.3 * hero,
        -2.25 + 0.32 * trace + 0.22 * reveal + 0.95 * orbit + 0.56 * hero,
        3.75 + 0.35 * trace + 5.6 * reveal + 0.55 * orbit + 0.2 * hero);
      destination.set(-0.55 + 0.25 * trace + 0.65 * reveal - 0.12 * orbit - 0.05 * hero,
        -0.72 + 0.15 * trace + 0.70 * reveal - 0.13 * hero,
        0.1 + 0.48 * reveal - 0.58 * hero);
      eye.x *= travel;
      eye.y *= travel;
      camera.position.copy(eye);
      camera.up.set(0, 1, 0);
      camera.lookAt(destination);
      camera.rotateZ((-0.045 + 0.085 * reveal - 0.04 * hero) * travel);
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
    },
  };
}
