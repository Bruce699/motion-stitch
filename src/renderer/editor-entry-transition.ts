import "./editor-entry-transition.css";

export const EDITOR_ENTRY_DURATION = 500;
export const EDITOR_ENTRY_EASING = "cubic-bezier(0.5, 0, 0, 1)";

export type EditorEntryOrigin = {
  page: "playground" | "library";
  sceneId?: string;
  time: number;
  rect: { left: number; top: number; width: number; height: number };
  radius: string;
  pixels: HTMLCanvasElement | HTMLImageElement;
  fit: string;
  source: HTMLElement;
};

/** Lift only a presentation copy above the moving frame and panel clips. */
function prepareViewerModeMotion(editor: HTMLElement) {
  const source = editor.querySelector<HTMLElement>(".viewer-mode-toggle");
  const panel = editor.querySelector<HTMLElement>("#timeline");
  const bounds = source?.getBoundingClientRect();
  const panelTop = panel?.getBoundingClientRect().top ?? window.innerHeight;
  const distance =
    window.innerHeight - Math.min(panelTop, bounds?.top ?? panelTop);
  if (!source || !bounds?.width || !bounds.height)
    return { distance, element: undefined, cleanup: () => {} };
  const element = source.cloneNode(true) as HTMLElement;
  element.classList.add("editor-transition-toggle", "dialkit-root", "tilt-ui");
  element.setAttribute("aria-hidden", "true");
  element.inert = true;
  for (const child of element.querySelectorAll("[id]"))
    child.removeAttribute("id");
  Object.assign(element.style, {
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    visibility: "visible",
  });
  const visibility = source.style.visibility;
  source.style.visibility = "hidden";
  document.body.append(element);
  return {
    distance,
    element,
    cleanup() {
      element.remove();
      source.style.visibility = visibility;
    },
  };
}

/** Copy already-presented pixels without another render, capture or image encode. */
export function captureEditorEntry(
  source: HTMLElement,
  page: EditorEntryOrigin["page"],
): EditorEntryOrigin | undefined {
  const preview = source.querySelector<HTMLElement>(".composition-preview");
  if (!preview) return;
  const rect = preview.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const canvas = preview.querySelector("canvas");
  const poster = preview.querySelector("img");
  let pixels: EditorEntryOrigin["pixels"];
  let fit = "contain";
  if (canvas?.width && canvas.height) {
    const copy = document.createElement("canvas");
    copy.width = canvas.width;
    copy.height = canvas.height;
    const context = copy.getContext("2d");
    if (!context) return;
    context.drawImage(canvas, 0, 0);
    pixels = copy;
    fit = getComputedStyle(canvas).objectFit;
  } else if (poster?.complete && poster.naturalWidth) {
    pixels = poster.cloneNode() as HTMLImageElement;
    fit = getComputedStyle(poster).objectFit;
  } else return;
  const time = Number(preview.dataset.presentedTime ?? 0);
  return {
    page,
    sceneId: preview.dataset.presentedScene,
    time: Number.isFinite(time) ? time : 0,
    rect: {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    },
    radius: getComputedStyle(source.closest(".library-card") ?? source)
      .borderRadius,
    pixels,
    fit,
    source: preview,
  };
}

