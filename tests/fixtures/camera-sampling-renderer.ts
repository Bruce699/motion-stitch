import { SceneEngine } from "../../src/renderer/engine";
import { SceneSchema } from "../../src/core/schema";
import { withCameraPatch } from "../../src/core/camera";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};
const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const state = {
  samples: [] as number[],
  fail: false,
  pause: undefined as Promise<void> | undefined,
  concurrent: 0,
  maxConcurrent: 0,
};
(window as any).cameraSamplingState = state;
const code = `export default ({THREE,world,camera,surfaces,registerCameraFrame}) => {
  const group = new THREE.Group(); world.add(group); registerCameraFrame('ui',group);
  const material = new THREE.MeshBasicMaterial({map:surfaces.ui,transparent:true,toneMapped:false});
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3,3),material);group.add(mesh);
  camera.position.z=7;
  return {async sample({document,time}) {
    const state=window.cameraSamplingState;
    state.concurrent++;state.maxConcurrent=Math.max(state.maxConcurrent,state.concurrent);
    try {
      const focus=document.camera?.depthOfField?.focusPlane??0;
      state.samples.push(focus);
      mesh.position.x=focus*.08;mesh.position.z=.2+time*.1;
      if(state.pause)await state.pause;
      if(state.fail){state.fail=false;throw new Error('Authored scene failed');}
    } finally {state.concurrent--;}
  }};
}`;

