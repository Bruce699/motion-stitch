import * as THREE from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";

const LEVELS = 8;
const RGBA16F_BYTES = 8;
/** The render targets use RGBA16f without depth or mipmaps. The scratch target
 * is resized between levels; each old pyramid survives until its replacement
 * finishes, so callers must also reserve the existing resident bytes.
 */
export function surfacePyramidMemory(width: number, height: number) {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0
  )
    throw new Error("Depth of field needs positive integer surface dimensions");
  const padding = Math.max(16, Math.ceil(Math.max(width, height) * 0.125));
  const paddedWidth = width + 2 * padding,
    paddedHeight = height + 2 * padding;
  let residentBytes = 0,
    buildPeakBytes = 0;
  const sizes = Array.from({ length: LEVELS }, (_, i) => {
    const width = Math.max(1, Math.ceil(paddedWidth / 2 ** (i + 1)));
    const height = Math.max(1, Math.ceil(paddedHeight / 2 ** (i + 1)));
    const bytes = width * height * RGBA16F_BYTES;
    residentBytes += bytes;
    buildPeakBytes = Math.max(buildPeakBytes, residentBytes + bytes);
    return { width, height };
  });
  return { residentBytes, buildPeakBytes, paddedWidth, paddedHeight, sizes };
}
type Surface = THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
type Pyramid = {
  version: number;
  image: unknown;
  targets: THREE.WebGLRenderTarget[];
  expansion: THREE.Vector2;
  size: THREE.Vector2;
};
const vertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;

/** Blur the original RGBA surface before composition. Glyph coverage travels
 * through the same Gaussian as color, so another layer cannot cut a hard hole
 * in defocused text. Pyramids depend on captured pixels, not time or camera.
 */
export class SurfaceDepthOfField {
  private readonly pyramids = new Map<THREE.Texture, Pyramid>();
  private readonly materials = new Map<
    Surface,
    {
      source: THREE.MeshBasicMaterial;
      material: THREE.MeshBasicMaterial;
      uniforms: Record<string, { value: any }>;
    }
  >();
  private readonly surfaces: Surface[] = [];
  private readonly planes = new Map<
    Surface,
    { point: THREE.Vector3; normal: THREE.Vector3 }
  >();
  private readonly normalMatrix = new THREE.Matrix3();
  private readonly modelView = new THREE.Matrix4();
  private readonly viewport = new THREE.Vector2();
  private readonly focus = { value: 0 };
  private readonly strength = { value: 0 };
  private readonly height = { value: 900 };
  private readonly filter = new THREE.ShaderMaterial({
    uniforms: {
      source: { value: null },
      direction: { value: new THREE.Vector2() },
      expansion: { value: new THREE.Vector2(1, 1) },
      initial: { value: false },
    },
    vertexShader: vertex,
    fragmentShader: `varying vec2 vUv; uniform sampler2D source;uniform vec2 direction,expansion;uniform bool initial;
vec4 at(vec2 uv){
 if(!initial)return texture2D(source,uv);
 uv=(uv-.5)*expansion+.5;
 if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))return vec4(0.);
 vec4 c=texture2D(source,uv);return vec4(c.rgb*c.a,c.a);
}
void main(){gl_FragColor=at(vUv)*.2270270270+(at(vUv+direction*1.3846153846)+at(vUv-direction*1.3846153846))*.3162162162+(at(vUv+direction*3.2307692308)+at(vUv-direction*3.2307692308))*.0702702703;}`,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    blending: THREE.NoBlending,
  });
  private readonly quad = new FullScreenQuad(this.filter);
  cacheBuilds = 0;
  constructor(private readonly renderer: THREE.WebGLRenderer) {}

  get residentBytes() {
    let bytes = 0;
    for (const pyramid of this.pyramids.values())
      for (const target of pyramid.targets)
        bytes += target.width * target.height * RGBA16F_BYTES;
    return bytes;
  }

