import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import {
  shots,
  duoShots,
  nearestShot,
  nearestTurn,
  approach,
  clamp,
} from "./motion.mjs";

const $ = (s) => document.querySelector(s),
  stage = $("#stage");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.append(renderer.domElement);
const scene = new THREE.Scene(),
  camera = new THREE.PerspectiveCamera(27, 1, 0.01, 100);
const productRoot = new THREE.Group();
scene.add(productRoot);
const pmrem = new THREE.PMREMGenerator(renderer);

// Original studio rigs: luminous cards baked once into two roughness-filtered
// cubemaps. The visible scene contains only the phone, never these light cards.
function studio(alternate = false) {
  const room = new THREE.Scene();
  room.background = new THREE.Color(0.16, 0.16, 0.16);
  const cards = alternate
    ? [
        [[-4, 1, 2], [2.8, 7], 5],
        [[3, 2, 1], [1.2, 6], 12],
        [[0, 5, -1], [6, 2], 5],
        [[0, 0, -5], [5, 6], 3],
      ]
    : [
        [[-3, 2, 4], [4, 7], 5],
        [[4, 1, 2], [1.2, 7], 9],
        [[0, 5, 0], [5, 3], 6],
        [[1, 0, -5], [4, 5], 4],
      ];
  for (const [pos, size, intensity] of cards) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(...size),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(intensity, intensity, intensity),
        side: THREE.DoubleSide,
      }),
    );
    m.position.fromArray(pos);
    m.lookAt(0, 0, 0);
    room.add(m);
  }
  const rt = pmrem.fromScene(room, 0.04, 0.1, 40, { size: 256 });
  room.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });
  return rt;
}
const envA = studio(),
  envB = studio(true),
  blend = { value: 0.25 };
scene.environment = envA.texture;
function tune(material) {
  material.envMapIntensity = $("#lighting").checked ? 1 : 0.12;
  material.wireframe = $("#wireframe").checked;
  if (material.map) {
    material.map.anisotropy = Math.min(
      8,
      renderer.capabilities.getMaxAnisotropy(),
    );
  }
  material.onBeforeCompile = (shader) => {
    shader.uniforms.labEnvironmentB = { value: envB.texture };
    shader.uniforms.labEnvironmentBlend = blend;
    let chunk = THREE.ShaderChunk.envmap_physical_pars_fragment;
    chunk = chunk.replaceAll(
      "vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );",
      "vec4 envMapColor = mix(textureCubeUV(envMap, envMapRotation * worldNormal, 1.0), textureCubeUV(labEnvironmentB, envMapRotation * worldNormal, 1.0), labEnvironmentBlend);",
    );
    chunk = chunk.replaceAll(
      "vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );",
      "vec4 envMapColor = mix(textureCubeUV(envMap, envMapRotation * reflectVec, roughness), textureCubeUV(labEnvironmentB, envMapRotation * reflectVec, roughness), labEnvironmentBlend);",
    );
    shader.fragmentShader =
      "uniform sampler2D labEnvironmentB;\nuniform float labEnvironmentBlend;\n" +
      shader.fragmentShader.replace(
        "#include <envmap_physical_pars_fragment>",
        chunk,
      );
  };
  material.customProgramCacheKey = () => "lab-two-studios-v1";
}
const manager = new THREE.LoadingManager();
const ktx = new KTX2Loader(manager)
  .setTranscoderPath("/basis/")
  .detectSupport(renderer);
manager.addHandler(/\.ktx$/, ktx);
const gltfLoader = new GLTFLoader(manager).setKTX2Loader(ktx);
const textureVariant =
  new URLSearchParams(location.search).get("textures") === "avif" ||
  !renderer.extensions.has("WEBGL_compressed_texture_astc")
    ? "avif"
    : "ktx";
const models = new Map();
let active,
  product = "pro",
  request = 0,
  loadedAt = 0;
let current = {
    yaw: -0.65,
    pitch: 0.12,
    zoom: 1,
    light: 0.25,
    targetY: 0,
    fold: 0,
    roll: 0,
  },
  target = { ...current };
let raf = 0,
  last = 0,
  drag = null,
  frames = 0,
  drawMs = [],
  frameIntervals = [],
  benchmark = null,
  visible = true;
let selected = shots[0],
  activeShots = shots;
function invalidate() {
  if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
}
function resize() {
  const { width, height } = stage.getBoundingClientRect();
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  invalidate();
}
new ResizeObserver(resize).observe(stage);
new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  if (visible) invalidate();
}).observe(stage);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    last = 0;
    invalidate();
  }
});

