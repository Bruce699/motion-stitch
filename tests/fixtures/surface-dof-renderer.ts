import * as THREE from "three";
import { SurfaceDepthOfField } from "../../src/renderer/surface-depth-of-field";

export function checkSurfaceDepthOfField() {
  const width = 960,
    height = 600;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const world = new THREE.Scene(),
    group = new THREE.Group();
  world.add(group);
  const camera = new THREE.OrthographicCamera(-3.2, 3.2, 2, -2, 0.01, 100);
  camera.position.z = 7;
  const canvas = (w: number, h: number) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };
  const background = canvas(960, 600),
    bg = background.getContext("2d")!;
  bg.fillStyle = "#f5f3eb";
  bg.fillRect(0, 0, 960, 600);
  bg.fillStyle = "#1f3045";
  bg.font = "17px sans-serif";
  for (let y = 20; y < 600; y += 26)
    bg.fillText(
      "Sharp text behind overlapping transparent letters — 0123456789",
      16,
      y,
    );
  const foreground = canvas(512, 192),
    fg = foreground.getContext("2d")!;
  fg.fillStyle = "#e03030";
  fg.font = "bold 112px sans-serif";
  fg.fillText("Focus", 4, 114);
  fg.fillRect(0, 162, 512, 30);
  const bgMap = new THREE.CanvasTexture(background),
    fgMap = new THREE.CanvasTexture(foreground);
  for (const t of [bgMap, fgMap]) t.colorSpace = THREE.SRGBColorSpace;
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 4),
    new THREE.MeshBasicMaterial({
      map: bgMap,
      transparent: true,
      toneMapped: false,
    }),
  );
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.2),
    new THREE.MeshBasicMaterial({
      map: fgMap,
      transparent: true,
      alphaTest: 0.001,
      toneMapped: false,
    }),
  );
  front.position.set(0, 0.35, 1);
  front.renderOrder = 1;
  group.add(back, front);
  const effect = new SurfaceDepthOfField(renderer),
    shots: Record<string, string> = {};
  const pixels = canvas(width, height),
    ctx = pixels.getContext("2d", { willReadFrequently: true })!;
  const capture = (name: string, focus = 7, strength = 1, enabled = true) => {
    if (enabled) {
      if (!effect.supports(world))
        throw new Error("Fixture missed surface path");
      effect.render(world, camera, focus, strength);
    } else renderer.render(world, camera);
    shots[name] = renderer.domElement.toDataURL();
    ctx.drawImage(renderer.domElement, 0, 0);
    return ctx.getImageData(0, 0, width, height).data;
  };
  renderer.setClearColor("#ffffff");
  const off = capture("surface-off", 7, 1, false),
    composite = capture("surface-composite");
  front.visible = false;
  const behind = capture("surface-background");
  front.visible = true;
  back.visible = false;
  renderer.setClearColor("#000000");
  const onBlack = capture("surface-letters-black");
  renderer.setClearColor("#ffffff");
  const onWhite = capture("surface-letters-white");
  const sharpOnWhite = capture("surface-letters-sharp", 7, 1, false);
  let error = 0,
    spill = 0,
    transparentError = 0,
    transparentPixels = 0;
  for (let i = 0; i < composite.length; i += 4) {
    const alpha = 1 - (onWhite[i + 1] - onBlack[i + 1]) / 255;
    const sharpAlpha = (255 - sharpOnWhite[i + 1]) / (255 - 48);
    if (alpha > 0.01 && sharpAlpha < 0.001) spill++;
    // WebGL's default output framebuffer blends the material's output colors.
    // Independently rendered foreground over black/white recovers coverage.
    for (let c = 0; c < 3; c++)
      error += Math.abs(
        composite[i + c] - (onBlack[i + c] + behind[i + c] * (1 - alpha)),
      );
    if (alpha < 0.001) {
      transparentPixels++;
      for (let c = 0; c < 3; c++)
        transparentError += Math.abs(composite[i + c] - behind[i + c]);
    }
  }
  back.visible = true;
  capture("surface-focus-front", 6);
  const built = effect.cacheBuilds;
  for (let i = 0; i < 30; i++) {
    front.position.z = 1 + i / 30;
    capture("surface-moving", 6 + i / 30, 0.5);
  }
  front.position.z = 1;
  capture("surface-backward", 6);
  const backward = shots["surface-backward"] === shots["surface-focus-front"];
  const perspective = new THREE.PerspectiveCamera(
    32,
    width / height,
    0.01,
    100,
  );
  perspective.position.z = 7;
  effect.supports(world);
  effect.render(world, perspective, 6, 1);
  shots["surface-perspective"] = renderer.domElement.toDataURL();
  renderer.setSize(1440, 900);
  capture("surface-retina", 6);
  renderer.setSize(width, height);
  const reused = effect.cacheBuilds === built;
  fg.fillRect(0, 0, 10, 10);
  fgMap.needsUpdate = true;
  capture("surface-updated");
  const updated = effect.cacheBuilds === built + 1;
  // Animate source pixels at fixed resolution. The warm path must reuse GPU
  // allocations while matching a cold pyramid and reconstructing backward time.
  const gl = renderer.getContext();
  const createTexture = gl.createTexture,
    deleteTexture = gl.deleteTexture;
  let animatedTextureAllocations = 0,
    animatedTextureDisposals = 0;
  gl.createTexture = function () {
    animatedTextureAllocations++;
    return createTexture.call(this);
  };
  gl.deleteTexture = function (texture) {
    animatedTextureDisposals++;
    deleteTexture.call(this, texture);
  };
  const drawAnimation = (frame: number) => {
    fg.clearRect(0, 0, foreground.width, foreground.height);
    fg.fillStyle = frame % 2 ? "#16834a" : "#e03030";
    fg.fillText("Focus", 4 + frame * 3, 114);
    fg.fillRect(frame * 4, 162, 160, 30);
    fgMap.needsUpdate = true;
  };
  for (let i = 0; i < 12; i++) {
    drawAnimation(i);
    capture(`surface-animated-${i}`, 7);
  }
  drawAnimation(0);
  capture("surface-animated-backward", 7);
  gl.createTexture = createTexture;
  gl.deleteTexture = deleteTexture;
  const animatedBackward =
    shots["surface-animated-0"] === shots["surface-animated-backward"];
  const fresh = new SurfaceDepthOfField(renderer);
  fresh.supports(world);
  fresh.render(world, camera, 7, 1);
  const animatedFreshMatch =
    shots["surface-animated-backward"] === renderer.domElement.toDataURL();
  fresh.dispose();
  if (
    animatedTextureAllocations ||
    animatedTextureDisposals ||
    !animatedBackward ||
    !animatedFreshMatch
  )
    throw new Error(
      `Animated surface cache failed: ${JSON.stringify({ animatedTextureAllocations, animatedTextureDisposals, animatedBackward, animatedFreshMatch })}`,
    );
  // Different centers on tilted parallel planes must not invert the base/child order.
  group.rotation.y = 0.65;
  group.rotation.x = 0.5;
  front.position.set(1.1, 0.7, 0.01);
  const tiltedSharp = capture("surface-tilted-sharp", 7, 0, false),
    tiltedTiny = capture("surface-tilted-minimum", 7, 0.00001);
  let tiltError = 0;
  for (let i = 0; i < tiltedSharp.length; i += 4)
    for (let c = 0; c < 3; c++)
      tiltError += Math.abs(tiltedSharp[i + c] - tiltedTiny[i + c]);
  effect.dispose();
  const remaining = { ...renderer.info.memory };
  for (const m of [back, front]) {
    m.geometry.dispose();
    m.material.dispose();
  }
  bgMap.dispose();
  fgMap.dispose();
  renderer.dispose();
  renderer.forceContextLoss();
  return {
    shots,
    metrics: {
      compositeError: error / (width * height * 3),
      transparentError: transparentError / (transparentPixels * 3),
      spillPixels: spill,
      tiltedError: tiltError / (width * height * 3),
      reused,
      backward,
      updated,
      animatedTextureAllocations,
      animatedTextureDisposals,
      animatedBackward,
      animatedFreshMatch,
      remaining,
    },
  };
}
