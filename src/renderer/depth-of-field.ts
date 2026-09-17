import * as THREE from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";

/** Focus is an offset from a camera-facing plane through the source origin. */
export function focusDistance(
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  origin: THREE.Vector3,
  offset: number,
) {
  camera.updateMatrixWorld(true);
  const e = camera.matrixWorldInverse.elements;
  const depth = -(e[2] * origin.x + e[6] * origin.y + e[10] * origin.z + e[14]);
  return THREE.MathUtils.clamp(depth - offset, camera.near, camera.far);
}

const vertexShader = `varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
const levels = 6;
const RGBA16F_BYTES = 8;
const DEPTH32_BYTES = 4;
/** Resolved color/depth plus optional multisample color/depth attachments and
 * six RGBA16f target/scratch pairs. Driver bookkeeping is outside this estimate.
 */
export function depthOfFieldMemory(
  width: number,
  height: number,
  samples: number,
) {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    !Number.isSafeInteger(samples) ||
    samples < 0
  )
    throw new Error(
      "Depth of field needs positive integer viewport dimensions and a nonnegative sample count",
    );
  const colorBytes =
    width * height * (RGBA16F_BYTES + DEPTH32_BYTES) * (1 + samples);
  let pyramidBytes = 0;
  const sizes = Array.from({ length: levels }, (_, i) => {
    const w = Math.max(1, Math.ceil(width / 2 ** (i + 1)));
    const h = Math.max(1, Math.ceil(height / 2 ** (i + 1)));
    pyramidBytes += w * h * RGBA16F_BYTES * 2;
    return { width: w, height: h };
  });
  return {
    residentBytes: colorBytes + pyramidBytes,
    colorBytes,
    pyramidBytes,
    sizes,
  };
}

/** One scene draw supplies both color and actual material depth. No depth proxies.
 * A Gaussian pyramid bounds filtering cost; full-resolution color stays available
 * for the focus plane. All targets are lazy, reused, resized and explicitly freed.
 */
export class DepthOfField {
  private readonly color: THREE.WebGLRenderTarget;
  private readonly targets: THREE.WebGLRenderTarget[] = [];
  private readonly scratch: THREE.WebGLRenderTarget[] = [];
  private readonly size = new THREE.Vector2();
  private allocationBytes = 0;
  private allocatedWidth = 0;
  private allocatedHeight = 0;
  private readonly filter = new THREE.ShaderMaterial({
    uniforms: {
      source: { value: null },
      direction: { value: new THREE.Vector2() },
      depth: { value: null },
      firstPass: { value: false },
      nearClip: { value: 0.01 },
      farClip: { value: 100 },
      focus: { value: 7 },
      perspective: { value: true },
    },
    vertexShader,
    // A nine-tap Gaussian reduced to five bilinear texture reads. Sampling stays
    // contiguous at each level, avoiding the prototype's sparse bokeh rings.
    fragmentShader: `varying vec2 vUv;
uniform sampler2D source;
uniform sampler2D depth;
uniform vec2 direction;
uniform bool firstPass, perspective;
uniform float nearClip, farClip, focus;
#include <packing>
vec4 sampleColor(vec2 uv) {
  vec4 color = texture2D(source, uv);
  if (!firstPass) return color;
  float z = texture2D(depth, uv).x;
  float distance = perspective ? -perspectiveDepthToViewZ(z, nearClip, farClip)
                               : -orthographicDepthToViewZ(z, nearClip, farClip);
  // Exclude focused silhouettes from the blurred surroundings. Filter the
  // weighted color and coverage together, then normalize at composition.
  float coverage = smoothstep(0., .15, abs(distance - focus));
  return vec4(color.rgb * coverage, coverage);
}
void main() {
  vec4 color = sampleColor(vUv) * .2270270270;
  color += (sampleColor(vUv + direction * 1.3846153846)
          + sampleColor(vUv - direction * 1.3846153846)) * .3162162162;
  color += (sampleColor(vUv + direction * 3.2307692308)
          + sampleColor(vUv - direction * 3.2307692308)) * .0702702703;
  gl_FragColor = color;
}`,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NoBlending,
    toneMapped: false,
  });
  private readonly composite = new THREE.ShaderMaterial({
    uniforms: {
      source: { value: null },
      depth: { value: null },
      nearClip: { value: 0.01 },
      farClip: { value: 100 },
      perspective: { value: true },
      focus: { value: 7 },
      strength: { value: 0.35 },
      pixelHeight: { value: 900 },
      ...Object.fromEntries(
        Array.from({ length: levels }, (_, i) => [`blur${i}`, { value: null }]),
      ),
    },
    vertexShader,
    fragmentShader: `varying vec2 vUv;
