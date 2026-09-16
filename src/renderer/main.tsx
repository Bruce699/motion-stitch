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

import { call, onChange, onRequest, savedView } from "./bridge";
import { defaultInspection } from "../core/context";
import { bindNavigation } from "./navigation";
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
  const [mode, setMode] = useState<"source" | "camera">(
    savedView?.mode || "camera",
  );
  const [selection, setSelection] = useState<string[]>(
    savedView?.selection || [],
  );
  const [zoom, setZoom] = useState(savedView?.inspection?.zoom || 1);
  const [retry, setRetry] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const engine = useRef<SceneEngine | null>(null);
  const clock = useRef(
    Object.assign(new SceneClock(8, 30), {
      time: savedView?.requestedTime || 0,
    }),
  );
  const current = useRef(state);
  current.current = state;
  const status = useRef({ ready, error });
  status.current = { ready, error };
  const view = useRef({
    mode: "camera" as "camera" | "source",
    sourceId: null as string | null,
    selection: [] as string[],
    inspection: defaultInspection(),
    ...savedView,
  });
  const displayed = useRef({ time: 0, revision: null as string | null });
  const generation = useRef(0),
    presentation = useRef(0),
    contextRetries = useRef(0);
  const request = useRef<LatestFrame<number> | null>(null);
  const interacted = useRef(false);
  const contextQueue = useRef<Promise<unknown>>(Promise.resolve());
  const lastPublished = useRef({ json: "", at: 0 });
  const invoke = async (cmd: Command) => {
    try {
      return await call(cmd);
    } catch (e) {
      setError(String(e));
      return undefined;
    }
  };
  function context() {
    const s = current.current;
    if (!s) throw new Error("Scene is preparing");
    return {
      sceneId: s.scene.id,
      name: new URLSearchParams(location.search).has("desktop")
        ? "Desktop"
        : "Browser",
      requestedTime: clock.current.time,
      presentedTime: displayed.current.time,
      playing: clock.current.playing,
      mode: view.current.mode,
      sourceId: view.current.sourceId,
      selection: view.current.selection,
      inspection: view.current.inspection,
      sourceRoutes: engine.current?.sourceRoutes || [],
      layers: engine.current?.describeLayers() || [],
      layerWarnings:
        engine.current?.layerFrames.flatMap((f) => f.warnings) || [],
      ready: status.current.ready && !s.error,
      error: s.error || status.current.error,
      documentRevision: s.revision,
      displayedRevision: displayed.current.revision,
      viewport: {
        width: stage.current?.clientWidth || 0,
        height: stage.current?.clientHeight || 0,
      },
      focused: document.hasFocus(),
      visible: document.visibilityState === "visible",
    };
  }
  function publish() {
    const result = contextQueue.current.then(async () => {
      if (!current.current) return;
      const interaction = interacted.current;
      interacted.current = false;
      const value = context();
      const json = JSON.stringify(value);
      if (
        !interaction &&
        json === lastPublished.current.json &&
        Date.now() - lastPublished.current.at < 1400
      )
        return;
      lastPublished.current = { json, at: Date.now() };
      sessionStorage.setItem("tilt-view", JSON.stringify(value));
      return call({ type: "context_update", context: value, interaction });
    });
    contextQueue.current = result.catch(() => {});
    return result;
  }
  async function refresh() {
    try {
      const requestedScene = current.current?.scene.id;
      const s = await call<ProjectState>({
        type: "state",
        sceneId: current.current?.scene.id || savedView?.sceneId,
      });
      if (requestedScene && current.current?.scene.id !== requestedScene)
        return;
      current.current = s;
      setState(s);
      if (s.error) setError(s.error);
    } catch (e) {
      setError(String(e));
    }
  }
  async function openScene(id?: string, name?: string) {
    presentation.current++;
    request.current?.invalidate();
    clock.current.pause();
    clock.current.ready = false;
    setPlaying(false);
    setReady(false);
    const next = await invoke(
      name ? { type: "create", name } : { type: "open", id },
    );
    if (!next) return;
    current.current = next;
    clock.current.seek(0);
    setTime(0);
    displayed.current = { time: 0, revision: null };
    view.current.selection = [];
    setSelection([]);
    setState(next);
    await publish();
  }
  function applyView() {
    const e = engine.current;
    if (e) {
      e.mode = view.current.mode;
      e.sourceId = view.current.sourceId;
      e.inspection = { ...view.current.inspection };
      e.renderView();
    }
    setMode(view.current.mode);
    setZoom(view.current.inspection.zoom);
  }
  function changeMode(next: "camera" | "source", sourceId?: string) {
    view.current.mode = next;
    if (sourceId) view.current.sourceId = sourceId;
    applyView();
    interacted.current = true;
    void publish();
  }
  function fit() {
    view.current.inspection = defaultInspection();
    applyView();
    interacted.current = true;
    void publish();
  }
  async function draw(t: number, valid: () => boolean = () => true) {
    const e = engine.current,
      s = current.current;
    if (!e || !s || !clock.current.ready) throw new Error("Scene is preparing");
    const epoch = presentation.current;
    const canPresent = () =>
      valid() &&
      epoch === presentation.current &&
      e === engine.current &&
      current.current?.codeRevision === s.codeRevision &&
      current.current?.scene.id === s.scene.id;
    await e.sample(t, s.scene, canPresent, s.revision);
    if (!canPresent()) return false;
    displayed.current = { time: t, revision: s.revision };
    setTime(t);
    return true;
  }
  function failed(e: unknown) {
    if (String(e).includes("revision changed")) {
      void refresh();
      return;
    }
    clock.current.pause();
    setPlaying(false);
    setError(String(e));
  }
  function seek(t: number) {
    presentation.current++;
    clock.current.pause();
    setPlaying(false);
    const next = clock.current.seek(t);
    setTime(next);
    request.current?.request(next);
    interacted.current = true;
    void call({ type: "activity", activity: "scrub" }).catch(() => {});
  }
  function toggle() {
    clock.current.playing ? clock.current.pause() : clock.current.play();
    setPlaying(clock.current.playing);
    interacted.current = true;
    void publish();
  }
  useEffect(() => {
    void refresh();
    const off = onChange(() => void refresh());
    let pending = false;
    const timer = setInterval(async () => {
      if (pending) return;
      pending = true;
      try {
        await publish();
        const jobs = await call<RenderJob[]>({ type: "jobs" });
        setState((s) => (s ? { ...s, jobs } : s));
      } catch (e) {
        setError(String(e));
      } finally {
        pending = false;
      }
    }, 1500);
    const interaction = () => {
      interacted.current = true;
    };
    window.addEventListener("pointerdown", interaction, true);
    window.addEventListener("keydown", interaction, true);
    window.addEventListener("focus", interaction);
    return () => {
      off();
      clearInterval(timer);
      window.removeEventListener("pointerdown", interaction, true);
      window.removeEventListener("keydown", interaction, true);
      window.removeEventListener("focus", interaction);
      engine.current?.dispose();
    };
  }, []);
  useEffect(() => {
    if (!state) return;
    void call<string[]>({ type: "list_files", sceneId: state.scene.id })
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
    void (async () => {
      try {
        const prep = await call<{
          url: string;
          scene: SceneDocument;
          revision: string;
          codeRevision: number;
        }>({ type: "prepare", sceneId: s.id });
        if (disposed || n !== generation.current) return;
        candidate = new SceneEngine(prep.scene, (t, revision) =>
          call({
            type: "frame",
            sceneId: s.id,
            time: t,
            revision,
            includeContext: true,
          }),
        );
        await candidate.init(prep.url);
        const t = Math.min(clock.current.time, s.duration);
        candidate.mode = view.current.mode;
        candidate.sourceId = view.current.sourceId;
        candidate.inspection = { ...view.current.inspection };
        await candidate.sample(
          t,
          prep.scene,
          () => !disposed && n === generation.current,
          prep.revision,
        );
        if (disposed || n !== generation.current) {
          candidate.dispose();
          return;
        }
        const old = engine.current;
        engine.current = candidate;
        stage.current!.replaceChildren(candidate.canvas);
        old?.dispose();
        displayed.current = { time: t, revision: prep.revision };
        candidate.canvas.addEventListener("webglcontextlost", (event) => {
          if (engine.current !== candidate) return;
          event.preventDefault();
          clock.current.ready = false;
          setReady(false);
          if (contextRetries.current++ < 1) setRetry((x) => x + 1);
          else setError("Graphics context lost. Retry to rebuild the scene.");
        });
        clock.current.duration = s.duration;
        clock.current.fps = s.fps;
        clock.current.seek(t);
        clock.current.ready = true;
        setReady(true);
        setTime(t);
        setError(null);
        request.current = new LatestFrame(async (t, valid) => {
          await draw(t, valid);
        }, failed);
        if (current.current?.revision !== prep.revision)
          request.current.request(t);
        void call<any[]>({ type: "inspect", sceneId: s.id })
          .then(setSubjects)
          .catch(() => {});
      } catch (e) {
        candidate?.dispose();
        if (!disposed) {
          if (String(e).includes("revision changed")) setRetry((x) => x + 1);
          else failed(e);
        }
      }
    })();
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
    if (!state.error) {
      setError(null);
      request.current?.request(clock.current.time);
    }
  }, [state?.revision]);
  useEffect(() => {
    let stop = false,
      last = performance.now(),
      frames = 0,
      measure = last,
      lastContext = last;
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
        try {
          await draw(t);
          setPlaying(clock.current.playing);
          frames++;
          if (now - measure > 1000) {
            setFps(Math.round((frames * 1000) / (now - measure)));
            frames = 0;
            measure = now;
          }
        } catch (e) {
          failed(e);
        }
      } else {
        last = now;
        measure = now;
        frames = 0;
      }
      if (now - lastContext > 250 && current.current) {
        lastContext = now;
        void publish().catch(() => {});
      }
      requestAnimationFrame(() => void tick());
    };
    void tick();
    return () => {
      stop = true;
    };
  }, []);
  useEffect(() => {
    void call({ type: "activity", activity: playing ? "play" : "idle" }).catch(
      () => {},
    );
    if (!playing) return;
    const timer = setInterval(
      () => void call({ type: "activity", activity: "play" }).catch(() => {}),
      1000,
    );
    return () => clearInterval(timer);
  }, [playing]);
  useEffect(
    () =>
      onRequest(async (c) => {
        try {
          if (c.type === "view") {
            if (c.mode !== "camera" && c.mode !== "source")
              throw new Error("View must be camera or source");
            changeMode(c.mode, c.sourceId);
          }
          if (["seek", "capture"].includes(c.type)) {
            presentation.current++;
            request.current?.invalidate();
            clock.current.pause();
            setPlaying(false);
            const t = clock.current.seek(c.time ?? clock.current.time);
            if (!(await draw(t)))
              throw new Error("View changed during capture. Retry.");
          }
          if (c.type === "play") {
            clock.current.play();
            setPlaying(true);
          }
          if (c.type === "pause") {
            clock.current.pause();
            setPlaying(false);
          }
          const result =
            c.type === "capture"
              ? {
                  data: engine.current!.canvas.toDataURL("image/png"),
                  context: context(),
                }
              : context();
          await publish();
          await call({ type: "view_ack", id: c.id, result });
        } catch (e) {
          await call({ type: "view_ack", id: c.id, error: String(e) }).catch(
            () => {},
          );
        }
      }),
    [],
  );
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    return bindNavigation(
      element,
      () => view.current,
      (next) => {
        view.current.inspection = next;
        applyView();
        interacted.current = true;
      },
    );
  }, []);
  useEffect(() => {
    const frame = stage.current?.parentElement,
      area = frame?.parentElement;
    if (!frame || !area || !state) return;
    const s = state.scene;
    const fit = () => {
      frame.style.width =
        Math.max(
          1,
          Math.min(
            area.clientWidth - 72,
            ((area.clientHeight - 38) * s.size.width) / s.size.height,
          ),
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
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        void invoke({ type: e.shiftKey ? "redo" : "undo" });
      } else if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        seek(clock.current.time - 1 / clock.current.fps);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        seek(clock.current.time + 1 / clock.current.fps);
      } else if (e.key === "Home") seek(0);
      else if (e.key.toLowerCase() === "f") fit();
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
    <div
      className={
        new URLSearchParams(location.search).has("desktop")
          ? "app desktop"
          : "app"
      }
    >
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
            disabled={!state?.history?.canUndo || !!state.history.pendingEdit}
            onClick={() => void invoke({ type: "undo" })}
          />
          <Button
            icon="undo"
            label="Redo"
            className="redo"
            disabled={!state?.history?.canRedo || !!state.history.pendingEdit}
            onClick={() => void invoke({ type: "redo" })}
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
              onClick={() => void openScene(item.id)}
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
          <span className="view-controls">
            <button
              className={mode === "source" ? "active" : ""}
              onClick={() => changeMode("source")}
            >
              2D
            </button>
            <button
              className={mode === "camera" ? "active" : ""}
              onClick={() => changeMode("camera")}
            >
              Camera
            </button>
            <span className="divider" />
            <button onClick={() => fit()} title="Reset view (F)">
              Fit
            </button>
            <span className="zoom-readout">{Math.round(zoom * 100)}%</span>
          </span>
        </div>
        <div className="canvas-area">
          <div
            className="canvas-frame"
            style={{
              aspectRatio: s ? `${s.size.width}/${s.size.height}` : "1.6",
            }}
          >
            <div
              className="scene-stage"
              ref={stage}
              title={
                mode === "camera"
                  ? "Drag to orbit · Shift-drag or right-drag to pan · Scroll to zoom"
                  : "Drag to pan · Scroll to zoom"
              }
            />
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
            {state?.history?.pendingEdit
              ? state.history.pendingEdit.label + " · editing"
              : playing
                ? `${fps} fps preview`
                : ready
                  ? "Ready"
                  : "Preparing"}
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
                  sceneId={s.id}
                  reportError={(e) => setError(String(e))}
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
                {!!source.layers?.length && (
                  <div className="source-layers">
                    <div className="section-heading plain">Layers</div>
                    {source.layers.map((layer) => {
                      const state = engine.current
                        ?.describeLayers()
                        .find(
                          (l) => l.sourceId === source.id && l.id === layer.id,
                        );
                      const key = source.id + ":" + layer.id;
                      return (
                        <button
                          key={key}
                          className={selection.includes(key) ? "selected" : ""}
                          style={{ paddingLeft: state?.parentId ? 18 : 6 }}
                          onClick={() => {
                            view.current.selection = [key];
                            view.current.sourceId = source.id;
                            setSelection([key]);
                            changeMode("camera", source.id);
                          }}
                        >
                          <span>{layer.label || layer.id}</span>
                          <code title="Local depth">
                            {(state?.position[2] || 0).toFixed(2)}
                          </code>
                        </button>
                      );
                    })}
                    {engine.current?.layerFrames
                      .find((f) => f.sourceId === source.id)
                      ?.warnings.map((w) => (
                        <p className="layer-warning" key={w}>
                          {w}
                        </p>
                      ))}
                  </div>
                )}
                <div className="subject-list">
                  {subjects
                    .find((x) => x.source === source.id)
                    ?.subjects.map((item: any) => (
                      <button
                        key={item.id}
                        className={
                          selection.includes(item.id) ? "selected" : ""
                        }
                        onClick={() => {
                          view.current.selection = [item.id];
                          view.current.sourceId = source.id;
                          setSelection([item.id]);
                          changeMode("source", source.id);
                        }}
                      >
                        <span className="subject-dot" />
                        {item.id}
                      </button>
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
              void openScene(undefined, newName || "Untitled");
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
  sceneId,
  reportError,
}: {
  name: string;
  param: SceneDocument["parameters"][string];
  sceneId: string;
  reportError: (e: unknown) => void;
}) {
  const [draft, setDraft] = useState(param.value);
  const dragging = useRef(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const group = useRef<string | null>(null);
  useEffect(() => {
    if (!dragging.current) setDraft(param.value);
  }, [param.value]);
  const enqueue = (fn: () => Promise<unknown>) => {
    queue.current = queue.current.then(fn).catch(reportError);
  };
  const change = (value: number) =>
    enqueue(() => call({ type: "set_parameter", sceneId, key: name, value }));
  const finish = () => {
    dragging.current = false;
    enqueue(async () => {
      if (group.current) {
        const id = group.current;
        await call({ type: "edit_apply", sceneId, id });
        group.current = null;
      }
    });
  };
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
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragging.current = true;
          enqueue(async () => {
            const result = await call({
              type: "edit_begin",
              sceneId,
              label: param.label,
              kind: "gesture",
              paths: ["scene.json"],
            });
            group.current = result.id;
          });
        }}
        onChange={(e) => {
          const value = +e.target.value;
          setDraft(value);
          change(value);
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
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
      call({ type: "frame", time: t, includeContext: true }),
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
