import { Icon } from "../../icons";
import { TimelineClip } from "./TimelineClip";
import { timelineColor } from "../../timeline-colors";
import { trackRows, type TrackTiming } from "../../../core/tracks";
import type { TimelineContext } from "../../../core/context";
// Adapted from Dial Kit's DialTimeline.tsx (MIT). See UPSTREAM.md.
// Tilt supplies the only clock. This component owns inspection, never animation values.
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type CueTrack = {
  id: string;
  label: string;
  color: string;
  start: number;
  end: number;
  keys: number[];
  parentId?: string;
  kind?: "animation" | "group" | "clip";
};
type Props = {
  transport?: ReactNode;
  collapsed?: boolean;
  actions?: ReactNode;
  duration: number;
  time: number;
  fps: number;
  tracks: CueTrack[];
  selectedId?: string;
  onSelect: (id?: string) => void;
  onTrackChange: (track: CueTrack, timing: TrackTiming) => Promise<unknown>;
  onSeek: (time: number) => void;
  onScrubEnd: () => void;
  initialContext?: TimelineContext;
  onContextChange?: (context: TimelineContext) => void;
};
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const TICK_STEPS = [
  0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60,
  120, 300, 600,
];
const MAJOR_TICK_TARGET_PX = 140;
const ZOOM_DRAG_DISTANCE = 180;

