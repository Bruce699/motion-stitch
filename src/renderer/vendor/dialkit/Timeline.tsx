import { Icon } from "../../icons";
import { TimelineClip } from "./TimelineClip";
import { trackRows, type TrackTiming } from "../../../core/tracks";
import type { TimelineContext } from "../../../core/context";
// Adapted from Dial Kit's DialTimeline.tsx (MIT). See UPSTREAM.md.
// Tilt supplies the only clock. This component owns inspection, never animation values.
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

export type CueTrack = {
  id: string;
  label: string;
  color: string;
  start: number;
  end: number;
  keys: number[];
  parentId?: string;
  kind?: "animation" | "group";
};
type Props = {
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
const PLAYHEAD_FLAG_WIDTH = 52;

export function Timeline({
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
    scroller = useRef<HTMLDivElement>(null),
    body = useRef<HTMLDivElement>(null);
  const [laneWidth, setLaneWidth] = useState(0),
    [zoom, setZoom] = useState(initialContext?.zoom || 1),
    [viewStart, setViewStart] = useState(initialContext?.start || 0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(initialContext?.expandedTrackIds));
  const drag = useRef<{
    rect: DOMRect;
    start: number;
    span: number;
    x: number;
    zoom: number;
    mode: "scrub" | "zoom" | "overview";
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
  useLayoutEffect(() => {
    onContextChange?.({ start: safeStart, end: viewEnd, zoom, expandedTrackIds: [...expanded] });
  }, [safeStart, viewEnd, zoom, expanded, onContextChange]);
  const pxPerSecond = laneWidth / visibleDuration;
  const maxZoom = Math.max(
    8,
    (MAJOR_TICK_TARGET_PX * duration) / (0.001 * 10 * Math.max(laneWidth, 1)),
  );
  const reset = () => {
    setZoom(1);
    setViewStart(0);
  };
  const setZoomAt = (next: number, ratio = 0.5) => {
    const z = clamp(next, 1, maxZoom);
    const anchor = safeStart + ratio * visibleDuration;
    setZoom(z);
    setViewStart(
      clamp(anchor - (ratio * duration) / z, 0, duration - duration / z),
    );
  };
  useEffect(() => {
    setZoom((z) => clamp(z, 1, maxZoom));
  }, [maxZoom]);
  useLayoutEffect(() => {
    if (
      scroller.current &&
      Math.abs(scroller.current.scrollLeft - safeStart * pxPerSecond) > 0.5
    )
      scroller.current.scrollLeft = safeStart * pxPerSecond;
  }, [safeStart, pxPerSecond]);
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const wheel = (event: WheelEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const r = ruler.current!.getBoundingClientRect();
        setZoomAt(
          zoom * Math.exp(-event.deltaY / ZOOM_DRAG_DISTANCE),
          clamp((event.clientX - r.left) / r.width, 0, 1),
        );
      } else if (
        zoom > 1 &&
        (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY))
      ) {
        event.preventDefault();
        setViewStart(
          clamp(
            safeStart +
              (event.shiftKey ? event.deltaY : event.deltaX) / pxPerSecond,
            0,
            duration - visibleDuration,
          ),
        );
      }
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [zoom, safeStart, duration, visibleDuration, pxPerSecond, maxZoom]);
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
      if (d.mode === "overview" && zoom > 1)
        setViewStart(
          clamp(next - visibleDuration / 2, 0, duration - visibleDuration),
        );
    }
  };
  const begin = (
    event: React.PointerEvent<HTMLDivElement>,
    overview = false,
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    const full = overview || event.shiftKey;
    if (event.shiftKey && !overview) reset();
    drag.current = {
      rect: (overview
        ? event.currentTarget
        : ruler.current!
      ).getBoundingClientRect(),
      start: full ? 0 : safeStart,
      span: full ? duration : visibleDuration,
      x: event.clientX,
      zoom,
      mode: overview ? "overview" : event.altKey ? "zoom" : "scrub",
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
  const flagCenter = clamp(
    x,
    PLAYHEAD_FLAG_WIDTH / 2 - 1,
    Math.max(
      PLAYHEAD_FLAG_WIDTH / 2 - 1,
      laneWidth - PLAYHEAD_FLAG_WIDTH / 2 + 1,
    ),
  );
  return (
    <div className="dialkit-timeline-section tilt-timeline" ref={body}>
      <div className="timeline-overview-row">
        <div
          className="dialkit-timeline-overview"
          role="slider"
          aria-label="Scene time"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={time}
          tabIndex={0}
          onPointerDown={(e) => begin(e, true)}
          {...interaction}
        >
          <div
            className="dialkit-timeline-overview-progress"
            style={{ width: `${(time / duration) * 100}%` }}
          />
          <div
            className="dialkit-timeline-overview-viewport"
            data-zoomed={zoom > 1 || undefined}
            style={{
              left: `${(safeStart / duration) * 100}%`,
              width: `${(visibleDuration / duration) * 100}%`,
            }}
          />
          <div
            className="dialkit-timeline-overview-playhead"
            style={{ left: `${(time / duration) * 100}%` }}
          />
        </div>
        <div className="timeline-zoom">
          <button
            aria-label="Zoom timeline out"
            disabled={zoom <= 1}
            onClick={() => setZoomAt(zoom / 2)}
          >
            <Icon name="minus" size={14} />
          </button>
          <button
            onClick={reset}
            aria-label="Fit timeline"
            title="Fit timeline"
          >
            {zoom === 1 ? "Fit" : `${Math.round(zoom * 100)}%`}
          </button>
          <button
            aria-label="Zoom timeline in"
            disabled={zoom >= maxZoom}
            onClick={() => setZoomAt(zoom * 2)}
          >
            <Icon name="plus" size={14} />
          </button>
        </div>
      </div>
      <div className="timeline-cue-scroll">
        <div className="dialkit-timeline-grid">
          <div className="dialkit-timeline-row dialkit-timeline-ruler-row">
            <div className="dialkit-timeline-label" />
            <div
              className="dialkit-timeline-ruler"
              ref={ruler}
              role="slider"
              aria-label="Timeline ruler"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={time}
              tabIndex={0}
              title="Drag to seek · Option-drag to zoom · Shift-drag to reset zoom"
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
          {trackRows(tracks, expanded).map(({ track, depth }) => (
            <div className="dialkit-timeline-row" key={track.id}>
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
              style={
                {
                  left: `calc(var(--dial-timeline-label-w) + ${x}px)`,
                  "--dial-timeline-playhead-flag-offset": `${flagCenter - x}px`,
                } as CSSProperties
              }
              onPointerDown={(e) => begin(e)}
              {...interaction}
            >
              <div className="dialkit-timeline-playhead-anchor">
                <div className="dialkit-timeline-playhead-flag">
                  {time.toFixed(2)}s
                </div>
              </div>
              <div className="dialkit-timeline-playhead-stem" />
            </div>
          )}
        </div>
      </div>
      {zoom > 1 && (
        <div className="dialkit-timeline-scroll-row">
          <div />
          <div
            ref={scroller}
            className="dialkit-timeline-horizontal-scroll"
            aria-label="Timeline horizontal scroll"
            onScroll={(e) =>
              setViewStart(
                clamp(
                  e.currentTarget.scrollLeft / pxPerSecond,
                  0,
                  duration - visibleDuration,
                ),
              )
            }
          >
            <div style={{ width: laneWidth * zoom }} />
          </div>
        </div>
      )}
    </div>
  );
}
