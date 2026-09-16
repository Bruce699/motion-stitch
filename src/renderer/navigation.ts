import type { Inspection } from "../core/context";

/** Inspection only: never mutates the authored scene camera. */
export function bindNavigation(
  element: HTMLElement,
  get: () => { mode: "source" | "camera"; inspection: Inspection },
  change: (next: Inspection) => void,
) {
  let gesture: {
    x: number;
    y: number;
    initial: Inspection;
    pan: boolean;
    id: number;
  } | null = null;
  const down = (e: PointerEvent) => {
    if (![0, 1, 2].includes(e.button)) return;
    e.preventDefault();
    gesture = {
      x: e.clientX,
      y: e.clientY,
      initial: { ...get().inspection },
      pan: get().mode === "source" || e.button !== 0 || e.shiftKey,
      id: e.pointerId,
    };
    element.setPointerCapture(e.pointerId);
    element.classList.add("navigating");
  };
  const move = (e: PointerEvent) => {
    if (!gesture || gesture.id !== e.pointerId) return;
    const dx = e.clientX - gesture.x,
      dy = e.clientY - gesture.y;
    const next = { ...gesture.initial };
    if (gesture.pan) {
      next.panX += dx / element.clientWidth;
      next.panY += dy / element.clientHeight;
    } else {
      next.orbitX -= dx * 0.004;
      next.orbitY -= dy * 0.004;
    }
    change(next);
  };
  const up = (e: PointerEvent) => {
    gesture = null;
    element.classList.remove("navigating");
    if (element.hasPointerCapture(e.pointerId))
      element.releasePointerCapture(e.pointerId);
  };
  const wheel = (e: WheelEvent) => {
    e.preventDefault();
    const v = get().inspection;
    const delta = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
    change({
      ...v,
      zoom: Math.max(
        0.1,
        Math.min(12, v.zoom * Math.exp(-delta * (e.ctrlKey ? 0.012 : 0.002))),
      ),
    });
  };
  const context = (e: Event) => e.preventDefault();
  const reset = () => {
    gesture = null;
    element.classList.remove("navigating");
  };
  element.addEventListener("pointerdown", down);
  element.addEventListener("pointermove", move);
  element.addEventListener("pointerup", up);
  element.addEventListener("pointercancel", up);
  element.addEventListener("wheel", wheel, { passive: false });
  element.addEventListener("contextmenu", context);
  window.addEventListener("blur", reset);
  return () => {
    element.removeEventListener("pointerdown", down);
    element.removeEventListener("pointermove", move);
    element.removeEventListener("pointerup", up);
    element.removeEventListener("pointercancel", up);
    element.removeEventListener("wheel", wheel);
    element.removeEventListener("contextmenu", context);
    window.removeEventListener("blur", reset);
  };
}
