import * as THREE from "three";
import type { CapturedFrame, EncodedSurface } from "../core/layers";
import { pngSurface, surfaceFromDataURL } from "../core/frame-wire";
import {
  DEFAULT_SURFACE_BUDGET_MB,
  surfaceResidentBytes,
} from "../core/render-metrics";

type Decode = (surface: EncodedSurface) => Promise<HTMLImageElement>;
async function decodePNG(surface: EncodedSurface) {
  // The byte view can share a larger frame packet. Blob owns just this image's bytes.
  const url = URL.createObjectURL(
    new Blob([surface.bytes as Uint8Array<ArrayBuffer>], {
      type: surface.mimeType,
    }),
  );
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** One receiver's acknowledged images and their bounded CPU/GPU surface ownership. */
export class SurfaceResources {
  readonly textures: Record<string, THREE.Texture> = Object.create(null);
  private versions: Record<string, string> = Object.create(null);
  private legacyImages: Record<string, string> = Object.create(null);
  private sizes = new Map<string, number>();
  private disposed = false;
  private resident = 0;
  private peak = 0;
  private sourceCaptureBytes = 0;
  private renderTargetBytes = 0;
  budgetBytes = DEFAULT_SURFACE_BUDGET_MB * 1024 * 1024;
  constructor(
    keys: string[],
    private maxTextureSize: number,
    anisotropy: number,
    private decode: Decode = decodePNG,
  ) {
    for (const key of keys) {
      const texture = new THREE.Texture();
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = Math.min(8, anisotropy);
      this.textures[key] = texture;
    }
  }
  knownImages() {
    return { ...this.versions };
  }
  get memory() {
    return {
      residentSurfaceBytes: this.resident,
      sourceCaptureBytes: this.sourceCaptureBytes,
      renderTargetBytes: this.renderTargetBytes,
      residentManagedBytes:
        this.resident + this.sourceCaptureBytes + this.renderTargetBytes,
      peakSurfaceBytes: this.peak,
      surfaceBudgetBytes: this.budgetBytes,
    };
  }
  setSourceMemory(bytes: number) {
    if (!Number.isFinite(bytes) || bytes < 0) throw new Error("Invalid source memory estimate");
    this.checkBudget(this.resident + this.renderTargetBytes + bytes);
    this.sourceCaptureBytes = bytes;
  }
  reserveRenderTargets(bytes: number, peakBytes = bytes) {
    if (!Number.isFinite(bytes) || bytes < 0 || peakBytes < bytes) throw new Error("Invalid render target memory estimate");
    this.checkBudget(this.resident + this.sourceCaptureBytes + peakBytes);
    this.renderTargetBytes = bytes;
  }
  private checkBudget(bytes: number) {
    if (!Number.isFinite(bytes) || bytes < 0 || bytes > this.budgetBytes)
      throw new Error(
        `Scene surface budget exceeded (${Math.ceil(bytes / 1024 / 1024)} MB needed, ${Math.floor(this.budgetBytes / 1024 / 1024)} MB allowed). Set capture.memoryBudgetMB or reduce UI density/layers.`,
      );
    this.peak = Math.max(this.peak, bytes);
  }
  async accept(frame: CapturedFrame) {
    if (this.disposed) throw new Error("Surface resources were disposed");
    const start = performance.now();
    let decodedImages = 0,
      reusedImages = 0;
    const ids = new Set([
      ...Object.keys(frame.images),
      ...Object.keys(frame.surfaces ?? {}),
    ]);
    const transferredBytes = [...ids].reduce((bytes, id) => {
      const surface = frame.surfaces?.[id];
      if (surface) return bytes + surface.bytes.byteLength;
      const data = frame.images[id];
      const encoded = data.slice(data.indexOf(",") + 1);
      return (
        bytes +
        Math.max(
          0,
          Math.floor((encoded.length * 3) / 4) -
            (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0),
        )
      );
    }, 0);
    if (
      this.resident +
        this.sourceCaptureBytes +
        this.renderTargetBytes +
        transferredBytes >
      this.budgetBytes
    )
      throw new Error(
        "Incoming frame would exceed the scene surface budget. Set capture.memoryBudgetMB or reduce UI density/layers.",
      );
    for (const [id, version] of Object.entries(frame.imageVersions ?? {})) {
      if (
        !Object.hasOwn(frame.images, id) &&
        !Object.hasOwn(frame.surfaces ?? {}, id) &&
        this.versions[id] !== version
      )
        throw new Error(`Source ${id} omitted an image this renderer needs`);
      if (!ids.has(id)) reusedImages++;
    }
    for (const id of ids) {
      const texture = this.textures[id];
      if (!texture) throw new Error(`Source supplied undeclared surface ${id}`);
      const version = frame.imageVersions?.[id];
      if (
        (version && this.versions[id] === version) ||
        (!version &&
          frame.images[id] &&
          this.legacyImages[id] === frame.images[id])
      ) {
        reusedImages++;
        continue;
      }
      const surface = frame.surfaces?.[id]
        ? pngSurface(frame.surfaces[id].bytes)
        : surfaceFromDataURL(frame.images[id]);
      if (Math.max(surface.width, surface.height) > this.maxTextureSize)
        throw new Error(
          `Source ${id} exceeds this GPU's texture size. Reduce UI density.`,
        );
      // Include the replacement while the old image remains alive; never silently reduce fidelity.
      const bytes =
        surfaceResidentBytes(surface.width, surface.height) +
        (!version && frame.images[id] ? frame.images[id].length * 2 : 0);
      const peak =
        this.resident +
        this.sourceCaptureBytes +
        this.renderTargetBytes +
        bytes +
        transferredBytes;
      if (peak > this.budgetBytes)
        throw new Error(
          `Source ${id} would exceed the scene surface budget (${Math.ceil(peak / 1024 / 1024)} MB needed, ${Math.floor(this.budgetBytes / 1024 / 1024)} MB allowed). Set capture.memoryBudgetMB or reduce UI density/layers.`,
        );
      const image = await this.decode(surface);
      if (this.disposed)
        throw new Error("Surface resources were disposed during preparation");
      if (image.width !== surface.width || image.height !== surface.height)
        throw new Error(`Source ${id} decoded with unexpected dimensions`);
      const previous = texture.image as HTMLImageElement | undefined;
      if (
        previous &&
        (previous.width !== image.width || previous.height !== image.height)
      )
        texture.dispose();
      texture.image = image;
      texture.needsUpdate = true;
      this.peak = Math.max(this.peak, peak);
      this.resident += bytes - (this.sizes.get(id) ?? 0);
      this.sizes.set(id, bytes);
      if (version) {
        this.versions[id] = version;
        delete this.legacyImages[id];
      } else {
        delete this.versions[id];
        if (frame.images[id]) this.legacyImages[id] = frame.images[id];
      }
      decodedImages++;
    }
    return {
      decodeMs: performance.now() - start,
      decodedImages,
      reusedImages,
      transferredBytes,
      ...this.memory,
    };
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const texture of Object.values(this.textures)) {
      texture.dispose();
      texture.image = null;
    }
    this.versions = Object.create(null);
    this.legacyImages = Object.create(null);
    this.sizes.clear();
    this.resident = 0;
    this.sourceCaptureBytes = 0;
    this.renderTargetBytes = 0;
  }
}
