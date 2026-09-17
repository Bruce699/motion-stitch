import type { SceneContext, SceneInstance } from "../../src/core/runtime";

/** A macro lens stays inside the payment UI: insignia, hairlines, numerals. */
export default function createScene({ THREE, world, camera, createLayeredSource, registerCameraFrame, document }: SceneContext): SceneInstance {
  const ui = createLayeredSource("ui", { width: 7.2 });
  world.add(ui.group);
  const focus = new THREE.Object3D();
  world.add(focus);
  registerCameraFrame("ui", focus);
  world.background = new THREE.Color(document.background);
  const target = new THREE.Vector3(), cash = new THREE.Vector3(), total = new THREE.Vector3();
  const eye = new THREE.Vector3(), direction = new THREE.Vector3();
  const smooth = (v: number) => v * v * v * (10 + v * (-15 + 6 * v));
  const framePoint = (id: string, x: number, y: number, out: InstanceType<typeof THREE.Vector3>) => {
    const node = ui.get(id), bounds = node.layout!.bounds;
    out.set((x - .5) * bounds.width * .005, (.5 - y) * bounds.height * .005, 0);
    return node.object.localToWorld(out);
  };
  camera.fov = 32; camera.near = .02; camera.far = 100;
  return {
    sample({ time, document, controls }) {
      const p = (id: string) => { const track = document.tracks.find(t => t.id === id)!; return smooth(Math.max(0, Math.min(1, (time-track.start)/(track.end-track.start)))); };
      const intro = p("insignia"), travel = p("traverse"), orbit = p("orbit");
      const rise = p("paper-rise"), settle = p("paper-settle");
      const lift = controls.number("lift");
      // The original payment panel supplies every visible pixel; omit the surrounding navigation.
      ui.base.visible = false;
      ui.get("payment").object.position.set(0, 0, .04);
      ui.get("payment-surface").object.position.set(0, 0, lift * (.45 + .55*rise) * (1-.45*settle));
      ui.get("total").object.position.set(0, 0, .028 * p("numerals"));
      ui.get("shop-cash").object.position.set(0, 0, .06*(1-.3*intro));
      ui.get("mastercard").object.position.set(0, 0, .035);
      ui.group.updateMatrixWorld(true);
      const shot2 = document.tracks.find(t => t.id === "traverse")!.start;
      const shot3 = document.tracks.find(t => t.id === "orbit")!.start;
      const lens = controls.number("distance");
      let azimuth: number, elevation: number, distance: number, roll: number;
      framePoint("shop-cash", .78, .5, cash);
      framePoint("mastercard", .65, .5, total);
      if (time < shot2) {
        target.copy(total).lerp(cash, .58 + .3*intro);
        target.x += .045;
        azimuth = -25 + 18*intro;
        elevation = 56 - 10*intro;
        distance = lens * (1 - .06*intro);
        roll = -9 + 4*intro;
      } else if (time < shot3) {
        framePoint("total-mark", .5, .5, cash);
        framePoint("total", .19, .5, total);
        target.copy(cash).lerp(total, .24 + .42*travel);
        azimuth = 28 - 26*travel;
        elevation = 46 + 13*travel;
        distance = lens * (.86 + .03*travel);
        roll = 7 - 10*travel;
      } else {
        framePoint("amount", .63, .5, target);
        target.y += .025 * (1-orbit);
        azimuth = -18 + 32*orbit;
        elevation = 53 + 12*orbit;
        distance = lens * (.9 + .1*orbit);
        roll = -7 + 10*orbit;
      }
      focus.position.copy(target);
      azimuth = THREE.MathUtils.degToRad(azimuth);
      elevation = THREE.MathUtils.degToRad(elevation);
      direction.set(Math.sin(azimuth)*Math.cos(elevation), -Math.cos(azimuth)*Math.cos(elevation), Math.sin(elevation));
      eye.copy(target).addScaledVector(direction, distance);
      camera.position.copy(eye);
      roll = THREE.MathUtils.degToRad(roll);
      camera.up.set(Math.sin(roll),Math.cos(roll),0);
      camera.lookAt(target);
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
    },
  };
}
