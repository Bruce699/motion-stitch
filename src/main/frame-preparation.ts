import type { CapturedFrame } from "../core/layers";
import type { ParameterValues } from "../core/parameters";
import type { SourceQuality } from "../core/quality";
import type { SourceStatus } from "../core/source-status";

export interface SampledSource {
  spec: { id: string };
  currentRoute: string;
  readonly diagnostics?: SourceStatus;
  sample(time: number, parameters: ParameterValues): Promise<CapturedFrame>;
}

/** Preview and export prepare the same complete source frame. Sources stay
 * sequential to bound capture memory; no partially prepared frame escapes.
 */
export async function sampleSources(
  sources: readonly SampledSource[],
  time: number,
  parameters: ParameterValues,
  quality: SourceQuality[] = [],
  revision?: string,
): Promise<CapturedFrame> {
  const result: CapturedFrame = {
    images: {},
    imageVersions: {},
    layers: [],
    routes: [],
    quality,
    sample: { time, ...(revision ? { revision } : {}) },
    sourceStatus: [],
    sourceMemoryBytes: quality.reduce(
      (bytes, source) => bytes + source.width * source.height * 8,
      0,
    ),
  };
  for (const source of sources) {
    const frame = await source.sample(time, parameters);
    Object.assign(result.images, frame.images);
    result.sourceMemoryBytes! += Object.values(frame.images).reduce(
      (bytes, data) => bytes + data.length * 2,
      0,
    );
    result.sourceMemoryBytes! += Object.values(frame.surfaces ?? {}).reduce(
      (bytes, surface) => bytes + surface.bytes.byteLength,
      0,
    );
    if (frame.surfaces) Object.assign((result.surfaces ||= {}), frame.surfaces);
    Object.assign(result.imageVersions!, frame.imageVersions);
    result.layers!.push(...(frame.layers || []));
    result.routes!.push({ id: source.spec.id, route: source.currentRoute });
    if (source.diagnostics) result.sourceStatus!.push(source.diagnostics);
  }
  return result;
}
