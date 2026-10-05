import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEventHandler, RefObject } from "react";
import {
  PLAYGROUND_ZOOM_STEP,
  PLAYGROUND_MIN_ZOOM,
  fitPlaygroundViewport,
  playgroundWheelZoom,
  zoomPlaygroundViewport,
} from "../core/playground-viewport";
import type {
  PlaygroundPoint,
  PlaygroundBounds,
  PlaygroundViewport,
} from "../core/playground-viewport";

type SafariGestureEvent = Event & {
  scale: number;
  clientX?: number;
  clientY?: number;
};

/** Canvas inspection only. Authored tile positions stay in unscaled coordinates. */
export function usePlaygroundZoom({
  scrollRef,
  contentWidth,
  contentHeight,
  enabled = true,
  canZoom,
  onPinchStart,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  contentWidth: number;
  contentHeight: number;
  enabled?: boolean;
  canZoom?: () => boolean;
  onPinchStart?: () => void;
}) {
  const [renderedViewport, setRenderedViewport] = useState({
    zoom: 1,
    revision: 0,
  });
  const zoom = renderedViewport.zoom;
  const zoomRef = useRef(1);
  const minimumZoomRef = useRef(PLAYGROUND_MIN_ZOOM);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const dimensions = useRef({ width: contentWidth, height: contentHeight });
  dimensions.current = { width: contentWidth, height: contentHeight };
  const pendingScroll = useRef<PlaygroundViewport | null>(null);
  const callbacks = useRef({ canZoom, onPinchStart });
  callbacks.current = { canZoom, onPinchStart };
  const isPinchingRef = useRef(false);
  const touchPoints = useRef(new Map<number, PlaygroundPoint>());
  const touchSession = useRef(false);
  const touchPan = useRef<{
    pointer: number;
    point: PlaygroundPoint;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);
  const pinch = useRef<{
    viewport: PlaygroundViewport;
    anchor: PlaygroundPoint;
    distance: number;
  } | null>(null);

  const currentViewport = useCallback(
    (): PlaygroundViewport => ({
      zoom: zoomRef.current,
      scrollLeft:
        pendingScroll.current?.scrollLeft ?? scrollRef.current?.scrollLeft ?? 0,
      scrollTop:
        pendingScroll.current?.scrollTop ?? scrollRef.current?.scrollTop ?? 0,
    }),
    [scrollRef],
  );

  const applyViewport = useCallback(
    (next: PlaygroundViewport) => {
      const element = scrollRef.current;
      if (!element) return;
      if (next.zoom !== zoomRef.current || pendingScroll.current) {
        zoomRef.current = next.zoom;
        pendingScroll.current = next;
        setRenderedViewport((current) => ({
          zoom: next.zoom,
          revision: current.revision + 1,
        }));
      } else {
        element.scrollLeft = next.scrollLeft;
        element.scrollTop = next.scrollTop;
      }
    },
    [scrollRef],
  );

  const zoomTo = useCallback(
    (requestedZoom: number, anchor?: PlaygroundPoint) => {
      const element = scrollRef.current;
      if (!element || callbacks.current.canZoom?.() === false) return;
      const viewport = {
        width: element.clientWidth,
        height: element.clientHeight,
      };
      const next = zoomPlaygroundViewport(
        currentViewport(),
        requestedZoom,
        anchor ?? { x: viewport.width / 2, y: viewport.height / 2 },
        dimensions.current,
        viewport,
        anchor ?? { x: viewport.width / 2, y: viewport.height / 2 },
        minimumZoomRef.current,
      );
      applyViewport(next);
    },
    [scrollRef, currentViewport, applyViewport],
  );

  // The spacer must resize before browser scroll bounds can accept the anchor.
  useLayoutEffect(() => {
    const element = scrollRef.current;
    const pending = pendingScroll.current;
    if (!element || !pending) return;
    element.scrollLeft = pending.scrollLeft;
    element.scrollTop = pending.scrollTop;
    pendingScroll.current = null;
  }, [renderedViewport.revision, scrollRef]);

  useLayoutEffect(() => {
    const element = enabled ? scrollRef.current : null;
    if (!element) return;
    const measure = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      setViewportSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    let gestureZoom: number | null = null;
    const anchorAt = (x?: number, y?: number): PlaygroundPoint => {
      const rect = element.getBoundingClientRect();
      return {
        x: typeof x === "number" ? x - rect.left : element.clientWidth / 2,
        y: typeof y === "number" ? y - rect.top : element.clientHeight / 2,
      };
    };
    const wheel = (event: WheelEvent) => {
      const requestedZoom = playgroundWheelZoom(
        zoomRef.current,
        event,
        element.clientHeight,
        minimumZoomRef.current,
      );
      if (requestedZoom === null) return;
      event.preventDefault();
      if (gestureZoom !== null) return;
      zoomTo(requestedZoom, anchorAt(event.clientX, event.clientY));
    };
    const gestureStart = (event: Event) => {
      event.preventDefault();
      if (callbacks.current.canZoom?.() === false) return;
      gestureZoom = zoomRef.current;
    };
    const gestureChange = (event: Event) => {
      if (gestureZoom === null) return;
      event.preventDefault();
      const gesture = event as SafariGestureEvent;
      if (!Number.isFinite(gesture.scale) || gesture.scale <= 0) return;
      zoomTo(
        gestureZoom * gesture.scale,
        anchorAt(gesture.clientX, gesture.clientY),
      );
    };
    const gestureEnd = (event: Event) => {
      if (gestureZoom === null) return;
      event.preventDefault();
      gestureZoom = null;
    };
    const resetGesture = () => {
      gestureZoom = null;
      touchPoints.current.clear();
      touchPan.current = null;
      touchSession.current = false;
      isPinchingRef.current = false;
      pinch.current = null;
    };
    element.addEventListener("wheel", wheel, { passive: false });
    element.addEventListener("gesturestart", gestureStart, { passive: false });
    element.addEventListener("gesturechange", gestureChange, {
      passive: false,
    });
    element.addEventListener("gestureend", gestureEnd, { passive: false });
    window.addEventListener("blur", resetGesture);
    return () => {
      resetGesture();
      observer.disconnect();
      element.removeEventListener("wheel", wheel);
      element.removeEventListener("gesturestart", gestureStart);
      element.removeEventListener("gesturechange", gestureChange);
      element.removeEventListener("gestureend", gestureEnd);
      window.removeEventListener("blur", resetGesture);
    };
  }, [enabled, scrollRef, zoomTo]);

  const zoomIn = useCallback(
    () => zoomTo(zoomRef.current * PLAYGROUND_ZOOM_STEP),
    [zoomTo],
  );
  const zoomOut = useCallback(
    () => zoomTo(zoomRef.current / PLAYGROUND_ZOOM_STEP),
    [zoomTo],
  );
  const fitBounds = useCallback(
    (bounds: PlaygroundBounds | null) => {
      const element = scrollRef.current;
      if (!element || callbacks.current.canZoom?.() === false) return;
      const next = fitPlaygroundViewport(bounds, {
        width: element.clientWidth,
        height: element.clientHeight,
      });
      minimumZoomRef.current = Math.min(PLAYGROUND_MIN_ZOOM, next.zoom);
      // Arrangement and viewport commit together, even when the scale is unchanged.
      pendingScroll.current = next;
      applyViewport(next);
    },
    [scrollRef, applyViewport],
  );

  const beginTouchPinch = () => {
    const element = scrollRef.current;
    if (!element) return;
    const [first, second] = Array.from(touchPoints.current.values());
    if (!first || !second) return;
    const rect = element.getBoundingClientRect();
    pinch.current = {
      viewport: currentViewport(),
      anchor: {
        x: (first.x + second.x) / 2 - rect.left,
        y: (first.y + second.y) / 2 - rect.top,
      },
      distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
    };
  };
  const onPointerDownCapture: PointerEventHandler<HTMLDivElement> = (event) => {
    if (event.pointerType !== "touch") return;
    const element = scrollRef.current;
    if (!element) return;
    touchPoints.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (touchPoints.current.size >= 2) {
      event.preventDefault();
      event.stopPropagation();
      if (!touchSession.current) {
        touchSession.current = true;
        isPinchingRef.current = true;
        touchPan.current = null;
        callbacks.current.onPinchStart?.();
        beginTouchPinch();
      }
      for (const pointer of touchPoints.current.keys()) {
        if (!element.hasPointerCapture(pointer))
          element.setPointerCapture(pointer);
      }
      return;
    }
    // Interactive clips retain single-finger dragging. Blank space pans.
    if (
      event.target instanceof Element &&
      event.target.closest("button,a,input,select,textarea,[role=slider]")
    )
      return;
    touchPan.current = {
      pointer: event.pointerId,
      point: { x: event.clientX, y: event.clientY },
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop,
    };
    event.preventDefault();
    element.setPointerCapture(event.pointerId);
  };
  const onPointerMoveCapture: PointerEventHandler<HTMLDivElement> = (event) => {
    if (
      event.pointerType !== "touch" ||
      !touchPoints.current.has(event.pointerId)
    )
      return;
    const element = scrollRef.current;
    if (!element) return;
    touchPoints.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (touchSession.current) {
      event.preventDefault();
      event.stopPropagation();
      const initial = pinch.current;
      const [first, second] = Array.from(touchPoints.current.values());
      if (
        !initial ||
        !first ||
        !second ||
        callbacks.current.canZoom?.() === false
      )
        return;
      const rect = element.getBoundingClientRect();
      applyViewport(
        zoomPlaygroundViewport(
          initial.viewport,
          (initial.viewport.zoom *
            Math.hypot(second.x - first.x, second.y - first.y)) /
            initial.distance,
          {
            x: (first.x + second.x) / 2 - rect.left,
            y: (first.y + second.y) / 2 - rect.top,
          },
          dimensions.current,
          { width: element.clientWidth, height: element.clientHeight },
          initial.anchor,
          minimumZoomRef.current,
        ),
      );
    } else if (touchPan.current?.pointer === event.pointerId) {
      event.preventDefault();
      event.stopPropagation();
      element.scrollLeft =
        touchPan.current.scrollLeft -
        (event.clientX - touchPan.current.point.x);
      element.scrollTop =
        touchPan.current.scrollTop - (event.clientY - touchPan.current.point.y);
    }
  };
  const onPointerUpCapture: PointerEventHandler<HTMLDivElement> = (event) => {
    if (
      event.pointerType !== "touch" ||
      !touchPoints.current.has(event.pointerId)
    )
      return;
    const element = scrollRef.current;
    if (
      event.type === "lostpointercapture" &&
      element?.hasPointerCapture(event.pointerId)
    )
      return;
    touchPoints.current.delete(event.pointerId);
    if (touchSession.current) {
      event.preventDefault();
      event.stopPropagation();
      if (touchPoints.current.size >= 2) beginTouchPinch();
      else {
        isPinchingRef.current = false;
        pinch.current = null;
      }
      if (touchPoints.current.size === 0) touchSession.current = false;
    }
    if (touchPan.current?.pointer === event.pointerId) touchPan.current = null;
    if (element?.hasPointerCapture(event.pointerId))
      element.releasePointerCapture(event.pointerId);
  };
  const spacerStyle: CSSProperties = {
    width: Math.max(viewportSize.width, contentWidth * zoom),
    height: Math.max(viewportSize.height, contentHeight * zoom),
    position: "relative",
    overflow: "hidden",
  };
  const contentStyle: CSSProperties = {
    width: contentWidth,
    height: contentHeight,
    transform: `scale(${zoom})`,
    transformOrigin: "0 0",
    position: "absolute",
    top: 0,
    left: 0,
  };
  return {
    zoom,
    zoomRef,
    zoomTo,
    zoomIn,
    zoomOut,
    minimumZoom: minimumZoomRef.current,
    fitBounds,
    isPinchingRef,
    touchStyle: { touchAction: "none" } as CSSProperties,
    touchHandlers: {
      onPointerDownCapture,
      onPointerMoveCapture,
      onPointerUpCapture,
      onPointerCancelCapture: onPointerUpCapture,
      onLostPointerCaptureCapture: onPointerUpCapture,
    },
    spacerStyle,
    contentStyle,
  };
}
