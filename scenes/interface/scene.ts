import type { SceneContext, SceneInstance } from "../../src/core/runtime";

/** Real browser cards settle onto the original page; absolute sampling stays reversible. */
export default function createScene({
  THREE,
  world,
  camera,
  createLayeredSource,
  document,
  motion,
}: SceneContext): SceneInstance {
  const ui = createLayeredSource("ui", { width: 5.8 });
  const background = new THREE.Color(document.background);
  world.background = background;
  world.add(ui.group);
  const order = [
    "note",
    "fulfillment-0",
    "customer",
    "payment",
    "risk",
    "timeline",
    "payment-surface",
    "composer",
  ];
  return {
    sample({ time, controls, document }) {
      ui.group.visible = true;
      ui.group.position.fromArray(controls.vector3("position"));
      const rotation = controls.vector3("rotation");
      ui.group.rotation.set(
        ...(rotation.map((value) => (value * Math.PI) / 180) as [
          number,
          number,
          number,
        ]),
      );
      ui.group.scale.setScalar(controls.number("scale"));
      ui.base.material.opacity = controls.number("opacity");
      for (const [index, id] of order.entries()) {
        const node = ui.get(id);
        const track = document.tracks.find(
          (track) => track.id === `settle-${id}`,
        )!;
        const t = motion.clamp((time - track.start) / (track.end - track.start));
        // Quintic easing has zero velocity and acceleration at both ends.
        const remaining = 1 - t * t * t * (10 - 15 * t + 6 * t * t);
        const height = id === "payment-surface" ? 0.22 : 0.72 + index * 0.085;
        node.object.position.set(
          0,
          0,
          height * controls.number("depth") * remaining,
        );
        node.object.rotation.set(0, 0, 0);
        node.object.scale.setScalar(1);
        node.mesh.material.opacity = controls.number("opacity");
      }
      background.set(document.background);
      camera.position.set(0, 0, controls.number("distance"));
      camera.lookAt(0, 0, 0);
      const driftTrack = document.tracks.find((track) => track.id === "camera-drift")!;
      const progress = motion.clamp((time - driftTrack.start) / (driftTrack.end - driftTrack.start));
      const drift = progress * progress * (3 - 2 * progress);
      // Move the camera's window down-right, keeping the authored angle and zoom.
      camera.setViewOffset(
        document.size.width,
        document.size.height,
        document.size.width * controls.number("driftX") * drift,
        document.size.height * controls.number("driftY") * drift,
        document.size.width,
        document.size.height,
      );
    },
  };
}
