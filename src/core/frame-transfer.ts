import type { CapturedFrame } from "./layers";

/**
 * A receiver reports only images it has accepted. No server-side viewer state:
 * new clients, retries and interleaved viewers can always request a full frame.
 * Layout, visibility, routes and quality still travel with every sample.
 */
export function frameForReceiver(
  frame: CapturedFrame,
  knownImages?: unknown,
): CapturedFrame {
  if (
    !knownImages ||
    typeof knownImages !== "object" ||
    Array.isArray(knownImages)
  )
    return frame;
  const known = knownImages as Record<string, unknown>;
  const images: Record<string, string> = {};
  for (const [id, data] of Object.entries(frame.images)) {
    const version = frame.imageVersions?.[id];
    if (!version || !Object.hasOwn(known, id) || known[id] !== version)
      images[id] = data;
  }
  return { ...frame, images };
}
