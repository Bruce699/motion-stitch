import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type {
  ProjectState,
  SceneDocument,
  RenderJob,
  Command,
} from "../core/schema";
import { SceneClock, LatestFrame } from "../core/motion";
import { SceneEngine } from "./engine";
import "./style.css";

const call = <T = any,>(command: Command) => window.tilt.invoke<T>(command);
const timecode = (t: number, fps: number) =>
  `${Math.floor(t / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(t % 60)
    .toString()
    .padStart(2, "0")}:${Math.floor((t % 1) * fps + 0.001)
    .toString()
    .padStart(2, "0")}`;
function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    play: <path d="m6 3 8 5-8 5Z" />,
    pause: (
      <>
        <path d="M5 3v10M11 3v10" />
      </>
    ),
    back: (
      <>
        <path d="M3 3v10m10-10L5 8l8 5Z" />
      </>
    ),
    next: (
      <>
        <path d="M13 3v10M3 3l8 5-8 5Z" />
      </>
    ),
    plus: <path d="M8 3v10M3 8h10" />,
    folder: <path d="M2 4h5l1-2h5a1 1 0 0 1 1 1v10H2Z" />,
    code: <path d="m5 4-4 4 4 4m6-8 4 4-4 4M9 2 7 14" />,
    scene: (
      <>
        <rect x="2" y="2" width="12" height="12" rx="2" />
        <path d="m6 5 5 3-5 3Z" />
      </>
    ),
    arrow: <path d="M8 11V1M4 5l4-4 4 4M2 10v4h12v-4" />,
    undo: <path d="M2 7h7a4 4 0 0 1 0 8M5 3 1 7l4 4" />,
    check: <path d="m3 8 3 3 7-7" />,
    close: <path d="m4 4 8 8M12 4l-8 8" />,
    chevron: <path d="m6 3 5 5-5 5" />,
    file: (
      <>
        <path d="M4 1h6l3 3v11H4Z" />
        <path d="M9 1v4h4" />
      </>
    ),
    refresh: <path d="M13 6a5 5 0 1 0 0 5M13 2v4H9" />,
    grid: (
      <>
        <rect x="2" y="2" width="12" height="12" rx="1" />
        <path d="M2 7h12M7 2v12" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={name === "play" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.file}
    </svg>
  );
}
function Button({
  label,
  icon,
  onClick,
  disabled = false,
  className = "",
}: {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      className={`icon-button ${className}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={icon} />
    </button>
  );
}

function App() {
  const [state, setState] = useState<ProjectState>();
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState(0);
  const [files, setFiles] = useState<string[]>([]);
  const [tab, setTab] = useState<"scene" | "source">("scene");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);
  const [showJobs, setShowJobs] = useState(false);
  const [newName, setNewName] = useState<string | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const engine = useRef<SceneEngine | null>(null);
  const clock = useRef(new SceneClock(8, 30));
  const current = useRef(state);
  current.current = state;
  const generation = useRef(0);
  const presentation = useRef(0);
  const contextRetries = useRef(0);
  const request = useRef<LatestFrame<number> | null>(null);
  const [retry, setRetry] = useState(0);
  const invoke = async (cmd: Command) => {
    try {
      return await call(cmd);
    } catch (e) {
      setError(String(e));
      return undefined;
    }
  };
  async function refresh() {
    try {
      const s = await call<ProjectState>({ type: "state" });
      setState(s);
      if (s.error) setError(s.error);
    } catch (e) {
      setError(String(e));
    }
  }
  useEffect(() => {
    void refresh();
    const off = window.tilt.onChange(() => {
      void refresh();
    });
    let pending = false;
    const timer = setInterval(async () => {
      if (pending) return;
      pending = true;
      try {
        const jobs = await call<RenderJob[]>({ type: "jobs" });
        setState((s) => (s ? { ...s, jobs } : s));
      } finally {
        pending = false;
      }
    }, 2000);
    return () => {
      off();
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    if (!state) return;
    void call<string[]>({ type: "list_files" })
      .then(setFiles)
      .catch(() => {});
  }, [state?.scene.id, state?.codeRevision]);
  useEffect(() => {
    if (!state || state.error) return;
    const n = ++generation.current;
    const s = state.scene;
    clock.current.ready = false;
    setReady(false);
    request.current?.invalidate();
    let disposed = false;
    let candidate: SceneEngine | null = null;
    const init = async () => {
      try {
        const prep = await call<{ url: string; scene: SceneDocument }>({
          type: "prepare",
        });
        if (disposed || n !== generation.current) return;
        candidate = new SceneEngine(prep.scene, (t) =>
          call({ type: "frame", time: t }),
        );
        await candidate.init(prep.url + "?generation=" + n);
        const t = clock.current.seek(Math.min(clock.current.time, s.duration));
        await candidate.sample(t, current.current?.scene || s);
        if (disposed || n !== generation.current) {
          candidate.dispose();
          return;
        }
        const old = engine.current;
        engine.current = candidate;
        stage.current!.replaceChildren(candidate.canvas);
        old?.dispose();
        candidate.canvas.addEventListener("webglcontextlost", (event) => {
          if (engine.current !== candidate) return;
          event.preventDefault();
          clock.current.ready = false;
          setReady(false);
          if (contextRetries.current < 1) {
            contextRetries.current++;
            setRetry((x) => x + 1);
          } else setError("Graphics context lost. Retry to rebuild the scene.");
        });
        clock.current.duration = s.duration;
        clock.current.fps = s.fps;
        clock.current.ready = true;
        setReady(true);
        setError(null);
        request.current = new LatestFrame(
          async (t, isCurrent) => {
            const epoch = presentation.current;
            const valid = () => isCurrent() && epoch === presentation.current;
            await engine.current?.sample(t, current.current!.scene, valid);
            if (valid()) {
              setTime(t);
            }
          },
          (e) => {
            clock.current.pause();
            setPlaying(false);
            setError(String(e));
          },
        );
        void call<any[]>({ type: "inspect" })
          .then(setSubjects)
          .catch(() => {});
      } catch (e) {
        candidate?.dispose();
        if (!disposed) {
          setError(String(e));
          clock.current.pause();
          setPlaying(false);
        }
      }
    };
    void init();
    return () => {
      disposed = true;
    };
  }, [
    state?.scene.id,
    state?.codeRevision,
    JSON.stringify(state?.scene.sources),
    state?.scene.entry,
    retry,
  ]);
  useEffect(() => {
    if (!state) return;
    clock.current.duration = state.scene.duration;
    clock.current.fps = state.scene.fps;
    clock.current.seek(clock.current.time);
    request.current?.request(clock.current.time);
  }, [state?.revision]);
  useEffect(() => {
    let stop = false;
    let last = performance.now();
    let frames = 0;
    let measure = last;
    const tick = async () => {
      if (stop) return;
      const now = performance.now();
      if (
        clock.current.playing &&
        clock.current.ready &&
        engine.current &&
        current.current
      ) {
        const t = clock.current.advance((now - last) / 1000);
        last = now;
        const epoch = presentation.current;
        try {
          await engine.current.sample(
            t,
            current.current.scene,
            () => epoch === presentation.current,
          );
          if (epoch === presentation.current) {
            setTime(clock.current.time);
            setPlaying(clock.current.playing);
          }
          frames++;
          if (now - measure > 1000) {
            setFps(Math.round((frames * 1000) / (now - measure)));
            frames = 0;
            measure = now;
          }
        } catch (e) {
          clock.current.pause();
          setPlaying(false);
          setError(String(e));
        }
      } else {
        last = now;
        measure = now;
        frames = 0;
      }
      requestAnimationFrame(() => {
        void tick();
      });
    };
    void tick();
    return () => {
      stop = true;
    };
  }, []);
  function seek(t: number) {
    presentation.current++;
    clock.current.pause();
    setPlaying(false);
    const next = clock.current.seek(t);
    setTime(next);
    request.current?.request(next);
    void call({ type: "activity", activity: "scrub" });
  }
  function toggle() {
    if (clock.current.playing) clock.current.pause();
    else clock.current.play();
    setPlaying(clock.current.playing);
  }
  useEffect(() => {
    void call({ type: "activity", activity: playing ? "play" : "idle" });
    if (!playing) return;
    const timer = setInterval(() => {
      void call({ type: "activity", activity: "play" });
    }, 1000);
    return () => {
      clearInterval(timer);
      void call({ type: "activity", activity: "idle" });
    };
  }, [playing]);
  useEffect(
    () =>
      window.tilt.onTransport((c) => {
        if (c.time !== undefined) seek(c.time);
        if (c.playing !== undefined) {
          c.playing ? clock.current.play() : clock.current.pause();
          setPlaying(c.playing);
        }
      }),
    [],
  );
  useEffect(() => {
    window.__tiltCapture = async (t) => {
      presentation.current++;
      clock.current.pause();
      setPlaying(false);
      request.current?.invalidate();
      if (!engine.current || !current.current)
        throw new Error("Scene is preparing");
      clock.current.seek(t);
      await engine.current.sample(t, current.current.scene);
      setTime(t);
      return engine.current.canvas.toDataURL("image/png");
    };
    return () => {
      delete window.__tiltCapture;
    };
  }, []);
  useEffect(() => {
    const frame = stage.current?.parentElement;
    const area = frame?.parentElement;
    if (!frame || !area || !s) return;
    const fit = () => {
      frame.style.width =
        Math.min(
          area.clientWidth - 72,
          ((area.clientHeight - 38) * s.size.width) / s.size.height,
        ) + "px";
    };
    const observer = new ResizeObserver(fit);
    observer.observe(area);
    fit();
    return () => observer.disconnect();
  }, [state?.scene.size.width, state?.scene.size.height]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches("input,textarea,select")) return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        seek(clock.current.time - 1 / clock.current.fps);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        seek(clock.current.time + 1 / clock.current.fps);
      } else if (e.key === "Home") seek(0);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  async function render() {
    setExporting(true);
    setShowJobs(true);
    await invoke({ type: "export", requestId: crypto.randomUUID() });
    await refresh();
    setExporting(false);
  }
  const s = state?.scene;
  const activeJobs =
    state?.jobs.filter((j) =>
      ["preparing", "queued", "capturing", "encoding"].includes(j.phase),
    ) || [];
  return (
    <div className="app">
      <header className="titlebar">
        <div className="brand">Tilt</div>
        <div className="document-title">
          {s?.name || "Opening…"}
          <span className="saved-dot" title="Saved to scene.json" />
        </div>
        <div className="header-actions">
          <Button
            icon="undo"
            label="Undo"
            onClick={() => void invoke({ type: "undo" })}
          />
          <Button
            icon="folder"
            label="Reveal scene files"
            onClick={() => void invoke({ type: "reveal" })}
          />
          <button
            className="render-button"
            onClick={() => void render()}
            disabled={!ready || exporting}
          >
            <Icon name="arrow" />
            {exporting ? "Preparing…" : "Render"}
          </button>
        </div>
      </header>
      <aside className="sidebar">
        <div className="section-heading">
          Scenes
          <Button
            icon="plus"
            label="New scene"
            onClick={() => setNewName("Untitled")}
          />
        </div>
        <div className="scene-list">
          {state?.scenes.map((item) => (
            <button
              key={item.id}
              className={`scene-item ${s?.id === item.id ? "selected" : ""}`}
              onClick={() => {
                clock.current.pause();
                setPlaying(false);
                clock.current.seek(0);
                void invoke({ type: "open", id: item.id }).then(() =>
                  refresh(),
                );
              }}
            >
              <Icon name="scene" />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
        <div className="files-heading section-heading">
          Files
          <Button
            icon="folder"
            label="Open folder"
            onClick={() => void invoke({ type: "reveal" })}
          />
        </div>
        <div className="file-list">
          {files.map((file) => (
            <div className="file-item" key={file} title={file}>
              <Icon name={file.endsWith(".ts") ? "code" : "file"} size={14} />
              <span>{file}</span>
            </div>
          ))}
        </div>
        <button
          className="agent-help"
          onClick={() => void invoke({ type: "reveal" })}
        >
          <Icon name="code" />
          <span>Agent workspace</span>
          <Icon name="chevron" size={12} />
        </button>
      </aside>
      <main className="workspace">
        <div className="canvas-toolbar">
          <span>
            <Icon name="scene" />
            {s?.name}
          </span>
          <span>
            {s?.size.width} × {s?.size.height}
            <span className="divider" />
            Fit
          </span>
        </div>
        <div className="canvas-area">
          <div
            className="canvas-frame"
            style={{
              aspectRatio: s ? `${s.size.width}/${s.size.height}` : "1.6",
            }}
          >
            <div className="scene-stage" ref={stage} />
            {!ready && (
              <div className="preparing">
                <span className="spinner" />
                Preparing scene
              </div>
            )}
          </div>
        </div>
        <div className="canvas-status">
          <span>
            {s?.sources.length || 0} web source
            {(s?.sources.length || 0) === 1 ? "" : "s"}
          </span>
          <span>
            {playing ? `${fps} fps preview` : ready ? "Ready" : "Preparing"}
          </span>
        </div>
      </main>
      <aside className="inspector">
        <div className="tabs">
          <button
            className={tab === "scene" ? "active" : ""}
            onClick={() => setTab("scene")}
          >
            Scene
          </button>
          <button
            className={tab === "source" ? "active" : ""}
            onClick={() => setTab("source")}
          >
            Sources
          </button>
        </div>
        {s && tab === "scene" ? (
          <>
            <div className="inspector-section">
              <label className="field">
                <span>Name</span>
                <input
                  key={s.id + s.name}
                  aria-label="Scene name"
                  defaultValue={s.name}
                  onBlur={(e) => {
                    if (e.target.value !== s.name)
                      void invoke({
                        type: "set_setting",
                        key: "name",
                        value: e.target.value,
                      });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                />
              </label>
              <div className="field-pair">
                <label className="field">
                  <span>Duration</span>
                  <div className="input-unit">
                    <input
                      aria-label="Duration"
                      type="number"
                      min="0.1"
                      max="600"
                      step="0.1"
                      value={s.duration}
                      onChange={(e) => {
                        if (e.target.value)
                          void invoke({
                            type: "set_setting",
                            key: "duration",
                            value: +e.target.value,
                          });
                      }}
                    />
                    <span>s</span>
                  </div>
                </label>
                <label className="field">
                  <span>Frame rate</span>
                  <select
                    aria-label="Frame rate"
                    value={s.fps}
                    onChange={(e) =>
                      void invoke({
                        type: "set_setting",
                        key: "fps",
                        value: +e.target.value,
                      })
                    }
                  >
                    {[24, 25, 30, 60, 120].map((n) => (
                      <option key={n} value={n}>
                        {n} fps
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="color-field">
                <span>Background</span>
                <input
                  type="color"
                  aria-label="Background"
                  value={s.background}
                  onChange={(e) =>
                    void invoke({
                      type: "set_setting",
                      key: "background",
                      value: e.target.value,
                    })
                  }
                />
                <code>{s.background.toUpperCase()}</code>
              </label>
            </div>
            <div className="inspector-section">
              <div className="section-heading plain">Parameters</div>
              {Object.entries(s.parameters).map(([key, p]) => (
                <Parameter
                  key={s.id + key}
                  name={key}
                  param={p}
                  change={(value) =>
                    void invoke({ type: "set_parameter", key, value })
                  }
                />
              ))}
            </div>
            <div className="code-reference">
              <Icon name="code" />
              <span>{s.entry}</span>
              <button onClick={() => void invoke({ type: "reveal" })}>
                Open folder
              </button>
            </div>
          </>
        ) : (
          <div className="inspector-section">
            {s?.sources.map((source) => (
              <div className="source-card" key={source.id}>
                <div>
                  <Icon name="grid" />
                  <strong>{source.id}</strong>
                </div>
                <p>{source.url || source.entry}</p>
                <span>
                  {source.width} × {source.height} · {source.sampling}
                </span>
                <div className="subject-list">
                  {subjects
                    .find((x) => x.source === source.id)
                    ?.subjects.map((item: any) => (
                      <div key={item.id}>
                        <span className="subject-dot" />
                        {item.id}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
      <section className="timeline">
        <div className="transport">
          <div className="transport-left">
            <Button icon="back" label="Go to start" onClick={() => seek(0)} />
            <Button
              icon={playing ? "pause" : "play"}
              label={playing ? "Pause" : "Play"}
              onClick={toggle}
            />
            <Button
              icon="next"
              label="Step forward"
              onClick={() => seek(clock.current.time + 1 / clock.current.fps)}
            />
            <span className="timecode">{timecode(time, s?.fps || 30)}</span>
            <span className="total-time">
              / {timecode(s?.duration || 0, s?.fps || 30)}
            </span>
          </div>
          <div className="transport-right">
            <span>{s?.fps} fps</span>
            <button
              className={showJobs ? "jobs-toggle active" : "jobs-toggle"}
              onClick={() => setShowJobs((x) => !x)}
            >
              Renders
              {activeJobs.length > 0 && (
                <span className="job-count">{activeJobs.length}</span>
              )}
            </button>
          </div>
        </div>
        <div className="timeline-body">
          <div className="track-names">
            <div className="ruler-name">{s?.name}</div>
            {s?.tracks.map((track) => (
              <div className="track-name" key={track.id}>
                <span style={{ background: track.color }} />
                {track.label}
              </div>
            ))}
          </div>
          <div
            className="tracks"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              const r = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - r.left) / r.width) * (s?.duration || 1));
            }}
            onPointerMove={(e) => {
              if (e.buttons === 1) {
                const r = e.currentTarget.getBoundingClientRect();
                seek(((e.clientX - r.left) / r.width) * (s?.duration || 1));
              }
            }}
            onPointerUp={() =>
              void call({ type: "activity", activity: "idle" })
            }
          >
            <div className="ruler">
              {Array.from(
                { length: Math.floor(s?.duration || 8) + 1 },
                (_, i) => (
                  <span
                    key={i}
                    style={{ left: `${(i / (s?.duration || 8)) * 100}%` }}
                  >
                    {i}s
                  </span>
                ),
              )}
            </div>
            {s?.tracks.map((track) => (
              <div className="track-row" key={track.id}>
                <div
                  className="track-clip"
                  style={{
                    left: `${(track.start / s.duration) * 100}%`,
                    width: `${((track.end - track.start) / s.duration) * 100}%`,
                    color: track.color,
                    background: track.color + "20",
                    borderColor: track.color + "50",
                  }}
                >
                  <span>{track.label}</span>
                  {track.keys.map((k, i) => (
                    <i
                      key={i}
                      style={{
                        left: `${((k - track.start) / (track.end - track.start)) * 100}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div
              className="playhead"
              style={{ left: `${(time / (s?.duration || 8)) * 100}%` }}
            >
              <span />
            </div>
            <input
              className="timeline-accessible"
              type="range"
              aria-label="Scene time"
              min="0"
              max={s?.duration || 8}
              step={1 / (s?.fps || 30)}
              value={time}
              onChange={(e) => seek(+e.target.value)}
            />
          </div>
        </div>
      </section>
      {error && (
        <div className="error-toast" role="alert">
          <div>
            {error
              .replace(
                "Error invoking remote method 'tilt:command': Error: ",
                "",
              )
              .slice(0, 500)}
          </div>
          <button
            onClick={() => {
              setError(null);
              setRetry((x) => x + 1);
            }}
          >
            Retry
          </button>
          <Button
            icon="close"
            label="Dismiss error"
            onClick={() => setError(null)}
          />
        </div>
      )}
      {showJobs && (
        <div className="jobs-panel">
          <div className="section-heading">
            Renders
            <Button
              icon="close"
              label="Close renders"
              onClick={() => setShowJobs(false)}
            />
          </div>
          {!state?.jobs.length && !exporting && (
            <div className="empty-jobs">No renders yet</div>
          )}
          {exporting && (
            <div className="job">
              <span className="spinner" />
              Preparing snapshot…
            </div>
          )}
          {state?.jobs.map((job) => (
            <div className="job" key={job.id}>
              <div className="job-top">
                <strong>{job.sceneName}</strong>
                <span>{job.phase}</span>
              </div>
              <div className="job-detail">
                {job.width} × {job.height} · {job.fps} fps
                {job.elapsedMs
                  ? ` · ${(job.elapsedMs / 1000).toFixed(1)}s`
                  : ""}
              </div>
              {["capturing", "queued", "encoding"].includes(job.phase) && (
                <progress max={job.total} value={job.frame} />
              )}
              <div className="job-actions">
                {job.phase === "complete" ? (
                  <button
                    onClick={() =>
                      void invoke({ type: "reveal_job", id: job.id })
                    }
                  >
                    Show video
                  </button>
                ) : ["failed", "interrupted", "cancelled"].includes(
                    job.phase,
                  ) ? (
                  <button
                    onClick={() =>
                      void invoke({ type: "resume", id: job.id }).then(() =>
                        refresh(),
                      )
                    }
                  >
                    Resume
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      void invoke({ type: "cancel", id: job.id }).then(() =>
                        refresh(),
                      )
                    }
                  >
                    Cancel
                  </button>
                )}
                <span>
                  {job.frame} / {job.total}
                </span>
              </div>
              {job.error && <div className="job-error">{job.error}</div>}
            </div>
          ))}
        </div>
      )}
      {newName !== null && (
        <div className="modal-backdrop" onClick={() => setNewName(null)}>
          <form
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              void invoke({ type: "create", name: newName || "Untitled" }).then(
                () => refresh(),
              );
              setNewName(null);
            }}
          >
            <h2>New scene</h2>
            <input
              autoFocus
              aria-label="New scene name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div>
              <button type="button" onClick={() => setNewName(null)}>
                Cancel
              </button>
              <button className="primary" type="submit">
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
function Parameter({
  name,
  param,
  change,
}: {
  name: string;
  param: SceneDocument["parameters"][string];
  change: (v: number) => void;
}) {
  const [draft, setDraft] = useState(param.value);
  const dragging = useRef(false);
  useEffect(() => {
    if (!dragging.current) setDraft(param.value);
  }, [param.value]);
  return (
    <label className="parameter">
      <div>
        <span>{param.label}</span>
        <input
          aria-label={param.label + " value"}
          type="number"
          min={param.min}
          max={param.max}
          step={param.step}
          value={draft}
          onChange={(e) => setDraft(+e.target.value)}
          onBlur={() => change(draft)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
      </div>
      <input
        aria-label={param.label}
        type="range"
        min={param.min}
        max={param.max}
        step={param.step}
        value={draft}
        onPointerDown={() => {
          dragging.current = true;
        }}
        onChange={(e) => {
          const v = +e.target.value;
          setDraft(v);
          change(v);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
      />
    </label>
  );
}

if (new URLSearchParams(location.search).has("render")) {
  const setup = async () => {
    const prep = await call<{ scene: SceneDocument; url: string }>({
      type: "prepare",
    });
    const e = new SceneEngine(prep.scene, (t) =>
      call({ type: "frame", time: t }),
    );
    await e.init(prep.url);
    document.body.replaceChildren(e.canvas);
    window.__tiltRender = async (time) => {
      await e.sample(time);
      return e.canvas.toDataURL("image/png");
    };
  };
  void setup().catch((e) => {
    document.body.textContent = String(e);
    console.error(e);
  });
} else createRoot(document.getElementById("root")!).render(<App />);