async function run() {
  let doc = SceneSchema.parse({
    version: 1,
    id: "camera-sampling",
    name: "Camera sampling",
    duration: 2,
    fps: 30,
    size: { width: 480, height: 300 },
    background: "#dadada",
    entry: "scene.ts",
    sources: [
      {
        id: "ui",
        kind: "web",
        entry: "index.html",
        width: 128,
        height: 128,
        sampling: "controlled",
      },
    ],
    parameters: {},
    tracks: [],
    camera: { projection: "orthographic", preset: "front" },
  });
  const texture = document.createElement("canvas");
  texture.width = texture.height = 128;
  const ctx = texture.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = "#000";
  for (let i = 0; i < 120; i += 10) ctx.fillRect(8, i, 112, 3);
  const image = texture.toDataURL();
  let sourceRequests = 0,
    failSource = false;
  const engine = new SceneEngine(doc, async (time, revision, _zoom, known) => {
    sourceRequests++;
    if (failSource) {
      failSource = false;
      throw new Error("Source failed");
    }
    const images: Record<string, string> =
      known?.ui === "pixels" ? {} : { ui: image };
    return {
      images,
      imageVersions: { ui: "pixels" },
      sample: { time, revision },
      sourceMemoryBytes: 131072,
    };
  });
  document.body.append(engine.canvas);
  const url = URL.createObjectURL(
    new Blob([code], { type: "text/javascript" }),
  );
  await engine.init(url);
  URL.revokeObjectURL(url);
  const internals = engine as unknown as {
    preparedSource?: { frame: { images: object; surfaces?: object } };
    surfaceDepthOfField?: { cacheBuilds: number; residentBytes: number };
  };
  const patch = (value: unknown) => {
    doc = { ...doc, camera: withCameraPatch(doc.camera, value) };
  };
  const camera = (time = 1, present = () => true) =>
    engine.sampleCamera(time, doc, present, `r${sourceRequests}`);
  const capture = () => engine.canvas.toDataURL();
  const rejects = async (promise: Promise<unknown>) => {
    let rejected = false;
    try {
      await promise;
    } catch {
      rejected = true;
    }
    assert(rejected, "Expected preparation failure");
  };
  try {
    await camera();
    assert(sourceRequests === 1, "First camera sample must acquire a source");
    const startPixels = capture();
    patch({ depthOfField: { enabled: true, focusPlane: 0.2, blur: 0.5 } });
    await camera();
    const firstFocus = capture();
    patch({ depthOfField: { focusPlane: 1.7 } });
    await camera();
    assert(
      sourceRequests === 1,
      "Same-time lens changes must reuse controlled source state",
    );
    assert(
      firstFocus !== capture() && startPixels !== capture(),
      "Drafts must change presented pixels",
    );
    assert(
      state.samples.at(-1) === 1.7,
      "Authored sample must receive the current draft document",
    );
    assert(
      engine.metrics?.decodedImages === 0 &&
        engine.metrics?.transferredBytes === 0,
      "Reusing a prepared source must neither decode nor transfer images",
    );
    assert(
      Object.keys(internals.preparedSource!.frame.images).length === 0 &&
        internals.preparedSource!.frame.surfaces === undefined,
      "Retained source metadata must not retain encoded pixels",
    );

    const warm = internals.surfaceDepthOfField!;
    const textures = engine.renderer.info.memory.textures;
    const builds = warm.cacheBuilds;
    patch({ depthOfField: { blur: 0 } });
    await camera();
    const zeroPixels = capture();
    assert(
      internals.surfaceDepthOfField === warm && warm.cacheBuilds === builds,
      "Zero blur must preserve a warm cache while enabled",
    );
    assert(
      engine.renderer.info.memory.textures === textures,
      "Zero must not churn effect textures",
    );
    assert(
      (engine.metrics?.renderTargetBytes ?? 0) >= warm.residentBytes,
      "Memory accounting must include the retained zero-blur cache",
    );
    patch({ depthOfField: { blur: 0.5 } });
    await camera();
    assert(
      internals.surfaceDepthOfField === warm && warm.cacheBuilds === builds,
      "Returning from zero must reuse the same pyramids",
    );
    patch({ depthOfField: { enabled: false } });
    await camera();
    assert(
      capture() === zeroPixels,
      "Zero blur must exactly equal disabled rendering",
    );
    assert(
      !internals.surfaceDepthOfField,
      "Disabling must release the effect cache",
    );

    let before = sourceRequests;
    await engine.sample(1, doc);
    assert(
      sourceRequests === before + 1,
      "Normal controlled sampling must not use the camera shortcut",
    );
    before = sourceRequests;
    await camera(1.5);
    assert(
      sourceRequests === before + 1,
      "Changing time must acquire source state",
    );
    before = sourceRequests;
    doc = { ...doc, capture: { density: 2 } };
    await camera(1.5);
    assert(
      sourceRequests === before + 1,
      "Changing capture settings must acquire source state",
    );
    before = sourceRequests;
    doc = { ...doc, sources: doc.sources.map((s) => ({ ...s, width: 129 })) };
    await camera(1.5);
    assert(
      sourceRequests === before + 1,
      "Changing source contract must acquire source state",
    );
    before = sourceRequests;
    patch({ zoom: 1.2 });
    await camera(1.5);
    assert(
      sourceRequests === before + 1,
      "Changing capture zoom must acquire source state",
    );

    const beforeFailure = capture();
    state.fail = true;
    patch({ depthOfField: { focusPlane: 4 } });
    await rejects(camera(1.5));
    engine.renderView();
    assert(
      capture() === beforeFailure,
      "Failed authored sampling must retain the last good canvas",
    );
    before = sourceRequests;
    await camera(1.5);
    assert(
      sourceRequests === before + 1,
      "A failed frame must invalidate prepared-source reuse",
    );
    const beforeInvalidation = capture();
    patch({ depthOfField: { focusPlane: -2 } });
    await camera(1.5, () => false);
    engine.renderView();
    assert(
      capture() === beforeInvalidation,
      "Invalidated sampling must not leak through redraw",
    );
    before = sourceRequests;
    await camera(1.5);
    assert(
      sourceRequests === before + 1,
      "An invalidated frame must invalidate prepared-source reuse",
    );
    failSource = true;
    await rejects(engine.sample(1.5, doc));
    before = sourceRequests;
    await camera(1.5);
    assert(
      sourceRequests === before + 1,
      "A failed normal source acquisition must force reacquisition",
    );

    let resume!: () => void;
    state.pause = new Promise<void>((resolve) => {
      resume = resolve;
    });
    const beforeAsync = capture();
    patch({ depthOfField: { focusPlane: 2 } });
    const first = camera(1.5);
    await nextTask();
    patch({ depthOfField: { focusPlane: -3 } });
    const second = camera(1.5);
    await nextTask();
    engine.renderView();
    assert(
      capture() === beforeAsync,
      "An awaiting authored sample must not expose its partial mutations",
    );
    state.pause = undefined;
    resume();
    await Promise.all([first, second]);
    assert(
      state.maxConcurrent === 1 && state.samples.at(-1) === -3,
      "Draft sampling must stay serialized and present the newest completed draft",
    );

    patch({ depthOfField: { enabled: true, blur: 0.5 } });
    await camera(1.5);
    engine.mode = "source";
    await camera(1.5);
    assert(!internals.surfaceDepthOfField, "Source view must release effects");
    assert(
      engine.renderer.getContext().getError() === 0,
      "WebGL must remain error free",
    );
    const report = {
      passed: true,
      sourceRequests,
      authoredSamples: state.samples.length,
      sameTimeSourceReuse: true,
      customSceneDrafts: true,
      exactZero: true,
      noEncodedRetention: true,
      invalidationRecovery: true,
      serializedAsyncSamples: true,
      zeroBlurCacheRetention: true,
      disabledAndSourceRelease: true,
    };
    engine.dispose();
    assert(
      !internals.preparedSource,
      "Disposal must release prepared source metadata",
    );
    return report;
  } finally {
    engine.dispose();
  }
}
(window as any).runCameraSamplingChecks = run;