async function loadProduct(id) {
  benchmark = null;
  frameIntervals = [];
  drawMs = [];
  const ticket = ++request;
  product = id;
  $("#loader").hidden = false;
  $("#loader").textContent = "Loading model…";
  document.body.classList.toggle("duo", id === "duo");
  $(".fold").hidden = id !== "duo";
  document
    .querySelectorAll("[data-product]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.product === id)),
    );
  const started = performance.now();
  try {
    let result = models.get(id);
    if (!result) {
      const gltf = await gltfLoader.loadAsync(
        `/assets/${id}/${textureVariant}/model.gltf`,
      );
      const model = gltf.scene;
      let mixer, action;
      if (id === "duo") {
        mixer = new THREE.AnimationMixer(model);
        const clip = gltf.animations.find((c) => c.name === "Slider");
        if (clip) {
          action = mixer.clipAction(clip);
          action.play();
          action.paused = true;
          action.time = 0;
          mixer.update(0);
        }
      }
      if (id === "duo") {
        model.rotation.x = Math.PI / 2;
        model.rotation.z = Math.PI;
      } else model.rotation.y = Math.PI;
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model, true),
        size = box.getSize(new THREE.Vector3()),
        center = box.getCenter(new THREE.Vector3());
      const container = new THREE.Group(),
        scale = (id === "duo" ? 2.25 : 2.7) / Math.max(size.x, size.y, size.z);
      container.scale.setScalar(scale);
      model.position.sub(center);
      container.add(model);
      let triangles = 0,
        meshes = 0;
      const materials = new Set();
      model.traverse((o) => {
        if (o.isMesh) {
          meshes++;
          triangles +=
            (o.geometry.index?.count ?? o.geometry.attributes.position.count) /
            3;
          o.frustumCulled = false;
          for (const m of Array.isArray(o.material)
            ? o.material
            : [o.material]) {
            materials.add(m);
            tune(m);
          }
        }
      });
      const centers = [];
      container.updateMatrixWorld(true);
      if (action) {
        for (let i = 0; i <= 10; i++) {
          action.time = (i / 10) * action.getClip().duration;
          mixer.update(0);
          model.updateMatrixWorld(true);
          centers.push(
            new THREE.Box3()
              .setFromObject(model, true)
              .getCenter(new THREE.Vector3()),
          );
        }
        action.time = 0;
        mixer.update(0);
      }
      let screenMaterial, screenTextures;
      if (id === "duo") {
        screenMaterial = [...materials].find(
          (m) => m.name === "pkUBCyCvYJYVzTr",
        );
        const loader =
          textureVariant === "ktx" ? ktx : new THREE.TextureLoader();
        const extra = await Promise.all(
          ["iFSuhcVrhLhMisa", "vHeRSOZUeAIaYwi"].map((name) =>
            loader.loadAsync(
              `/assets/duo/${textureVariant}/${name}.${textureVariant}`,
            ),
          ),
        );
        for (const texture of extra) {
          texture.flipY = false;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(
            8,
            renderer.capabilities.getMaxAnisotropy(),
          );
        }
        screenTextures = {
          landscape: screenMaterial.emissiveMap,
          portrait: extra[0],
          seated: extra[1],
        };
      }
      result = {
        gltf,
        model,
        container,
        mixer,
        action,
        materials,
        triangles,
        meshes,
        centers,
        screenMaterial,
        screenTextures,
        size: size.toArray(),
        center: center.toArray(),
        scale,
      };
      models.set(id, result);
    }
    if (ticket !== request) return;
    if (active) productRoot.remove(active.container);
    active = result;
    productRoot.add(result.container);
    $("#loader").textContent = "Preparing lighting…";
    activeShots = id === "duo" ? duoShots : shots;
    renderShots();
    selectShot(activeShots[0], true);
    current.fold = target.fold = 0;
    $("#fold").value = "0";
    $("#fold-value").value = "Closed";
    if (active.action) {
      active.action.time = 0;
      active.mixer.update(0);
    }
    resize();
    positionCamera();
    await renderer.compileAsync(scene, camera);
    if (ticket !== request) return;
    renderer.render(scene, camera);
    $("#loader").hidden = true;
    loadedAt = performance.now() - started;
    invalidate();
    updateStats();
  } catch (error) {
    console.error(error);
    $("#loader").textContent = `Could not load model: ${error.message}`;
  }
}
function selectShot(shot, immediate = false) {
  selected = shot;
  target = {
    yaw: nearestTurn(shot.yaw, current.yaw),
    pitch: shot.pitch,
    zoom: shot.zoom,
    light: shot.light,
    targetY: shot.targetY ?? 0,
    roll: shot.roll ?? 0,
    fold: shot.fold ?? target.fold,
  };
  $("#fold").value = String(target.fold);
  $("#fold-value").value = foldLabel(target.fold);
  if (active?.screenMaterial && active.screenTextures[shot.id])
    active.screenMaterial.emissiveMap = active.screenTextures[shot.id];
  if (immediate || reduced.matches) current = { ...target };
  $("#shot-name").textContent = shot.label;
  document
    .querySelectorAll("[data-shot]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.shot === shot.id)),
    );
  invalidate();
}
function renderShots() {
  $("#shots").replaceChildren();
  for (const shot of activeShots) {
    const b = document.createElement("button");
    b.textContent = shot.label;
    b.dataset.shot = shot.id;
    b.setAttribute("aria-pressed", String(shot === selected));
    b.onclick = () => selectShot(shot);
    $("#shots").append(b);
  }
}
const foldLabel = (v) =>
  v < 0.02 ? "Closed" : v > 0.98 ? "Open" : Math.round(v * 180) + "°";
