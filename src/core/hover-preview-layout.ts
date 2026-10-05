export type HoverPreviewLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
  frameWidth: number;
  frameHeight: number;
  gap: number;
  padding: number;
};

export type HoverPreviewLayoutInput = {
  /** The connected sequence's head, measured in viewport CSS pixels. */
  anchor: { left: number; top: number; width: number; height: number };
  viewport: { width: number; height: number };
  count: number;
  frameWidth: number;
  frameHeight: number;
  gap: number;
  offset: number;
  padding: number;
  margin?: number;
  /** A visible tail can belong to an offscreen head, so this is opt-in. */
  hideOffscreenAnchor?: boolean;
};

/** Fit a floating row without inheriting the canvas's inspection zoom. */
export function computeHoverPreviewLayout(
  input: HoverPreviewLayoutInput,
): HoverPreviewLayout | null {
  const { anchor, viewport } = input;
  if (
    ![
      anchor.left,
      anchor.top,
      anchor.width,
      anchor.height,
      viewport.width,
      viewport.height,
      input.count,
      input.frameWidth,
      input.frameHeight,
    ].every(Number.isFinite) ||
    anchor.width < 0 ||
    anchor.height < 0 ||
    input.frameWidth <= 0 ||
    input.frameHeight <= 0
  ) {
    return null;
  }

  const count = Math.floor(input.count);
  const margin = nonnegative(input.margin ?? 8);
  const availableWidth = viewport.width - margin * 2;
  const availableHeight = viewport.height - margin * 2;
  if (count < 1 || availableWidth <= 0 || availableHeight <= 0) return null;
  if (
    input.hideOffscreenAnchor &&
    (anchor.left + anchor.width <= 0 ||
      anchor.left >= viewport.width ||
      anchor.top + anchor.height <= 0 ||
      anchor.top >= viewport.height)
  ) {
    return null;
  }

  const requestedGap = nonnegative(input.gap);
  const requestedPadding = nonnegative(input.padding);
  const requestedWidth =
    count * input.frameWidth +
    (count - 1) * requestedGap +
    requestedPadding * 2;
  const requestedHeight = input.frameHeight + requestedPadding * 2;
  const scale = Math.min(
    1,
    availableWidth / requestedWidth,
    availableHeight / requestedHeight,
  );
  const width = requestedWidth * scale;
  const height = requestedHeight * scale;
  const offset = nonnegative(input.offset);
  const above = anchor.top - offset - height;
  const below = anchor.top + anchor.height + offset;

  return {
    left: clamp(anchor.left, margin, viewport.width - margin - width),
    top: clamp(
      above >= margin ? above : below,
      margin,
      viewport.height - margin - height,
    ),
    width,
    height,
    frameWidth: input.frameWidth * scale,
    frameHeight: input.frameHeight * scale,
    gap: requestedGap * scale,
    padding: requestedPadding * scale,
  };
}

function nonnegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