  /** Call supports(world) first, just as render does. No GPU allocation occurs.
   * The peak is safe for any camera-dependent surface ordering: all growing
   * replacements may complete before the largest remaining pyramid is built.
   */
  estimateMemory() {
    const residentBytes = this.residentBytes;
    const changes: { delta: number; buildPeak: number }[] = [];
    const seen = new Set<THREE.Texture>();
    for (const mesh of this.surfaces) {
      const texture = mesh.material.map!;
      if (seen.has(texture)) continue;
      seen.add(texture);
      const previous = this.pyramids.get(texture);
      if (
        previous &&
        previous.version === texture.version &&
        previous.image === texture.image
      )
        continue;
      const image = texture.image as
        { width: number; height: number } | undefined;
      const next = surfacePyramidMemory(image?.width ?? 0, image?.height ?? 0);
      const old =
        previous?.targets.reduce(
          (bytes, target) =>
            bytes + target.width * target.height * RGBA16F_BYTES,
          0,
        ) ?? 0;
      changes.push({
        delta: next.residentBytes - old,
        buildPeak: next.buildPeakBytes,
      });
    }
    const growth = changes.reduce(
      (sum, change) => sum + Math.max(0, change.delta),
      0,
    );
    const nextResidentBytes =
      residentBytes + changes.reduce((sum, change) => sum + change.delta, 0);
    const peakBytes = Math.max(
      residentBytes,
      nextResidentBytes,
      ...changes.map(
        (change) =>
          residentBytes + growth - Math.max(0, change.delta) + change.buildPeak,
      ),
    );
    return { residentBytes, nextResidentBytes, peakBytes };
  }

  /** Whole-scene eligibility avoids combining two incompatible blur operations.
   * Authored custom 3D/shader worlds retain the general post-process path.
   */
  supports(world: THREE.Scene) {
    this.surfaces.length = 0;
    let supported = !world.overrideMaterial;
    world.traverseVisible((object) => {
      if (!(object as THREE.Mesh).isMesh) {
        if (
          (object as THREE.Line).isLine ||
          (object as THREE.Points).isPoints ||
          (object as THREE.Sprite).isSprite
        )
          supported = false;
        return;
      }
      const mesh = object as Surface;
      if (
        !(mesh.geometry instanceof THREE.PlaneGeometry) ||
        !(mesh.material instanceof THREE.MeshBasicMaterial) ||
        !mesh.material.map ||
        mesh.material.alphaMap ||
        mesh.material.vertexColors ||
        mesh.material.wireframe ||
        mesh.material.blending !== THREE.NormalBlending ||
        mesh.material.onBeforeCompile !==
          THREE.Material.prototype.onBeforeCompile ||
        mesh.material.map.wrapS !== THREE.ClampToEdgeWrapping ||
        mesh.material.map.wrapT !== THREE.ClampToEdgeWrapping ||
        mesh.material.map.offset.x !== 0 ||
        mesh.material.map.offset.y !== 0 ||
        mesh.material.map.repeat.x !== 1 ||
        mesh.material.map.repeat.y !== 1 ||
        mesh.material.map.rotation !== 0 ||
        !mesh.material.map.matrixAutoUpdate
      ) {
        supported = false;
        return;
      }
      this.surfaces.push(mesh);
    });
    return supported && this.surfaces.length > 0;
  }

