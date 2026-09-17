import { checkSurfaceDepthOfField } from "./surface-dof-renderer";
import { SceneEngine } from "../../src/renderer/engine";
import { SceneSchema } from "../../src/core/schema";
import { withCameraPatch } from "../../src/core/camera";

const sceneCode = `export default ({THREE,world,camera,surfaces,registerCameraFrame}) => {
  const group = new THREE.Group(); world.add(group); registerCameraFrame('ui',group);
  const geometry = new THREE.PlaneGeometry(2.5,2.5);
  const material = new THREE.MeshBasicMaterial({map:surfaces.ui,transparent:true,alphaTest:.001,toneMapped:false});
  const left = new THREE.Mesh(geometry,material); left.position.x=-1.5; group.add(left);
  const right = new THREE.Mesh(geometry,material); right.position.x=1.5; group.add(right);
  const backMaterial = new THREE.ShaderMaterial({
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 vUv; void main(){gl_FragColor=vec4(vec3(step(.5,fract(vUv.y*40.))),1.);}',
    toneMapped:false
  });
  const back = new THREE.Mesh(geometry,backMaterial); back.position.set(1.5,0,-.5);group.add(back);
  camera.position.z=7;
  return {sample({time}){right.position.z=time;}};
}`;
const texture = document.createElement("canvas");
texture.width = texture.height = 512;
const ctx = texture.getContext("2d")!;
ctx.fillStyle = "#c54630";
ctx.fillRect(0, 0, 512, 512);
ctx.fillStyle = "#faf8ef";
ctx.fillRect(8, 8, 496, 496);
ctx.fillStyle = "#242424";
for (let i = 30; i < 480; i += 10) ctx.fillRect(30, i, 452, 3);
ctx.fillStyle = "#2778bd";
ctx.fillRect(80, 170, 352, 150);
ctx.fillStyle = "#ffffff";
ctx.font = "32px system-ui";
ctx.fillText("Focus plane", 155, 250);
ctx.clearRect(205, 360, 100, 100);
const image = texture.toDataURL();

async function run() {
  const doc = SceneSchema.parse({
    version: 1,
    id: "dof",
    name: "DOF check",
    duration: 2,
    fps: 30,
    size: { width: 960, height: 600 },
    background: "#d8d7d4",
    entry: "scene.ts",
    sources: [
      {
        id: "ui",
        kind: "web",
        entry: "index.html",
        width: 512,
        height: 512,
        sampling: "controlled",
      },
    ],
    parameters: {},
    tracks: [],
    camera: { projection: "orthographic", preset: "front" },
  });
  let transfers = 0;
  const engine = new SceneEngine(
    doc,
    async (_time, _revision, _zoom, known) => {
      const images: Record<string, string> =
        known?.ui === "fixed" ? {} : { ui: image };
      if (Object.keys(images).length) transfers++;
      return { images, imageVersions: { ui: "fixed" } };
    },
  );
  document.body.append(engine.canvas);
  const url = URL.createObjectURL(
    new Blob([sceneCode], { type: "text/javascript" }),
  );
  await engine.init(url);
  URL.revokeObjectURL(url);
  const shots: Record<string, string> = {};
  const capture = async (name: string, time = 1) => {
    await engine.sample(time);
    shots[name] = engine.canvas.toDataURL();
  };
  const patch = (value: unknown) => {
    engine.document = {
      ...engine.document,
      camera: withCameraPatch(engine.document.camera, value),
    };
  };
  await capture("off");
  const baseline = { ...engine.renderer.info.memory };
  patch({ depthOfField: { enabled: true, focusPlane: 0, blur: 0.7 } });
  await capture("focus-back");
  patch({ depthOfField: { focusPlane: 1 } });
  await capture("focus-front");
  patch({ depthOfField: { blur: 0 } });
  await capture("zero-blur");
  patch({ depthOfField: { blur: 0.7 } });
  await capture("later", 1.5);
  await capture("backward", 1);
  patch({ projection: "perspective" });
  await capture("perspective");
  patch({ projection: "orthographic" });
  engine.mode = "source";
  await capture("source-on");
  patch({ depthOfField: { enabled: false } });
  await capture("source-off");
  engine.mode = "camera";
  const timings: Record<string, number> = {};
  for (const size of [
    { width: 960, height: 600 },
    { width: 3840, height: 2160 },
  ]) {
    engine.document = { ...engine.document, size };
    for (const enabled of [false, true]) {
      patch({ depthOfField: { enabled } });
      await engine.sample(1);
      const gl = engine.renderer.getContext() as WebGL2RenderingContext;
      for (let i = 0; i < 10; i++) engine.renderView();
      gl.finish();
      const start = performance.now();
      for (let i = 0; i < 60; i++) engine.renderView();
      gl.finish();
      timings[
        `${size.width}x${size.height}-${enabled ? "onCpuMsPerFrame" : "offCpuMsPerFrame"}`
      ] = (performance.now() - start) / 60;
      const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
      if (ext) {
        const query = gl.createQuery()!;
        gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
        for (let i = 0; i < 30; i++) engine.renderView();
        gl.endQuery(ext.TIME_ELAPSED_EXT);
        gl.flush();
        const deadline = performance.now() + 10000;
        while (!gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) {
          if (performance.now() > deadline)
            throw new Error("GPU timer query timed out");
          await new Promise((resolve) => setTimeout(resolve, 5));
        }
        if (!gl.getParameter(ext.GPU_DISJOINT_EXT))
          timings[
            `${size.width}x${size.height}-${enabled ? "onGpuMsPerFrame" : "offGpuMsPerFrame"}`
          ] = gl.getQueryParameter(query, gl.QUERY_RESULT) / 30 / 1e6;
        gl.deleteQuery(query);
      }
    }
  }
  engine.document = { ...engine.document, size: { width: 960, height: 600 } };
  engine.setPreviewViewport(720, 450, 2);
  await capture("retina");
  engine.setPreviewViewport(480, 300, 1);
  await capture("resized");
  for (let i = 0; i < 5; i++) {
    patch({ depthOfField: { enabled: true } });
    await engine.sample(1);
    patch({ depthOfField: { enabled: false } });
    await engine.sample(1);
  }
  const released = { ...engine.renderer.info.memory };
  await capture("disabled-again");
  const glError = engine.renderer.getContext().getError();
  engine.dispose();
  const surfaces = checkSurfaceDepthOfField();
  return {
    shots: { ...shots, ...surfaces.shots },
    surfaceMetrics: surfaces.metrics,
    baseline,
    released,
    transfers,
    timings,
    glError,
  };
}
(window as any).runDepthOfFieldChecks = run;
