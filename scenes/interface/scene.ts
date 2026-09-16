import type { SceneContext, SceneInstance } from "../../src/core/runtime";

/** Executable scene, not a built-in effect. The agent owns all of this choreography. */
export default function createScene({
  THREE,
  world,
  camera,
  createLayeredSource,
  motion,
}: SceneContext): SceneInstance {
  const { lerp, segment } = motion;
  const rig = new THREE.Group();
  world.add(rig);
  const width = 5.8,
    height = (width * 640) / 1000;
  const ui = createLayeredSource("ui", { width });
  rig.add(ui.group);
  const navigation = ui.get("navigation").object;
  const activeItem = ui.get("active-item").object;
  const summary = ui.get("summary").object;
  const tasks = ui.get("tasks").object;
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.02, height - 0.02, 0.025),
    new THREE.MeshBasicMaterial({ color: "#c9c7c4" }),
  );
  edge.position.z = -0.025;
  rig.add(edge);
  const shadowMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { strength: { value: 0.22 } },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv;uniform float strength;void main(){vec2 q=abs(vUv-.5);float d=pow(q.x*2.,6.)+pow(q.y*2.,6.);float a=exp(-d*4.)*strength;gl_FragColor=vec4(.15,.12,.12,a);}`,
  });
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 1.27, height * 1.3),
    shadowMaterial,
  );
  shadow.position.set(0.05, -0.2, -0.4);
  rig.add(shadow);
  const fieldMaterial = new THREE.ShaderMaterial({
    depthWrite: false,
    uniforms: {
      time: { value: 0 },
      amount: { value: 0.7 },
      base: { value: new THREE.Color("#e3e1dc") },
    },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.999,1.);}`,
    fragmentShader: `varying vec2 vUv;uniform float time;uniform float amount;uniform vec3 base;void main(){vec2 p=vUv;float glow=exp(-length((p-vec2(.68+.06*sin(time*.2),.62))*vec2(1.,1.4))*3.);float cool=exp(-length(p-vec2(.05,.1))*2.);vec3 color=base+amount*(vec3(.09,.065,.025)*glow+vec3(-.055,-.012,.055)*cool);float noise=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);color+=(noise-.5)*.004;gl_FragColor=vec4(color,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`,
  });
  const field = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fieldMaterial);
  field.frustumCulled = false;
  field.renderOrder = -10;
  world.add(field);
  return {
    sample({ time, controls, document }) {
      const p = {
        tilt: controls.number("tilt"),
        distance: controls.number("distance"),
        lift: controls.number("lift"),
        atmosphere: controls.number("atmosphere"),
        depth: controls.number("depth"),
      };
      const enter = segment(time, 0, 1.7);
      const lift = (start: number) =>
        segment(time, start, start + 1.6) * (1 - segment(time, 5.8, 7.6));
      const reveal = lift(1.4);
      navigation.position.z = p.depth * reveal;
      activeItem.position.z = p.depth * 0.18 * lift(1.8);
      summary.position.z = p.depth * 0.62 * lift(1.7);
      tasks.position.z = p.depth * 0.28 * lift(2);

      const turn = segment(time, 2.8, 6.6);
      const settle = segment(time, 6.6, 8);
      rig.rotation.set(
        lerp(0.12, -0.04, enter) + Math.sin(turn * Math.PI) * p.tilt * 0.35,
        lerp(-p.tilt, p.tilt * 0.55, turn) * (1 - settle * 0.6),
        lerp(-0.025, 0.015, turn),
      );
      rig.rotation.y -= reveal * 0.52;
      rig.rotation.x += reveal * 0.14;
      rig.position.set(
        lerp(0.06, -0.06, turn),
        lerp(-0.1, 0.04, enter) + Math.sin(turn * Math.PI) * p.lift * 0.2,
        0,
      );
      camera.position.set(
        0,
        0,
        p.distance +
          lerp(0.35, 0, enter) -
          Math.sin(turn * Math.PI) * 0.2 +
          reveal * 2.9,
      );
      camera.lookAt(0, 0, 0);
      shadow.position.y = -0.2 - p.lift * 0.1;
      shadowMaterial.uniforms.strength.value = 0.15 + p.lift * 0.16;
      fieldMaterial.uniforms.time.value = time;
      fieldMaterial.uniforms.amount.value = p.atmosphere;
      fieldMaterial.uniforms.base.value.set(document.background);
    },
  };
}