  private pyramid(texture: THREE.Texture): Pyramid {
    const previous = this.pyramids.get(texture);
    if (
      previous &&
      previous.version === texture.version &&
      previous.image === texture.image
    )
      return previous;
    const image = texture.image as { width: number; height: number };
    if (!image?.width || !image.height)
      throw new Error("Depth of field needs a prepared surface");
    const layout = surfacePyramidMemory(image.width, image.height);
    const width = layout.paddedWidth,
      height = layout.paddedHeight;
    const expansion = new THREE.Vector2(
      width / image.width,
      height / image.height,
    );
    const targets: THREE.WebGLRenderTarget[] = [];
    const scratch = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      depthBuffer: false,
    });
    const renderer = this.renderer,
      oldTarget = renderer.getRenderTarget(),
      autoClear = renderer.autoClear;
    try {
      renderer.autoClear = true;
      let source = texture;
      for (let i = 0; i < LEVELS; i++) {
        const { width: w, height: h } = layout.sizes[i];
        const target = new THREE.WebGLRenderTarget(w, h, {
          type: THREE.HalfFloatType,
          depthBuffer: false,
        });
        targets.push(target);
        scratch.setSize(w, h);
        this.filter.uniforms.initial.value = i === 0;
        this.filter.uniforms.expansion.value.copy(expansion);
        this.filter.uniforms.source.value = source;
        this.filter.uniforms.direction.value.set(1 / w, 0);
        renderer.setRenderTarget(scratch);
        this.quad.render(renderer);
        this.filter.uniforms.initial.value = false;
        this.filter.uniforms.source.value = scratch.texture;
        this.filter.uniforms.direction.value.set(0, 1 / h);
        renderer.setRenderTarget(target);
        this.quad.render(renderer);
        source = target.texture;
      }
    } catch (error) {
      targets.forEach((t) => t.dispose());
      throw error;
    } finally {
      renderer.setRenderTarget(oldTarget);
      renderer.autoClear = autoClear;
      scratch.dispose();
    }
    previous?.targets.forEach((target) => target.dispose());
    const result = {
      targets,
      expansion,
      size: new THREE.Vector2(image.width, image.height),
      version: texture.version,
      image: texture.image,
    };
    this.pyramids.set(texture, result);
    this.cacheBuilds++;
    return result;
  }

  private material(mesh: Surface, pyramid: Pyramid) {
    let entry = this.materials.get(mesh);
    if (entry && entry.source !== mesh.material) {
      entry.material.dispose();
      this.materials.delete(mesh);
      entry = undefined;
    }
    if (!entry) {
      const source = mesh.material,
        material = source.clone();
      const uniforms: Record<string, { value: any }> = {
        tiltFocus: this.focus,
        tiltStrength: this.strength,
        tiltHeight: this.height,
        tiltExpansion: { value: pyramid.expansion },
        tiltTextureSize: { value: pyramid.size },
      };
      for (let i = 0; i < LEVELS; i++)
        uniforms[`tiltBlur${i}`] = { value: pyramid.targets[i].texture };
      material.onBeforeCompile = (shader, renderer) => {
        source.onBeforeCompile(shader, renderer);
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader =
          "uniform vec2 tiltExpansion; varying vec2 vTiltUv; varying float vTiltDepth;\n" +
          shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\ntransformed.xy *= tiltExpansion; vTiltUv = (uv-.5)*tiltExpansion+.5;",
        );
        shader.vertexShader = shader.vertexShader.replace(
          "#include <project_vertex>",
          "#include <project_vertex>\nvTiltDepth = -mvPosition.z;",
        );
        shader.fragmentShader =
          `uniform float tiltFocus,tiltStrength,tiltHeight;uniform vec2 tiltExpansion,tiltTextureSize;varying vec2 vTiltUv;varying float vTiltDepth;
${Array.from({ length: LEVELS }, (_, i) => `uniform sampler2D tiltBlur${i};`).join("\n")}
vec4 tiltBlurAt(float level,vec2 uv){
${Array.from({ length: LEVELS - 1 }, (_, i) => `if(level<${i + 2}.)return texture2D(tiltBlur${i},uv);`).join("\n")}
return texture2D(tiltBlur7,uv);}
` + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <map_fragment>",
          `
float tiltDefocus=abs(vTiltDepth-tiltFocus);
float tiltRadius=min(1.,tiltDefocus*smoothstep(0.,.15,tiltDefocus))*tiltStrength*tiltHeight*.025;
vec2 tiltDx=dFdx(vTiltUv)*tiltTextureSize,tiltDy=dFdy(vTiltUv)*tiltTextureSize;
float tiltSigma=tiltRadius*.5*sqrt(length(tiltDx)*length(tiltDy));
float tiltLevel=clamp(tiltSigma<=3.36?tiltSigma/3.36:1.+log2(tiltSigma/3.36),0.,8.);
vec4 tiltOriginal=vec4(0.);
if(all(greaterThanEqual(vTiltUv,vec2(0.)))&&all(lessThanEqual(vTiltUv,vec2(1.))))tiltOriginal=texture2D(map,vTiltUv);
vec2 tiltPaddedUv=(vTiltUv-.5)/tiltExpansion+.5;
vec4 tiltLow=tiltLevel<1.?vec4(tiltOriginal.rgb*tiltOriginal.a,tiltOriginal.a):tiltBlurAt(floor(tiltLevel),tiltPaddedUv);
vec4 tiltHigh=tiltBlurAt(max(1.,ceil(tiltLevel)),tiltPaddedUv);
vec4 tiltColor=mix(tiltLow,tiltHigh,fract(tiltLevel));
diffuseColor*=vec4(tiltColor.a>0.00001?tiltColor.rgb/tiltColor.a:vec3(0.),tiltColor.a);
`,
        );
      };
      material.customProgramCacheKey = () =>
        source.customProgramCacheKey() + "-tilt-surface-dof-v1";
      entry = { source, material, uniforms };
      this.materials.set(mesh, entry);
    }
    const { material, uniforms, source } = entry;
    material.color.copy(source.color);
    material.opacity = source.opacity;
    material.map = source.map;
    material.side = source.side;
    material.transparent = true;
    material.depthWrite = false;
    material.depthTest = source.depthTest;
    material.alphaTest = 0.00001;
    uniforms.tiltExpansion.value = pyramid.expansion;
    uniforms.tiltTextureSize.value = pyramid.size;
    for (let i = 0; i < LEVELS; i++)
      uniforms[`tiltBlur${i}`].value = pyramid.targets[i].texture;
    return material;
  }

  render(
    world: THREE.Scene,
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    focus: number,
    strength: number,
  ) {
    this.focus.value = focus;
    this.strength.value = strength;
    this.height.value = this.renderer.getDrawingBufferSize(this.viewport).y;
    world.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    const saved = this.surfaces.map((mesh) => ({
      mesh,
      material: mesh.material,
      renderOrder: mesh.renderOrder,
      frustumCulled: mesh.frustumCulled,
    }));
    for (const mesh of this.surfaces) {
      let plane = this.planes.get(mesh);
      if (!plane) {
        plane = { point: new THREE.Vector3(), normal: new THREE.Vector3() };
        this.planes.set(mesh, plane);
      }
      this.modelView.multiplyMatrices(
        camera.matrixWorldInverse,
        mesh.matrixWorld,
      );
      plane.point.setFromMatrixPosition(this.modelView);
      plane.normal
        .set(0, 0, 1)
        .applyNormalMatrix(this.normalMatrix.getNormalMatrix(this.modelView));
    }
    this.surfaces.sort((a, b) => {
      const pa = this.planes.get(a)!,
        pb = this.planes.get(b)!;
      // UI regions have different centers on the same tilted plane. Center-depth
      // sorting can put the full base over a raised child; compare plane offsets.
      const parallel =
        Math.abs(pa.normal.dot(pb.normal)) > 1 - 1e-5 &&
        Math.abs(pa.normal.z) > 1e-5;
      const delta = parallel
        ? (pa.normal.dot(pa.point) - pa.normal.dot(pb.point)) *
          Math.sign(pa.normal.z)
        : pa.point.z - pb.point.z;
      return Math.abs(delta) > 1e-5 ? delta : a.renderOrder - b.renderOrder;
    });
    try {
      for (let i = 0; i < this.surfaces.length; i++) {
        const mesh = this.surfaces[i];
        mesh.material = this.material(mesh, this.pyramid(mesh.material.map!));
        mesh.renderOrder = i;
        mesh.frustumCulled = false;
      }
      this.renderer.render(world, camera);
    } finally {
      for (const entry of saved) {
        entry.mesh.material = entry.material;
        entry.mesh.renderOrder = entry.renderOrder;
        entry.mesh.frustumCulled = entry.frustumCulled;
      }
    }
  }
  dispose() {
    for (const pyramid of this.pyramids.values())
      pyramid.targets.forEach((t) => t.dispose());
    this.pyramids.clear();
    for (const entry of this.materials.values()) entry.material.dispose();
    this.materials.clear();
    this.planes.clear();
    this.filter.dispose();
    this.quad.dispose();
  }
}
