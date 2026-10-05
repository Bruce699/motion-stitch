export const PLAYGROUND_MIN_ZOOM = 0.25;
export const PLAYGROUND_MAX_ZOOM = 2;
export const PLAYGROUND_ZOOM_STEP = 1.25;

export type PlaygroundPoint = { x: number; y: number };
export type PlaygroundSize = { width: number; height: number };
export type PlaygroundBounds = PlaygroundPoint & PlaygroundSize;
export type PlaygroundViewport = {
  zoom: number;
  scrollLeft: number;
  scrollTop: number;
};

export function clampPlaygroundZoom(
  zoom: number,
  minimumZoom = PLAYGROUND_MIN_ZOOM,
): number {
  return Math.max(
    minimumZoom,
    Math.min(PLAYGROUND_MAX_ZOOM, Number.isNaN(zoom) ? 1 : zoom),
  );
}

/** Fit the clips, reserving screen space for the bottom-left canvas controls. */
export function fitPlaygroundViewport(
  bounds: PlaygroundBounds | null,
  viewport: PlaygroundSize,
): PlaygroundViewport {
  if (!bounds || bounds.width <= 0 || bounds.height <= 0)
    return { zoom: 1, scrollLeft: 0, scrollTop: 0 };
  const padding = 24;
  const bottom = 64;
  const zoom = Math.min(
    1,
    Math.max(1, viewport.width - padding * 2) / bounds.width,
    Math.max(1, viewport.height - padding - bottom) / bounds.height,
  );
  return {
    zoom,
    scrollLeft: Math.max(0, bounds.x * zoom - padding),
    scrollTop: Math.max(0, bounds.y * zoom - padding),
  };
}

/** Keep the canvas point beneath the anchor stationary, within scroll bounds. */
export function zoomPlaygroundViewport(
  current: PlaygroundViewport,
  requestedZoom: number,
  anchor: PlaygroundPoint,
  content: PlaygroundSize,
  viewport: PlaygroundSize,
  sourceAnchor: PlaygroundPoint = anchor,
  minimumZoom = PLAYGROUND_MIN_ZOOM,
): PlaygroundViewport {
  const zoom = clampPlaygroundZoom(requestedZoom, minimumZoom);
  const previousZoom = clampPlaygroundZoom(current.zoom, minimumZoom);
  const ratio = zoom / previousZoom;
  const maxLeft = Math.max(0, content.width * zoom - viewport.width);
  const maxTop = Math.max(0, content.height * zoom - viewport.height);
  return {
    zoom,
    scrollLeft: Math.max(
      0,
      Math.min(
        maxLeft,
        (current.scrollLeft + sourceAnchor.x) * ratio - anchor.x,
      ),
    ),
    scrollTop: Math.max(
      0,
      Math.min(maxTop, (current.scrollTop + sourceAnchor.y) * ratio - anchor.y),
    ),
  };
}

/** Ctrl-wheel is the browser's trackpad pinch signal; ordinary wheel pans. */
export function playgroundPinchZoom(
  zoom: number,
  deltaY: number,
  deltaMode = 0,
  viewportHeight = 800,
  minimumZoom = PLAYGROUND_MIN_ZOOM,
): number {
  const pixels =
    deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? viewportHeight : 1);
  return clampPlaygroundZoom(zoom * Math.exp(-pixels * 0.01), minimumZoom);
}

export function playgroundWheelZoom(
  zoom: number,
  event: { ctrlKey: boolean; deltaY: number; deltaMode: number },
  viewportHeight: number,
  minimumZoom = PLAYGROUND_MIN_ZOOM,
): number | null {
  return event.ctrlKey
    ? playgroundPinchZoom(
        zoom,
        event.deltaY,
        event.deltaMode,
        viewportHeight,
        minimumZoom,
      )
    : null;
}