function positionCamera() {
  const mobile = stage.clientWidth < 700;
  const distance =
    ((mobile ? 8.7 : 7.4) *
      (product === "duo" ? 1 + current.fold * (mobile ? 0.65 : 0.32) : 1)) /
    current.zoom;
  camera.position.set(
    Math.sin(current.yaw) * Math.cos(current.pitch) * distance,
    Math.sin(current.pitch) * distance + current.targetY,
    Math.cos(current.yaw) * Math.cos(current.pitch) * distance,
  );
  camera.lookAt(0, current.targetY, 0);
  // Off-axis composition leaves room for the shot menu, without moving model space.
  camera.setViewOffset(
    stage.clientWidth,
    stage.clientHeight,
    mobile ? 0 : -stage.clientWidth * 0.11,
    mobile ? -stage.clientHeight * 0.025 : 0,
    stage.clientWidth,
    stage.clientHeight,
  );
  blend.value = current.light;
  productRoot.rotation.z = current.roll;
  if (active?.action) {
    active.action.time = current.fold * active.action.getClip().duration;
    active.mixer.update(0);
    const t = clamp(current.fold, 0, 1) * 10,
      index = Math.min(9, Math.floor(t));
    active.container.position
      .copy(active.centers[index])
      .lerp(active.centers[index + 1], t - index)
      .negate();
  }
}
function frame(now) {
  raf = 0;
  const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
  last = now;
  if (benchmark) {
    target.yaw =
      benchmark.startYaw + ((now - benchmark.start) / 6000) * Math.PI * 2;
    target.light = (Math.sin(now / 700) + 1) / 2;
  }
  let moving = false;
  for (const key of [
    "yaw",
    "pitch",
    "zoom",
    "light",
    "targetY",
    "fold",
    "roll",
  ]) {
    const diff = Math.abs(current[key] - target[key]);
    if (diff > 0.00015) {
      current[key] =
        reduced.matches && !drag
          ? target[key]
          : approach(current[key], target[key], drag ? 19 : 7.3, dt);
      moving = true;
    } else current[key] = target[key];
  }
  positionCamera();
  const t = performance.now();
  renderer.render(scene, camera);
  drawMs.push(performance.now() - t);
  if (drawMs.length > 2048) drawMs.shift();
  frames++;
  if (benchmark) {
    frameIntervals.push(now - benchmark.previous);
    benchmark.previous = now;
    if (now - benchmark.start > 6000) {
      benchmark = null;
      selectShot(selected);
      updateStats(true);
    }
  }
  if (moving || drag || benchmark) invalidate();
  else {
    last = 0;
    updateStats();
  }
}
stage.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  stage.setPointerCapture(e.pointerId);
  drag = {
    id: e.pointerId,
    x: e.clientX,
    y: e.clientY,
    time: e.timeStamp,
    velocity: 0,
  };
  target.yaw = current.yaw;
  target.pitch = current.pitch;
  benchmark = null;
  invalidate();
});
stage.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x,
    dy = e.clientY - drag.y,
    dt = Math.max(8, e.timeStamp - drag.time);
  const sensitivity = stage.clientWidth < 700 ? 0.012 : 0.006;
  target.yaw -= dx * sensitivity;
  target.pitch = clamp(target.pitch + dy * sensitivity * 0.6, -0.55, 0.55);
  drag.velocity =
    drag.velocity * 0.35 + ((-dx * sensitivity) / (dt / 1000)) * 0.65;
  drag.x = e.clientX;
  drag.y = e.clientY;
  drag.time = e.timeStamp;
  invalidate();
});
function release(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const velocity =
    e.type === "pointercancel" || e.timeStamp - drag.time > 100
      ? 0
      : drag.velocity;
  drag = null;
  if (stage.hasPointerCapture(e.pointerId))
    stage.releasePointerCapture(e.pointerId);
  if ($("#snap").checked) {
    const snap = nearestShot(
      shots.filter((s) => s.id !== "camera"),
      target.yaw,
      target.pitch,
      velocity,
    );
    selectShot(
      product === "duo"
        ? { ...snap, fold: target.fold, roll: target.roll }
        : snap,
    );
  } else invalidate();
}
stage.addEventListener("pointerup", release);
stage.addEventListener("pointercancel", release);
stage.addEventListener("lostpointercapture", (e) => {
  if (drag) release(e);
});
stage.addEventListener("keydown", (e) => {
  if (!["ArrowLeft", "ArrowRight", "Home"].includes(e.key)) return;
  e.preventDefault();
  const i = Math.max(0, activeShots.indexOf(selected));
  selectShot(
    e.key === "Home"
      ? activeShots[0]
      : activeShots[
          (i + (e.key === "ArrowRight" ? 1 : -1) + activeShots.length) %
            activeShots.length
        ],
    true,
  );
});
$("#fold").addEventListener("input", (e) => {
  target.fold = +e.target.value;
  $("#fold-value").value = foldLabel(target.fold);
  invalidate();
});
document
  .querySelectorAll("[data-product]")
  .forEach((b) => (b.onclick = () => loadProduct(b.dataset.product)));