/** Temporary presentation only: never resize panels or change saved inspection. */
export function beginEditorEntry(
  origin: EditorEntryOrigin,
  editor: HTMLElement,
  workspace: HTMLElement,
) {
  const frame = document.createElement("div");
  frame.className = "editor-entry-frame dialkit-root tilt-ui";
  frame.setAttribute("aria-hidden", "true");
  frame.dataset.phase = "preparing";
  frame.dataset.from = origin.page;
  Object.assign(frame.style, {
    left: `${origin.rect.left}px`,
    top: `${origin.rect.top}px`,
    width: `${origin.rect.width}px`,
    height: `${origin.rect.height}px`,
    borderRadius: origin.radius,
  });
  Object.assign(origin.pixels.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: origin.fit,
  });
  frame.append(origin.pixels);
  document.body.append(frame);
  editor.dataset.entry = "preparing";
  const animations: Animation[] = [];
  let startTime: number | undefined;
  let closed = false;
  let restoreTarget = () => {};
  let restoreViewerMode = () => {};
  const cleanup = () => {
    if (closed) return;
    closed = true;
    for (const animation of animations) animation.cancel();
    frame.remove();
    restoreTarget();
    restoreViewerMode();
    delete workspace.dataset.editorExit;
    delete editor.dataset.entry;
    window.removeEventListener("resize", cleanup);
    window.removeEventListener("pagehide", cleanup);
  };
  window.addEventListener("resize", cleanup);
  window.addEventListener("pagehide", cleanup);
  const animate = (element: HTMLElement, keyframes: Keyframe[]) => {
    const animation = element.animate(keyframes, {
      duration: EDITOR_ENTRY_DURATION,
      easing: EDITOR_ENTRY_EASING,
      fill: "both",
    });
    if (startTime !== undefined) animation.startTime = startTime;
    animations.push(animation);
    return animation;
  };
  return {
    cancel: cleanup,
    async play() {
      if (closed) return;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        cleanup();
        return;
      }
      const target = editor.querySelector<HTMLElement>(".canvas-frame");
      if (!target) {
        cleanup();
        return;
      }
      const rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        cleanup();
        return;
      }
      const visibility = target.style.visibility;
      const sourceVisibility = origin.source.style.visibility;
      target.style.visibility = "hidden";
      origin.source.style.visibility = "hidden";
      restoreTarget = () => {
        target.style.visibility = visibility;
        origin.source.style.visibility = sourceVisibility;
      };
      Object.assign(frame.style, {
        left: "0px",
        top: "0px",
      });
      const timelineTime = document.timeline.currentTime;
      if (typeof timelineTime === "number") startTime = timelineTime;
      animate(frame, [
        {
          transform: `translate(${origin.rect.left}px, ${origin.rect.top}px)`,
          width: `${origin.rect.width}px`,
          height: `${origin.rect.height}px`,
          borderRadius: origin.radius,
        },
        {
          transform: `translate(${rect.left}px, ${rect.top}px)`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          borderRadius: getComputedStyle(target).borderRadius,
        },
      ]);
      const viewerMode = prepareViewerModeMotion(editor);
      restoreViewerMode = viewerMode.cleanup;
      if (viewerMode.element)
        animate(viewerMode.element, [
          { transform: `translateY(${viewerMode.distance}px)` },
          { transform: "none" },
        ]);
      for (const [id, direction] of [
        ["compositions", "left"],
        ["inspector", "right"],
        ["timeline", "bottom"],
      ] as const) {
        const panel = editor.querySelector<HTMLElement>(`#${id}`);
        if (!panel) continue;
        const bounds = panel.getBoundingClientRect();
        const transform =
          direction === "left"
            ? `translateX(${-bounds.right}px)`
            : direction === "right"
              ? `translateX(${window.innerWidth - bounds.left}px)`
              : `translateY(${viewerMode.distance}px)`;
        animate(panel, [{ transform }, { transform: "none" }]);
      }
      const outgoing =
        workspace.querySelector<HTMLElement>("#playground-canvas");
      if (origin.page === "playground" && outgoing) {
        const distance =
          window.innerHeight - outgoing.getBoundingClientRect().top;
        animate(outgoing, [
          { transform: "none" },
          { transform: `translateY(${distance}px)` },
        ]);
      }
      for (const element of workspace.querySelectorAll<HTMLElement>(
        ".workspace-toolbar, .library-toolbar, .library-content, .playground-preview, .playground-divider",
      ))
        animate(element, [{ opacity: 1 }, { opacity: 0 }]);
      // Install the offscreen first keyframes while preparation still hides
      // the panels, then reveal them together before the next browser paint.
      frame.dataset.phase = "moving";
      editor.dataset.entry = "moving";
      workspace.dataset.editorExit = "moving";
      try {
        await Promise.all(animations.map((animation) => animation.finished));
      } catch {
        // Resize, navigation and unmount cancel the same temporary presentation.
      }
    },
  };
}

