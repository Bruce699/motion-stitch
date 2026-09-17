import type { SceneDocument } from "./schema";
import { captureQuality } from "./quality";

/** Static is an explicit source contract, never inferred from an unchanged frame.
 * Time, scene parameters and camera focus cannot change these browser pixels.
 * Source/file changes replace the engine; density changes require a fresh frame.
 */
export function staticFrameKey(
  document: SceneDocument,
  zoom: number,
): string | null {
  if (document.sources.some((source) => source.sampling !== "static"))
    return null;
  return JSON.stringify([
    document.sources,
    document.size,
    document.capture,
    document.sources.map(
      (source) =>
        captureQuality(document.size, source, document.capture, zoom).density,
    ),
  ]);
}
