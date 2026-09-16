import { defaultCamera } from "../core/camera";
import type { SourceQuality } from "../core/quality";
import { Icon, type IconName } from "./icons";
import { flushControlEdits, queueControlEdit } from "./control-edits";
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
import "./vendor/dialkit/theme.css";
import { MotionConfig } from "motion/react";
import { Timeline } from "./vendor/dialkit/Timeline";
import { SegmentedControl } from "./vendor/dialkit/components/SegmentedControl";
import "./style.css";

import { call, onChange, onRequest, savedView } from "./bridge";
import { defaultInspection } from "../core/context";
import { bindNavigation } from "./navigation";
import { ParameterPanel } from "./parameters";
import { SceneHeader } from "./scene-header";

// Embedding hosts can select the matching shell theme without touching scene files.
document.body.dataset.theme = document.documentElement.dataset.theme =
  new URLSearchParams(location.search).get("theme") === "light"
    ? "light"
    : "dark";
const timecode = (t: number, fps: number) =>
  `${Math.floor(t / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(t % 60)
    .toString()
    .padStart(2, "0")}:${Math.floor((t % 1) * fps + 0.001)
    .toString()
    .padStart(2, "0")}`;
function Button({
  label,
  icon,
  onClick,
  disabled = false,
  className = "",
}: {
  label: string;
  icon: IconName;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      className={`ui-button icon-button ${className}`}
      data-variant="ghost"
      data-size="icon"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

function App() {
  const [sourceQuality, setSourceQuality] = useState<SourceQuality[]>([]);
  const densityTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [state, setState] = useState<ProjectState>();
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [showJobs, setShowJobs] = useState(false);
  const [mode, setMode] = useState<"source" | "camera">(
    savedView?.mode || "camera",
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
      if (cmd.type === "undo" || cmd.type === "redo") await flushControlEdits();
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
      camera: s.scene.camera ?? defaultCamera(),
      sourceQuality: engine.current?.quality || [],
      outputSize: s.scene.size,
      previewSize: {
        width: engine.current?.canvas.width || 0,
        height: engine.current?.canvas.height || 0,
      },
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
    clearTimeout(densityTimer.current);
    if (
      !clock.current.playing &&
      clock.current.ready &&
      (current.current?.scene.capture?.density ?? "auto") === "auto"
    )
      densityTimer.current = setTimeout(
        () => request.current?.request(clock.current.time),
        180,
      );
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
    setSourceQuality(e.quality);
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
      clearTimeout(densityTimer.current);
      window.removeEventListener("pointerdown", interaction, true);
      window.removeEventListener("keydown", interaction, true);
      window.removeEventListener("focus", interaction);
      engine.current?.dispose();
    };
  }, []);
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
        candidate = new SceneEngine(prep.scene, (t, revision, captureZoom) =>
          call({
            type: "frame",
            sceneId: s.id,
            time: t,
            revision,
            captureZoom,
            includeContext: true,
          }),
        );
        await candidate.init(prep.url);
        const t = Math.min(clock.current.time, s.duration);
        candidate.mode = view.current.mode;
        candidate.sourceId = view.current.sourceId;
        candidate.inspection = { ...view.current.inspection };
        if (stage.current)
          candidate.setPreviewViewport(
            stage.current.clientWidth,
            stage.current.clientHeight,
            window.devicePixelRatio,
          );
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
        setSourceQuality(candidate.quality);
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
    state?.scene.size.width,
    state?.scene.size.height,
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
      () => ({
        ...view.current,
        projection: current.current?.scene.camera?.projection,
      }),
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
      const padding = getComputedStyle(area);
      const horizontal =
        parseFloat(padding.paddingLeft) + parseFloat(padding.paddingRight);
      const vertical =
        parseFloat(padding.paddingTop) + parseFloat(padding.paddingBottom);
      frame.style.width =
        Math.max(
          1,
          Math.min(
            area.clientWidth - horizontal,
            ((area.clientHeight - vertical) * s.size.width) / s.size.height,
          ),
        ) + "px";
      const e = engine.current;
      if (e && stage.current) {
        e.setPreviewViewport(
          stage.current.clientWidth,
          stage.current.clientHeight,
          window.devicePixelRatio,
        );
        e.renderView();
      }
    };
    const observer = new ResizeObserver(fit);
    observer.observe(area);
    fit();
    return () => observer.disconnect();
  }, [state?.scene.size.width, state?.scene.size.height]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        // Text drafts keep native undo; other controls use the scene journal.
        if (
          target.isContentEditable ||
          target.matches(
            "textarea,input:not([type='range']):not([type='checkbox']):not([type='color'])",
          )
        )
          return;
        e.preventDefault();
        void invoke({ type: e.shiftKey ? "redo" : "undo" });
        return;
      }
      if (
        target.closest(
          "input,textarea,select,button,[role='dialog'],[role='slider'],[role='radiogroup'],.dialkit-pad",
        )
      )
        return;
      if (e.code === "Space" && !e.repeat) {
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
        {s && (
          <SceneHeader
            scene={s}
            sourceQuality={sourceQuality}
            disabled={!!state?.history?.pendingEdit}
            onSetting={(key, value) =>
              queueControlEdit(() =>
                invoke({ type: "set_setting", sceneId: s.id, key, value }),
              )
            }
          />
        )}
        <div className="header-actions">
          <Button
            icon="undo"
            label="Undo"
            disabled={!state?.history?.canUndo || !!state.history.pendingEdit}
            onClick={() => void invoke({ type: "undo" })}
          />
          <Button
            icon="redo"
            label="Redo"
            disabled={!state?.history?.canRedo || !!state.history.pendingEdit}
            onClick={() => void invoke({ type: "redo" })}
          />
          <button
            className="ui-button render-button"
            data-size="composer"
            onClick={() => void render()}
            disabled={!ready || exporting}
          >
            {exporting ? "Preparing…" : "Render"}
          </button>
        </div>
      </header>
      <main className="workspace">
        <div className="canvas-toolbar">
          <span className="view-controls">
            <div aria-label="Canvas view">
              <SegmentedControl
                label="Canvas view"
                value={mode}
                options={[
                  { value: "source", label: "2D" },
                  { value: "camera", label: "Camera" },
                ]}
                onChange={(next) => changeMode(next)}
              />
            </div>
            <span className="divider" />
            <button
              className="ui-button"
              data-variant="ghost"
              data-size="toolbar"
              onClick={() => fit()}
              title="Reset view (F)"
            >
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
                mode === "camera" && s?.camera?.projection !== "orthographic"
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
            {state?.history?.pendingEdit
              ? state.history.pendingEdit.label + " · editing"
              : playing
                ? `${fps} fps preview`
                : ""}
          </span>
        </div>
      </main>
      {s && (
        <ParameterPanel
          parameters={s.parameters}
          camera={s.camera}
          sources={s.sources}
          sceneId={s.id}
          reportError={(e) => setError(String(e))}
          disabled={state?.history?.pendingEdit?.kind === "agent"}
        />
      )}
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
              className="ui-button jobs-toggle"
              data-variant="ghost"
              data-size="toolbar"
              aria-expanded={showJobs}
              aria-controls="render-jobs"
              onClick={() => setShowJobs((x) => !x)}
            >
              Renders
              {activeJobs.length > 0 && (
                <span className="job-count">{activeJobs.length}</span>
              )}
            </button>
          </div>
        </div>
        <Timeline
          duration={s?.duration || 8}
          time={time}
          fps={s?.fps || 30}
          tracks={s?.tracks || []}
          onSeek={seek}
          onScrubEnd={() => void call({ type: "activity", activity: "idle" })}
        />
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
        <div
          className="ui-popover jobs-panel"
          id="render-jobs"
          aria-label="Renders"
        >
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
    </div>
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
} else
  createRoot(document.getElementById("root")!).render(
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>,
  );
