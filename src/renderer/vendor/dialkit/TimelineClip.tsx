import { useEffect, useRef, useState } from "react";
import { dragTrack, type TrackTiming } from "../../../core/tracks";
import type { CueTrack } from "./Timeline";

// DialTimeline's pointer capture and edge-drag interaction, with Tilt's file commit.
export function TimelineClip({
  track,
  color = track.color,
  duration,
  bounds,
  fps,
  pxPerSecond,
  viewStart,
  selected,
  onSelect,
  onDeselect,
  onCommit,
}: {
  track: CueTrack;
  color?: string;
  duration: number;
  bounds?: TrackTiming;
  fps: number;
  pxPerSecond: number;
  viewStart: number;
  selected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onCommit: (track: CueTrack, timing: TrackTiming) => Promise<unknown>;
}) {
  const [draft, setDraft] = useState<TrackTiming | null>(null);
  const gesture = useRef<{
    x: number;
    mode: "move" | "start" | "end";
    base: CueTrack;
    timing: TrackTiming;
    moved: boolean;
  } | null>(null);
  const pending = useRef(false);
  const value = draft || track;
  const constrain = (timing: TrackTiming, mode: "move" | "start" | "end") => {
    if (!bounds) return timing;
    if (mode === "move") {
      const length = timing.end - timing.start;
      const start = Math.max(
        bounds.start,
        Math.min(bounds.end - length, timing.start),
      );
      return { start, end: start + length };
    }
    return {
      start: Math.max(bounds.start, timing.start),
      end: Math.min(bounds.end, timing.end),
    };
  };
  const commit = async (base: CueTrack, timing: TrackTiming) => {
    if (base.start === timing.start && base.end === timing.end) {
      setDraft(null);
      return;
    }
    pending.current = true;
    try {
      await onCommit(base, timing);
    } finally {
      pending.current = false;
      setDraft(null);
    }
  };
  const cancel = () => {
    gesture.current = null;
    setDraft(null);
  };
  useEffect(() => {
    window.addEventListener("blur", cancel);
    return () => window.removeEventListener("blur", cancel);
  }, []);
  return (
    <div
      className="dialkit-timeline-clip"
      role="button"
      tabIndex={0}
      aria-label={track.label}
      aria-pressed={selected}
      data-selected={selected || undefined}
      data-dragging={!!gesture.current || undefined}
      title={`${track.label}: ${value.start.toFixed(2)}s–${value.end.toFixed(2)}s`}
      style={{
        left: (value.start - viewStart) * pxPerSecond,
        width: (value.end - value.start) * pxPerSecond,
        background: color,
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerDown={(e) => {
        if (e.button !== 0 || pending.current) return;
        e.preventDefault();
        e.stopPropagation();
        (e.target as HTMLElement).focus({ preventScroll: true });
        onSelect();
        const edge = (e.target as HTMLElement).dataset.edge;
        gesture.current = {
          x: e.clientX,
          mode: edge === "start" || edge === "end" ? edge : "move",
          base: track,
          timing: track,
          moved: false,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        const g = gesture.current;
        if (!g || !pxPerSecond) return;
        if (!g.moved && Math.abs(e.clientX - g.x) < 2) return;
        g.moved = true;
        g.timing = dragTrack(
          g.base,
          g.mode,
          (e.clientX - g.x) / pxPerSecond,
          duration,
          fps,
        );
        g.timing = constrain(g.timing, g.mode);
        setDraft(g.timing);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        const g = gesture.current;
        gesture.current = null;
        if (g) void commit(g.base, g.timing);
      }}
      onPointerCancel={(e) => {
        e.stopPropagation();
        cancel();
      }}
      onLostPointerCapture={() => {
        if (gesture.current) cancel();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          cancel();
          onDeselect();
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onSelect();
          return;
        }
        if (
          !["ArrowLeft", "ArrowRight"].includes(e.key) ||
          e.metaKey ||
          e.ctrlKey ||
          e.altKey ||
          pending.current
        )
          return;
        e.preventDefault();
        e.stopPropagation();
        const edge = (e.target as HTMLElement).dataset.edge;
        const timing = constrain(
          dragTrack(
            track,
            edge === "start" || edge === "end" ? edge : "move",
            ((e.key === "ArrowLeft" ? -1 : 1) * (e.shiftKey ? 10 : 1)) / fps,
            duration,
            fps,
          ),
          edge === "start" || edge === "end" ? edge : "move",
        );
        setDraft(timing);
        void commit(track, timing);
      }}
    >
      <span
        className="dialkit-timeline-clip-handle"
        data-edge="start"
        role="slider"
        tabIndex={0}
        aria-label={`${track.label} start`}
        aria-valuemin={bounds?.start ?? 0}
        aria-valuemax={value.end - 1 / fps}
        aria-valuenow={value.start}
      />
      {track.keys.map((key, i) => (
        <i
          className="timeline-cue"
          key={i}
          style={{
            left: `${((key - track.start) / (track.end - track.start)) * 100}%`,
          }}
        />
      ))}
      <span
        className="dialkit-timeline-clip-handle"
        data-edge="end"
        role="slider"
        tabIndex={0}
        aria-label={`${track.label} end`}
        aria-valuemin={value.start + 1 / fps}
        aria-valuemax={bounds?.end ?? duration}
        aria-valuenow={value.end}
      />
    </div>
  );
}