export function Timeline({
  transport,
  collapsed = false,
  actions,
  duration,
  time,
  fps,
  tracks,
  selectedId,
  onSelect,
  onTrackChange,
  onSeek,
  onScrubEnd,
  initialContext,
  onContextChange,
}: Props) {
  const ruler = useRef<HTMLDivElement>(null),
    body = useRef<HTMLDivElement>(null);
  const [laneWidth, setLaneWidth] = useState(0),
    [zoom, setZoom] = useState(initialContext?.zoom || 1),
    [viewStart, setViewStart] = useState(initialContext?.start || 0);
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(initialContext?.expandedTrackIds),
  );
  const drag = useRef<{
    rect: DOMRect;
    start: number;
    span: number;
    x: number;
    zoom: number;
    mode: "scrub" | "zoom";
  } | null>(null);
  useLayoutEffect(() => {
    const element = ruler.current;
    if (!element) return;
    const measure = () => setLaneWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const visibleDuration = duration / zoom;
  const safeStart = clamp(
    viewStart,
    0,
    Math.max(0, duration - visibleDuration),
  );
  const viewEnd = safeStart + visibleDuration;
  // Wheel events can arrive several times before React paints. Keep their anchor
  // in sync immediately, rather than applying every event to the previous render.
  const view = useRef({ zoom, start: safeStart });
  useLayoutEffect(() => {
    view.current = { zoom, start: safeStart };
  }, [zoom, safeStart]);
  useLayoutEffect(() => {
    onContextChange?.({
      start: safeStart,
      end: viewEnd,
      zoom,
      expandedTrackIds: [...expanded],
    });
  }, [safeStart, viewEnd, zoom, expanded, onContextChange]);
  const pxPerSecond = laneWidth / visibleDuration;
  const maxZoom = Math.max(
    8,
    (MAJOR_TICK_TARGET_PX * duration) / (0.001 * 10 * Math.max(laneWidth, 1)),
  );
  const updateView = (nextZoom: number, nextStart: number) => {
    view.current = { zoom: nextZoom, start: nextStart };
    setZoom(nextZoom);
    setViewStart(nextStart);
  };
  const reset = () => updateView(1, 0);
  const setZoomAt = (next: number, ratio = 0.5) => {
    const z = clamp(next, 1, maxZoom);
    const anchor = view.current.start + (ratio * duration) / view.current.zoom;
    updateView(
      z,
      clamp(anchor - (ratio * duration) / z, 0, duration - duration / z),
    );
  };
  useEffect(() => {
    setZoom((z) => clamp(z, 1, maxZoom));
  }, [maxZoom]);
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const wheel = (event: WheelEvent) => {
      const r = ruler.current!.getBoundingClientRect();
      if (!r.width || event.clientX < r.left) return;
      const unit =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? r.width : 1;
      if (event.altKey || event.ctrlKey || event.metaKey) {
        event.preventDefault();
        setZoomAt(
          view.current.zoom *
            Math.exp((-event.deltaY * unit) / ZOOM_DRAG_DISTANCE),
          clamp((event.clientX - r.left) / r.width, 0, 1),
        );
      } else if (
        view.current.zoom > 1 &&
        (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY))
      ) {
        event.preventDefault();
        const span = duration / view.current.zoom;
        const delta =
          event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
        updateView(
          view.current.zoom,
          clamp(
            view.current.start + (delta * unit * span) / r.width,
            0,
            duration - span,
          ),
        );
      }
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [duration, maxZoom]);
  const move = (clientX: number) => {
    const d = drag.current;
    if (!d || !d.rect.width) return;
    const ratio = clamp((clientX - d.rect.left) / d.rect.width, 0, 1);
    if (d.mode === "zoom") {
      const anchorRatio = clamp((d.x - d.rect.left) / d.rect.width, 0, 1);
      const next = clamp(
        d.zoom * Math.exp((clientX - d.x) / ZOOM_DRAG_DISTANCE),
        1,
        maxZoom,
      );
      setZoom(next);
      setViewStart(
        clamp(
          d.start + anchorRatio * d.span - (anchorRatio * duration) / next,
          0,
          duration - duration / next,
        ),
      );
    } else {
      const next = clamp(d.start + ratio * d.span, 0, duration);
      onSeek(next);
    }
  };
  const begin = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    const full = event.shiftKey;
    if (full) reset();
    drag.current = {
      rect: ruler.current!.getBoundingClientRect(),
      start: full ? 0 : safeStart,
      span: full ? duration : visibleDuration,
      x: event.clientX,
      zoom,
      mode: event.altKey && !full ? "zoom" : "scrub",
    };
    move(event.clientX);
  };
  const finish = () => {
    if (!drag.current) return;
    drag.current = null;
    onScrubEnd();
  };
  useEffect(() => {
    window.addEventListener("blur", finish);
    return () => window.removeEventListener("blur", finish);
  }, [onScrubEnd]);
  const keyboard = (event: React.KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (["+", "=", "-", "0"].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "0") reset();
      else setZoomAt(view.current.zoom * (event.key === "-" ? 0.5 : 2));
      return;
    }
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? duration
          : ["ArrowLeft", "ArrowDown"].includes(event.key)
            ? time - (event.shiftKey ? 10 : 1) / fps
            : ["ArrowRight", "ArrowUp"].includes(event.key)
              ? time + (event.shiftKey ? 10 : 1) / fps
              : undefined;
    if (next === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    onSeek(clamp(next, 0, duration));
    onScrubEnd();
  };
  const interaction = {
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => move(e.clientX),
    onPointerUp: finish,
    onPointerCancel: finish,
    onLostPointerCapture: finish,
    onKeyDown: keyboard,
  };
  const rawStep = pxPerSecond > 0 ? MAJOR_TICK_TARGET_PX / pxPerSecond : 1;
  const adaptiveStep = TICK_STEPS.find((step) => step >= rawStep) ?? 600;
  const majorStep =
    zoom < 1.5 && duration >= 1 ? Math.max(1, adaptiveStep) : adaptiveStep;
  const fineStep = majorStep / 10;
  const ticks: { time: number; major: boolean; medium: boolean }[] = [];
  for (
    let i = Math.ceil((safeStart - 1e-6) / fineStep);
    i <= Math.floor((viewEnd + 1e-6) / fineStep);
    i++
  )
    ticks.push({
      time: Number((i * fineStep).toFixed(6)),
      major: i % 10 === 0,
      medium: i % 5 === 0,
    });
  const x = clamp((time - safeStart) * pxPerSecond, 0, laneWidth);
  return (
    <div
      className="dialkit-timeline-section tilt-timeline"
      data-collapsed={collapsed || undefined}
      ref={body}
    >
      <div className="timeline-end">{actions}</div>
      <div className="timeline-cue-scroll">
        <div className="dialkit-timeline-grid">
          <div className="dialkit-timeline-row dialkit-timeline-ruler-row">
            <div className="dialkit-timeline-label timeline-transport">
              {transport}
            </div>
            <div
              className="dialkit-timeline-ruler"
              ref={ruler}
              role="slider"
              aria-label="Timeline ruler"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={time}
              tabIndex={0}
              title="Drag to seek · Pinch to zoom · Scroll sideways to pan · Double-click to fit"
              onDoubleClick={reset}
              onPointerDown={(e) => begin(e)}
              {...interaction}
            >
              {ticks.map((tick) => (
                <div
                  key={tick.time}
                  className={`dialkit-timeline-tick ${tick.major ? "" : tick.medium ? "dialkit-timeline-tick-medium" : "dialkit-timeline-tick-fine"}`}
                  style={{ left: (tick.time - safeStart) * pxPerSecond }}
                >
                  {tick.major && (
                    <span
                      className="dialkit-timeline-tick-label"
                      data-end={
                        viewEnd - tick.time < majorStep * 0.1 || undefined
                      }
                    >
                      {Number(tick.time.toFixed(3))}s
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          {!collapsed &&
            trackRows(tracks, expanded).map(({ track, depth }) => (
              <div
                className="dialkit-timeline-row"
                data-selected={selectedId === track.id || undefined}
                data-group={track.kind === "group" || undefined}
                key={track.id}
              >
                <div
                  className="dialkit-timeline-label timeline-track-label"
                  title={track.label}
                  style={{ paddingLeft: 12 + depth * 14 }}
                >
                  {track.kind === "group" &&
                    tracks.some((t) => t.parentId === track.id) && (
                      <button
                        className="timeline-group-toggle"
                        aria-label={`${expanded.has(track.id) ? "Collapse" : "Expand"} ${track.label}`}
                        aria-expanded={expanded.has(track.id)}
                        onClick={() => {
                          const next = new Set(expanded);
                          if (next.has(track.id)) {
                            next.delete(track.id);
                            const descendants = new Set([track.id]);
                            for (let size = -1; size !== descendants.size;) {
                              size = descendants.size;
                              for (const t of tracks)
                                if (t.parentId && descendants.has(t.parentId))
                                  descendants.add(t.id);
                            }
                            if (selectedId && descendants.has(selectedId))
                              onSelect(track.id);
                          } else next.add(track.id);
                          setExpanded(next);
                        }}
                      >
                        <Icon name="chevron" size={12} />
                      </button>
                    )}
                  <button
                    className="timeline-track-select"
                    aria-label={`Select ${track.label}`}
                    aria-pressed={selectedId === track.id}
                    onClick={() => onSelect(track.id)}
                  >
                    {track.label}
                  </button>
                </div>
                <div
                  className="dialkit-timeline-lane"
                  onPointerDown={(e) => {
                    onSelect();
                    begin(e);
                  }}
                  {...interaction}
                >
                  <TimelineClip
                    track={track}
                    color={timelineColor(track, tracks)}
                    duration={duration}
                    bounds={tracks.find((t) => t.id === track.parentId)}
                    fps={fps}
                    pxPerSecond={pxPerSecond}
                    viewStart={safeStart}
                    selected={selectedId === track.id}
                    onSelect={() => onSelect(track.id)}
                    onDeselect={() => onSelect()}
                    onCommit={onTrackChange}
                  />
                </div>
              </div>
            ))}
          {laneWidth > 0 && time >= safeStart && time <= viewEnd && (
            <div
              className="dialkit-timeline-playhead-control"
              style={{ left: `calc(var(--dial-timeline-label-w) + ${x}px)` }}
              onPointerDown={(e) => begin(e)}
              {...interaction}
            >
              <div className="dialkit-timeline-playhead-anchor">
                <div className="dialkit-timeline-playhead-flag" />
              </div>
              <div className="dialkit-timeline-playhead-stem" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