/** Reverse the same spatial handoff without moving or recreating live canvases. */
export function beginEditorExit(
  editor: HTMLElement,
  workspace: HTMLElement,
  destination: HTMLElement | undefined,
  page: EditorEntryOrigin["page"],
) {
  const source = editor.querySelector<HTMLElement>(".canvas-frame");
  const canvas = source?.querySelector<HTMLCanvasElement>(
    ".scene-stage canvas",
  );
  const sourceRect = source?.getBoundingClientRect();
  const target = destination?.matches(".composition-preview")
    ? destination
    : (destination?.querySelector<HTMLElement>(".composition-preview") ??
      destination);
  let frame: HTMLDivElement | undefined;
  let pixels: HTMLCanvasElement | undefined;
  if (
    sourceRect?.width &&
    sourceRect.height &&
    canvas?.width &&
    canvas.height
  ) {
    const copy = document.createElement("canvas");
    copy.width = canvas.width;
    copy.height = canvas.height;
    try {
      const context = copy.getContext("2d");
      if (context) {
        context.drawImage(canvas, 0, 0);
        pixels = copy;
      }
    } catch {
      // A missing or lost drawing surface still allows the surrounding UI
      // to return; never block navigation on a decorative snapshot.
    }
    if (pixels) {
      frame = document.createElement("div");
      frame.className = "editor-entry-frame dialkit-root tilt-ui";
      frame.setAttribute("aria-hidden", "true");
      frame.dataset.phase = "preparing";
      frame.dataset.from = "editor";
      frame.dataset.to = page;
      Object.assign(frame.style, {
        left: `${sourceRect.left}px`,
        top: `${sourceRect.top}px`,
        width: `${sourceRect.width}px`,
        height: `${sourceRect.height}px`,
        borderRadius: getComputedStyle(source!).borderRadius,
      });
      const targetImage = target?.querySelector("canvas, img");
      Object.assign(pixels.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: targetImage
          ? getComputedStyle(targetImage).objectFit
          : page === "library"
            ? "cover"
            : "contain",
      });
      frame.append(pixels);
      document.body.append(frame);
    }
  }
  editor.dataset.exit = "preparing";
  workspace.dataset.editorReturn = "preparing";
  const animations: Animation[] = [];
  let startTime: number | undefined;
  let closed = false;
  let started = false;
  let restoreFrames = () => {};
  let restoreViewerMode = () => {};
  const cleanup = () => {
    if (closed) return;
    closed = true;
    for (const animation of animations) animation.cancel();
    frame?.remove();
    restoreFrames();
    restoreViewerMode();
    delete workspace.dataset.editorReturn;
    delete editor.dataset.exit;
    window.removeEventListener("resize", cleanup);
    window.removeEventListener("pagehide", cleanup);
  };
  window.addEventListener("resize", cleanup);
  window.addEventListener("pagehide", cleanup);
  const animate = (element: HTMLElement, keyframes: Keyframe[]) => {
    const animation = element.animate(keyframes, {
      duration: EDITOR_ENTRY_DURATION,
      easing: EDITOR_ENTRY_EASING,
      fill: "both",
    });
    if (startTime !== undefined) animation.startTime = startTime;
    animations.push(animation);
  };
  return {
    cancel: cleanup,
    async play() {
      if (closed || started) return;
      started = true;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        cleanup();
        return;
      }
      const timelineTime = document.timeline.currentTime;
      if (typeof timelineTime === "number") startTime = timelineTime;
      const targetRect = target?.getBoundingClientRect();
      const sourceVisibility = source?.style.visibility ?? "";
      const targetVisibility = target?.style.visibility ?? "";
      if (source && frame) source.style.visibility = "hidden";
      if (target && frame) target.style.visibility = "hidden";
      restoreFrames = () => {
        if (source) source.style.visibility = sourceVisibility;
        if (target) target.style.visibility = targetVisibility;
      };
      if (frame && sourceRect) {
        if (targetRect?.width && targetRect.height) {
          const targetFrame = target?.closest<HTMLElement>(
            ".library-thumbnail, .preview-picture",
          );
          Object.assign(frame.style, { left: "0px", top: "0px" });
          animate(frame, [
            {
              transform: `translate(${sourceRect.left}px, ${sourceRect.top}px)`,
              width: `${sourceRect.width}px`,
              height: `${sourceRect.height}px`,
              borderRadius: source
                ? getComputedStyle(source).borderRadius
                : "0px",
            },
            {
              transform: `translate(${targetRect.left}px, ${targetRect.top}px)`,
              width: `${targetRect.width}px`,
              height: `${targetRect.height}px`,
              borderRadius: target
                ? getComputedStyle(targetFrame ?? target).borderRadius
                : "0px",
            },
          ]);
        } else {
          animate(frame, [{ opacity: 1 }, { opacity: 0 }]);
        }
      } else if (source) {
        animate(source, [{ opacity: 1 }, { opacity: 0 }]);
      }
      const viewerMode = prepareViewerModeMotion(editor);
      restoreViewerMode = viewerMode.cleanup;
      if (viewerMode.element)
        animate(viewerMode.element, [
          { transform: "none" },
          { transform: `translateY(${viewerMode.distance}px)` },
        ]);
      for (const [id, direction] of [
        ["compositions", "left"],
        ["inspector", "right"],
        ["timeline", "bottom"],
      ] as const) {
        const panel = editor.querySelector<HTMLElement>(`#${id}`);
        if (!panel) continue;
        const bounds = panel.getBoundingClientRect();
        const transform =
          direction === "left"
            ? `translateX(${-bounds.right}px)`
            : direction === "right"
              ? `translateX(${window.innerWidth - bounds.left}px)`
              : `translateY(${viewerMode.distance}px)`;
        animate(panel, [{ transform: "none" }, { transform }]);
      }
      const incoming =
        workspace.querySelector<HTMLElement>("#playground-canvas");
      if (page === "playground" && incoming) {
        const distance =
          window.innerHeight - incoming.getBoundingClientRect().top;
        animate(incoming, [
          { transform: `translateY(${distance}px)` },
          { transform: "none" },
        ]);
      }
      for (const element of workspace.querySelectorAll<HTMLElement>(
        ".workspace-toolbar, .library-toolbar, .library-content, .playground-preview, .playground-divider",
      ))
        animate(element, [{ opacity: 0 }, { opacity: 1 }]);
      for (const element of editor.querySelectorAll<HTMLElement>(
        ".titlebar, .composition-breadcrumb, .resize-handle",
      ))
        animate(element, [{ opacity: 1 }, { opacity: 0 }]);
      // Reveal only after every entering element has its hidden/offscreen
      // first keyframe, matching the entry path's first-paint guarantee.
      if (frame) frame.dataset.phase = "moving";
      editor.dataset.exit = "moving";
      workspace.dataset.editorReturn = "moving";
      try {
        await Promise.all(animations.map((animation) => animation.finished));
      } catch {
        // The caller owns final visibility; cancel only the temporary motion.
      }
    },
  };
}
