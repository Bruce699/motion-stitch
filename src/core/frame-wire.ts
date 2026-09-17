import type { CapturedFrame, EncodedSurface } from "./layers";

export const FRAME_CONTENT_TYPE = "application/vnd.tilt.frame.v1";
const MAGIC = new Uint8Array([84, 73, 76, 84, 70, 82, 77, 1]);
const PREFIX_BYTES = 12;
const MAX_METADATA_BYTES = 4 * 1024 * 1024;
const MAX_WIRE_BYTES = 512 * 1024 * 1024;
const MAX_SURFACES = 272; // Eight sources, each with full/base + 32 declared layers.
type Descriptor = {
  id: string;
  offset: number;
  length: number;
  width: number;
  height: number;
};

export function pngSurface(bytes: Uint8Array): EncodedSurface {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (
    bytes.length < 33 ||
    signature.some((n, i) => bytes[i] !== n) ||
    bytes[12] !== 73 ||
    bytes[13] !== 72 ||
    bytes[14] !== 68 ||
    bytes[15] !== 82
  )
    throw new Error("Surface is not a PNG");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16),
    height = view.getUint32(20);
  if (
    !width ||
    !height ||
    width > 8192 ||
    height > 8192 ||
    width * height > 32 * 1024 * 1024
  )
    throw new Error("Surface exceeds the supported capture dimensions");
  return { mimeType: "image/png", bytes, width, height };
}

export function surfaceFromDataURL(data: string): EncodedSurface {
  const prefix = "data:image/png;base64,";
  if (!data.startsWith(prefix)) throw new Error("Expected a PNG data URL");
  const encoded = data.slice(prefix.length);
  // Buffer is deliberately optional: this contract also runs in the browser.
  const bytes =
    typeof Buffer !== "undefined"
      ? new Uint8Array(Buffer.from(encoded, "base64"))
      : Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  return pngSurface(bytes);
}

/** A small JSON header followed by unchanged PNG bytes; no transcoding or pixel changes. */
export function encodeFrame(frame: CapturedFrame): Uint8Array {
  const { images, surfaces, ...metadata } = frame;
  const encoded: Record<string, EncodedSurface> = { ...surfaces };
  for (const [id, data] of Object.entries(images))
    if (!Object.hasOwn(encoded, id)) encoded[id] = surfaceFromDataURL(data);
  const entries = Object.entries(encoded);
  if (entries.length > MAX_SURFACES) throw new Error("Too many frame surfaces");
  let size = 0;
  const descriptors = entries.map(([id, surface]) => {
    const checked = pngSurface(surface.bytes);
    const descriptor = {
      id,
      offset: size,
      length: surface.bytes.byteLength,
      width: checked.width,
      height: checked.height,
    };
    size += descriptor.length;
    return descriptor;
  });
  const header = new TextEncoder().encode(
    JSON.stringify({ frame: metadata, surfaces: descriptors }),
  );
  if (
    header.length > MAX_METADATA_BYTES ||
    size + header.length + PREFIX_BYTES > MAX_WIRE_BYTES
  )
    throw new Error("Frame transfer exceeds its memory budget");
  const output = new Uint8Array(PREFIX_BYTES + header.length + size);
  output.set(MAGIC);
  new DataView(output.buffer).setUint32(8, header.length);
  output.set(header, PREFIX_BYTES);
  for (let i = 0; i < entries.length; i++)
    output.set(
      entries[i][1].bytes,
      PREFIX_BYTES + header.length + descriptors[i].offset,
    );
  return output;
}

export function decodeFrame(input: ArrayBuffer | Uint8Array): CapturedFrame {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (
    bytes.length < PREFIX_BYTES ||
    bytes.length > MAX_WIRE_BYTES ||
    MAGIC.some((n, i) => bytes[i] !== n)
  )
    throw new Error("Invalid frame transfer header");
  const length = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  ).getUint32(8);
  const start = PREFIX_BYTES + length;
  if (length > MAX_METADATA_BYTES || start > bytes.length)
    throw new Error("Truncated frame metadata");
  const header = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(
      bytes.subarray(PREFIX_BYTES, start),
    ),
  );
  if (
    !header.frame ||
    typeof header.frame !== "object" ||
    Array.isArray(header.frame) ||
    !Array.isArray(header.surfaces) ||
    header.surfaces.length > MAX_SURFACES
  )
    throw new Error("Invalid frame metadata");
  const surfaces: Record<string, EncodedSurface> = Object.create(null);
  let consumed = 0;
  for (const d of header.surfaces as Descriptor[]) {
    if (
      !d ||
      typeof d.id !== "string" ||
      !d.id ||
      d.id.length > 256 ||
      Object.hasOwn(surfaces, d.id) ||
      !Number.isSafeInteger(d.offset) ||
      d.offset !== consumed ||
      !Number.isSafeInteger(d.length) ||
      d.length < 33 ||
      start + d.offset + d.length > bytes.length
    )
      throw new Error("Invalid frame surface range");
    const surface = pngSurface(
      bytes.subarray(start + d.offset, start + d.offset + d.length),
    );
    if (surface.width !== d.width || surface.height !== d.height)
      throw new Error("Frame surface dimensions do not match");
    surfaces[d.id] = surface;
    consumed += d.length;
  }
  if (start + consumed !== bytes.length)
    throw new Error("Unexpected trailing frame data");
  return { ...header.frame, images: {}, surfaces };
}