$("#reset").onclick = () => {
  selectShot(activeShots[0]);
  target.fold = 0;
  $("#fold").value = 0;
  $("#fold-value").value = "Closed";
};
$("#inspect").onclick = () => {
  const open = $("#diagnostics").hidden;
  $("#diagnostics").hidden = !open;
  $("#inspect").setAttribute("aria-expanded", String(open));
  updateStats();
};
$("#wireframe").onchange = (e) => {
  for (const r of models.values())
    for (const m of r.materials) m.wireframe = e.target.checked;
  invalidate();
};
$("#lighting").onchange = (e) => {
  for (const r of models.values())
    for (const m of r.materials)
      m.envMapIntensity = e.target.checked ? 1 : 0.12;
  invalidate();
};
$("#resolution").onchange = (e) => {
  renderer.setPixelRatio(+e.target.value);
  resize();
};
$("#benchmark").onclick = () => {
  frameIntervals = [];
  drawMs = [];
  benchmark = {
    start: performance.now(),
    previous: performance.now(),
    startYaw: current.yaw,
  };
  invalidate();
};
const percentile = (a, p) =>
  a.length ? [...a].sort((x, y) => x - y)[Math.floor((a.length - 1) * p)] : 0;
function metrics() {
  return {
    product,
    three: THREE.REVISION,
    astc: renderer.extensions.has("WEBGL_compressed_texture_astc"),
    triangles: active?.triangles,
    meshes: active?.meshes,
    drawCalls: renderer.info.render.calls,
    loadMs: Math.round(loadedAt),
    frames,
    canvas: [renderer.domElement.width, renderer.domElement.height],
    dpr: renderer.getPixelRatio(),
    frameCount: frameIntervals.length,
    frameMedianMs: +percentile(frameIntervals, 0.5).toFixed(2),
    frameP95Ms: +percentile(frameIntervals, 0.95).toFixed(2),
    cpuSubmitP95Ms: +percentile(drawMs, 0.95).toFixed(2),
    over25ms: frameIntervals.filter((x) => x > 25).length,
    settled: !raf && !drag && !benchmark,
    current: { ...current },
    target: { ...target },
    modelSize: active?.size,
    animations: active?.gltf.animations.map((c) => ({
      name: c.name,
      duration: c.duration,
    })),
  };
}
function updateStats() {
  const m = metrics();
  $("#stats").textContent =
    `${m.triangles?.toLocaleString() ?? "—"} triangles · ${m.drawCalls} draw calls · ${m.canvas.join(" × ")} pixels\nModel preparation: ${m.loadMs} ms · Draws: ${frames} · ${m.settled ? "Idle: no rendering" : "Rendering"}\n${m.frameCount ? `Motion measurement: ${m.frameCount} frames · median ${m.frameMedianMs} ms · p95 ${m.frameP95Ms} ms · ${m.over25ms} intervals >25 ms\nCPU render submission p95: ${m.cpuSubmitP95Ms} ms (not GPU time)` : "Use Measure motion for a six-second local frame-cadence sample."}`;
}
window.viewerLab = {
  metrics,
  selectShot: (id) =>
    selectShot(activeShots.find((s) => s.id === id) || activeShots[0]),
  models,
  renderer,
  scene,
  camera,
  textureVariant,
};
await loadProduct("pro");
