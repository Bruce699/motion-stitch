export type PixelSize = { width: number; height: number };

/** An inspection preview may use fewer pixels without changing scene layout. */
export function fitPreviewSize(size: PixelSize, limit?: PixelSize): PixelSize {
  if (!limit) return { ...size };
  const scale = Math.min(
    1,
    limit.width / size.width,
    limit.height / size.height,
  );
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
}
