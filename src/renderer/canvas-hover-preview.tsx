import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { motion, useIsPresent, useReducedMotion } from "motion/react";
import type { WorkspaceUI } from "../core/workspace-display";
import {
  CompositionPreview,
  type CompositionPreviewHandle,
} from "./composition-preview";
import { sampleCanvasHoverSequence } from "./canvas-hover-playback";
import "./canvas-hover-preview.css";

type HoverScene = {
  id: string;
  name: string;
  duration: number;
  revision: string;
  previewRevision?: string;
};

type HoverLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
  frameWidth: number;
  frameHeight: number;
  gap: number;
  padding: number;
};

/** Posters have no live engines; one small renderer moves between their slots. */
export const CanvasHoverPreview = memo(function CanvasHoverPreview({
  scenes,
  layout,
  ui,
}: {
  scenes: HoverScene[];
  layout: HoverLayout;
  ui: WorkspaceUI;
}) {
  const isPresent = useIsPresent();
  const present = useRef(isPresent);
  present.current = isPresent;
  const reducedMotion = useReducedMotion();
  const player = useRef<CompositionPreviewHandle>(null);
  const fps = useRef(ui.hoverPreviewFPS);
  fps.current = ui.hoverPreviewFPS;
  const catalogKey = scenes
    .map(
      (scene) =>
        `${scene.id}:${scene.duration}:${scene.previewRevision ?? scene.revision}`,
    )
    .join("|");
  const [readyKey, setReadyKey] = useState<string>();
  const hoverRevisions = useMemo(
    () =>
      Object.fromEntries(
        scenes.map((scene) => [
          scene.id,
          scene.previewRevision ?? scene.revision,
        ]),
      ),
    [catalogKey],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [stills, setStills] = useState<Record<string, string>>({});
  const cursor = useRef({ key: catalogKey, time: 0, index: 0 });

  useEffect(() => {
    setActiveIndex(0);
    setStills({});
    cursor.current = { key: catalogKey, time: 0, index: 0 };
  }, [catalogKey]);

  useEffect(() => {
    if (!isPresent || readyKey !== catalogKey || !scenes.length) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = false;
    let time = cursor.current.time;
    let last = performance.now();
    let presentedIndex = cursor.current.index;
    let warmedIndex = -1;
    const visible = () => !disposed && present.current && !document.hidden;

    const schedule = (delay: number) => {
      if (visible()) timer = setTimeout(() => void tick(), delay);
    };
    const warmNext = (index: number) => {
      const nextIndex =
        index < 0 ? scenes.findIndex((scene) => scene.duration > 0) : index;
      if (nextIndex === warmedIndex || nextIndex === presentedIndex) return;
      warmedIndex = nextIndex;
      const next = scenes[nextIndex];
      if (next) void player.current?.warm(next.id, 0).catch(() => {});
    };
    async function tick() {
      if (!visible() || pending) return;
      const sample = sampleCanvasHoverSequence(scenes, time);
      const handle = player.current;
      if (!sample || !handle) return;
      pending = true;
      const started = performance.now();
      const changed = sample.index !== presentedIndex;
      const still = changed ? handle.snapshot() : undefined;
      try {
        // Never queue another live frame before this one has been presented.
        await handle.sample(sample.sceneId, sample.sourceTime, visible);
        if (!visible()) return;
        if (changed) {
          const previousId = scenes[presentedIndex].id;
          if (still)
            setStills((previous) => ({ ...previous, [previousId]: still }));
          presentedIndex = sample.index;
          setActiveIndex(sample.index);
        }
        warmNext(sample.nextIndex);
        const now = performance.now();
        // Slow preparation and returning from a hidden tab must not skip clips.
        time += Math.min((now - last) / 1000, 0.25);
        cursor.current = { key: catalogKey, time, index: presentedIndex };
        last = now;
        schedule(Math.max(0, 1000 / fps.current - (now - started)));
      } catch {
        // The visible renderer owns its error state; retain the other stills.
      } finally {
        pending = false;
      }
    }
    const visibilityChanged = () => {
      if (timer) clearTimeout(timer);
      last = performance.now();
      if (visible()) schedule(0);
    };
    document.addEventListener("visibilitychange", visibilityChanged);
    schedule(0);
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [catalogKey, readyKey, isPresent]);

  if (!scenes.length) return null;
  const frameStyle = {
    width: layout.frameWidth,
    height: layout.frameHeight,
    borderRadius: ui.hoverPreviewRadius,
    transformOrigin: "left bottom",
  };
  const enterEase = [0.16, 1, 0.3, 1] as const;
  // Time-reversed entry curve: all windows leave together, including ones
  // whose staggered entry has not started yet.
  const exitEase = [0.7, 0, 0.84, 0] as const;
  const duration = reducedMotion ? 0 : 0.2;
  const frameMotion = (index: number) => ({
    initial: { opacity: 0, scale: reducedMotion ? 1 : 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: {
      duration,
      delay: reducedMotion ? 0 : index * 0.08,
      ease: enterEase,
    },
    exit: {
      opacity: 0,
      scale: reducedMotion ? 1 : 0.8,
      transition: { duration, delay: 0, ease: exitEase },
    },
  });
  return (
    <div
      className="canvas-hover-preview dialkit-root tilt-ui"
      role="tooltip"
      aria-label={scenes.map((scene) => scene.name).join(", ")}
      data-active-scene={scenes[activeIndex]?.id}
      data-presence={isPresent ? "present" : "exiting"}
      style={{
        left: layout.left,
        top: layout.top,
        width: layout.width,
        height: layout.height,
        gap: layout.gap,
        padding: layout.padding,
        borderRadius: ui.hoverPreviewOuterRadius,
      }}
    >
      <motion.div
        className="canvas-hover-backdrop"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{
          opacity: 0,
          transition: { duration, delay: 0, ease: exitEase },
        }}
        transition={{ duration, ease: enterEase }}
        style={{ borderRadius: ui.hoverPreviewOuterRadius }}
      />
      {scenes.map((scene, index) => (
        <motion.div
          key={scene.id}
          className="canvas-hover-frame"
          style={frameStyle}
          {...frameMotion(index)}
        >
          {index === activeIndex ? null : stills[scene.id] ? (
            <img src={stills[scene.id]} alt="" draggable={false} />
          ) : (
            <CompositionPreview
              sceneId={scene.id}
              active={false}
              quality="hover"
              revision={scene.previewRevision ?? scene.revision}
            />
          )}
        </motion.div>
      ))}
      <motion.div
        className="canvas-hover-frame canvas-hover-live"
        {...frameMotion(activeIndex)}
        style={{
          ...frameStyle,
          left: layout.padding + activeIndex * (layout.frameWidth + layout.gap),
          top: layout.padding,
        }}
      >
        <CompositionPreview
          ref={player}
          sceneId={scenes[0].id}
          active
          quality="hover"
          revision={catalogKey}
          posterRevision={hoverRevisions[scenes[0].id]}
          hoverRevisions={hoverRevisions}
          onReady={() => setReadyKey(catalogKey)}
        />
      </motion.div>
    </div>
  );
});