uniform sampler2D source, depth;
${Array.from({ length: levels }, (_, i) => `uniform sampler2D blur${i};`).join("\n")}
uniform float nearClip, farClip, focus, strength, pixelHeight;
uniform bool perspective;
#include <packing>
vec4 normalizedColor(vec4 color) {
  return color.a > .0001 ? vec4(color.rgb / color.a, 1.) : texture2D(source, vUv);
}
vec4 blurAt(float level) {
  if (level < 1.) return texture2D(source, vUv);
  ${Array.from({ length: levels - 1 }, (_, i) => `if (level < ${i + 2}.) return normalizedColor(texture2D(blur${i}, vUv));`).join("\n")}
  return normalizedColor(texture2D(blur5, vUv));
}
void main() {
  float z = texture2D(depth, vUv).x;
  float distance = perspective ? -perspectiveDepthToViewZ(z, nearClip, farClip)
                               : -orthographicDepthToViewZ(z, nearClip, farClip);
  float defocus = abs(distance - focus);
  // A narrow eased transition keeps nearly coplanar UI text crisp. Strength
  // controls both the falloff and its cap; a one-unit difference reaches the cap.
  float radius = min(1., defocus * smoothstep(0., .15, defocus)) * strength * pixelHeight * .025;
  float level = clamp(log2(1. + radius * .5), 0., 6.);
  gl_FragColor = vec4(mix(blurAt(floor(level)), blurAt(ceil(level)), fract(level)).rgb, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NoBlending,
  });
  private readonly quad = new FullScreenQuad(this.filter);

  constructor(private readonly renderer: THREE.WebGLRenderer) {
    this.color = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: Math.min(4, renderer.capabilities.maxSamples),
      depthTexture: new THREE.DepthTexture(1, 1, THREE.UnsignedIntType),
      stencilBuffer: false,
    });
    this.color.texture.name = "Tilt DOF color";
    for (let i = 0; i < levels; i++) {
      const options = { type: THREE.HalfFloatType, depthBuffer: false };
      this.targets.push(new THREE.WebGLRenderTarget(1, 1, options));
      this.scratch.push(new THREE.WebGLRenderTarget(1, 1, options));
      this.composite.uniforms[`blur${i}`].value = this.targets[i].texture;
    }
    this.composite.uniforms.source.value = this.color.texture;
    this.composite.uniforms.depth.value = this.color.depthTexture;
    this.filter.uniforms.depth.value = this.color.depthTexture;
  }

  get residentBytes() {
    return this.allocationBytes;
  }

  estimateMemory() {
    const output = this.renderer.getRenderTarget();
    if (output) this.size.set(output.width, output.height);
    else this.renderer.getDrawingBufferSize(this.size);
    const next = depthOfFieldMemory(
      this.size.x,
      this.size.y,
      this.color.samples,
    );
    const changed =
      this.allocatedWidth !== this.size.x ||
      this.allocatedHeight !== this.size.y;
    // WebGL may retain old attachments until queued work finishes. Reserve both
    // generations on resize even though Three disposes the old targets first.
    return {
      residentBytes: this.residentBytes,
      nextResidentBytes: next.residentBytes,
      peakBytes: changed
        ? this.residentBytes + next.residentBytes
        : this.residentBytes,
    };
  }

  render(
    world: THREE.Scene,
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    focus: number,
    strength: number,
  ) {
    const renderer = this.renderer;
    const output = renderer.getRenderTarget();
    if (output) this.size.set(output.width, output.height);
    else renderer.getDrawingBufferSize(this.size);
    const width = this.size.x,
      height = this.size.y;
    const allocation = depthOfFieldMemory(width, height, this.color.samples);
    if (this.color.width !== width || this.color.height !== height) {
      this.color.setSize(width, height);
      for (let i = 0; i < levels; i++) {
        const { width: w, height: h } = allocation.sizes[i];
        this.targets[i].setSize(w, h);
        this.scratch[i].setSize(w, h);
      }
    }
    const target = renderer.getRenderTarget();
    const autoClear = renderer.autoClear;
    // Conservatively account for all planned targets even if drawing fails
    // halfway through allocation; the next retry reuses their storage.
    this.allocationBytes = allocation.residentBytes;
    this.allocatedWidth = width;
    this.allocatedHeight = height;
    try {
      renderer.autoClear = true;
      renderer.setRenderTarget(this.color);
      renderer.render(world, camera);
      this.quad.material = this.filter;
      const filter = this.filter.uniforms;
      filter.nearClip.value = camera.near;
      filter.farClip.value = camera.far;
      filter.perspective.value = camera instanceof THREE.PerspectiveCamera;
      filter.focus.value = focus;
      let source = this.color;
      for (let i = 0; i < levels; i++) {
        filter.firstPass.value = i === 0;
        this.filter.uniforms.source.value = source.texture;
        this.filter.uniforms.direction.value.set(1 / source.width, 0);
        renderer.setRenderTarget(this.scratch[i]);
        this.quad.render(renderer);
        filter.firstPass.value = false;
        this.filter.uniforms.source.value = this.scratch[i].texture;
        this.filter.uniforms.direction.value.set(0, 1 / this.scratch[i].height);
        renderer.setRenderTarget(this.targets[i]);
        this.quad.render(renderer);
        source = this.targets[i];
      }
      const u = this.composite.uniforms;
      u.nearClip.value = camera.near;
      u.farClip.value = camera.far;
      u.perspective.value = camera instanceof THREE.PerspectiveCamera;
      u.focus.value = focus;
      u.strength.value = strength;
      u.pixelHeight.value = height;
      this.quad.material = this.composite;
      renderer.setRenderTarget(target);
      this.quad.render(renderer);
    } finally {
      renderer.setRenderTarget(target);
      renderer.autoClear = autoClear;
    }
  }

  dispose() {
    this.color.dispose();
    for (const target of [...this.targets, ...this.scratch]) target.dispose();
    this.filter.dispose();
    this.composite.dispose();
    this.quad.dispose();
    this.allocationBytes = 0;
    this.allocatedWidth = 0;
    this.allocatedHeight = 0;
  }
}
