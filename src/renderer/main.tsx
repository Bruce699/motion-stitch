import {
  cameraDocument,
  compositionCameras,
  type CompositionGraph,
} from "../core/compositions";
import {
  ProjectBrowser,
  CameraPicker,
  ClipInspector,
} from "./composition-controls";
import { DEFAULT_FRAME_RATE } from "../core/schema";
import { bindTransportKeyboard } from "./transport-keyboard";
import { defaultCamera, type CameraSettings } from "../core/camera";
import type { SourceQuality } from "../core/quality";
import { Icon, type IconName } from "./icons";
import { flushControlEdits, queueControlEdit } from "./control-edits";
import { createRenderActivity } from "./activity";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type {
  ProjectState,
  SceneDocument,
  RenderJob,
  Command,
} from "../core/schema";
import { SceneClock, LatestFrame } from "../core/motion";
import { SceneEngine } from "./engine";
import { CameraGestureDraft, type LensField } from "./camera-gesture";
import "./vendor/dialkit/theme.css";
import "./theme.css";
import { MotionConfig } from "motion/react";
import { LiveTimeline, LiveTimecode } from "./live-timeline";
import { createPlayheadStore } from "./playhead-store";
import { SegmentedControl } from "./vendor/dialkit/components/SegmentedControl";
import "./style.css";

import {
  call,
  onChange,
  onRequest,
  savedView,
  registerPageExit,
} from "./bridge";
import { defaultInspection, type TimelineContext } from "../core/context";
import { bindNavigation } from "./navigation";
import { cameraNavigation, cameraNavigationPatch } from "./camera-navigation";
import { CameraGizmo } from "./camera-gizmo";
import { usePanelRef } from "react-resizable-panels";
import { ProjectHome } from "./project-home";
import { EditorPanels, toggleEditorPanel } from "./editor-panels";
import { ParameterPanel } from "./parameters";
import { SceneHeader } from "./scene-header";
import { ErrorIndicator } from "./error-indicator";

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
  expanded,
  controls,
}: {
  label: string;
  icon: IconName;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  expanded?: boolean;
  controls?: string;
}) {
  return (
    <button
      className={`ui-button icon-button ${className}`}
      data-variant="ghost"
      data-size="icon"
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={controls}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

function App() {
  const [home, setHome] = useState(location.hash === "#home");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const leftPanel = usePanelRef(),
    rightPanel = usePanelRef(),
    timelinePanel = usePanelRef();
  useEffect(() => {
    const navigate = () => setHome(location.hash === "#home");
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  useEffect(() => {
    if (home) {
      clock.current.pause();
      setPlaying(false);
      activity.current?.playbackChanged();
      void flushControlEdits().catch((e) => setError(String(e)));
    }
  }, [home]);
  const [sourceQuality, setSourceQuality] = useState<SourceQuality[]>([]);
  const densityTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [state, setState] = useState<ProjectState>();
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const playhead = useRef(createPlayheadStore(0)).current;
  const setTime = playhead.set;
  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [showJobs, setShowJobs] = useState(false);
  const [jobsPosition, setJobsPosition] = useState({ top: 48, right: 16 });
  useEffect(() => {
    if (!showJobs) return;
    const closeOutside = (event: PointerEvent) => {
      if (
        !(event.target as Element).closest(
          "#render-jobs,[aria-controls='render-jobs']",
        )
      )
        setShowJobs(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowJobs(false);
      }
    };
    window.addEventListener("pointerdown", closeOutside);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("keydown", escape);
    };
  }, [showJobs]);
  const [mode, setMode] = useState<"source" | "camera">(
    savedView?.mode || "camera",
  );
  const [inspection, setInspection] = useState(
    savedView?.inspection || defaultInspection(),
  );
  const [previewCameraId, setPreviewCameraId] = useState<string | undefined>(
    savedView?.cameraId,
  );
  const [compositionPath, setCompositionPath] = useState<string[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | undefined>(
    savedView?.selection?.[0],
  );
  const selectTrack = (id?: string) => {
    setSelectedTrackId(id);
    view.current.selection = id ? [id] : [];
    interacted.current = true;
    void publish();
  };
  const [retry, setRetry] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const engine = useRef<SceneEngine | null>(null);
  const clock = useRef(
    Object.assign(new SceneClock(8, DEFAULT_FRAME_RATE), {
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
  function selectedCameraId(doc = current.current?.scene) {
    const wanted = view.current.cameraId ?? doc?.defaultCameraId ?? "main";
    return doc && compositionCameras(doc).some((camera) => camera.id === wanted)
      ? wanted
      : (doc?.defaultCameraId ?? "main");
  }
  function viewing(doc: SceneDocument) {
    return cameraDocument(doc, selectedCameraId(doc));
  }
  function withSelectedCamera(doc: SceneDocument, camera: CameraSettings) {
    const id = selectedCameraId(doc);
    return id === "main"
      ? { ...doc, camera }
      : {
          ...doc,
          cameras: doc.cameras?.map((entry) =>
            entry.id === id ? { ...entry, settings: camera } : entry,
          ),
        };
  }
  async function chooseCamera(id: string) {
    await flushControlEdits();
    cameraDraft.current = null;
    lensDraft.clear();
    view.current.cameraId = id;
    setPreviewCameraId(id);
    if (engine.current) engine.current.cameraId = id;
    request.current?.request(clock.current.time);
    interacted.current = true;
  }
  async function openComposition(id: string, nested = false) {
    await flushControlEdits();
    if (nested && current.current)
      setCompositionPath((path) => [...path, current.current!.scene.id]);
    else setCompositionPath([]);
    await invoke({ type: "open", id });
  }
  const displayed = useRef({
    time: 0,
    revision: null as string | null,
    dependencyRevision: "",
  });
  const generation = useRef(0),
    presentation = useRef(0),
    contextRetries = useRef(0);
  const request = useRef<LatestFrame<number> | null>(null);
  const lensDraft = useRef(new CameraGestureDraft()).current;
  const settledLenses = useRef(new Set<number>()).current;
  const refreshSequence = useRef({ requested: 0, applied: 0 });
  useEffect(() => registerPageExit(() => lensDraft.exitPatches()), []);
  const interacted = useRef(false);
  const activity = useRef<ReturnType<typeof createRenderActivity> | null>(null);
  const contextQueue = useRef<Promise<unknown>>(Promise.resolve());
  const lastPublished = useRef({ json: "", at: 0 });
  const timelineContext = useCallback((value: TimelineContext) => {
    view.current.timeline = value;
  }, []);
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
      duration: s.scene.duration,
      fps: s.scene.fps,
      timeline: view.current.timeline,
      selectedClips: (s.scene.clips ?? []).filter((clip) =>
        view.current.selection.includes(clip.id),
      ),
      selectedTracks: s.scene.tracks
        .filter((t) => view.current.selection.includes(t.id))
        .map((t) => ({
          id: t.id,
          label: t.label,
          kind: t.kind,
          start: t.start,
          end: t.end,
          parentId: t.parentId,
          parameterKeys: t.parameterKeys,
          targets: t.targets ?? [],
        })),
      mode: view.current.mode,
      sourceId: view.current.sourceId,
      selection: view.current.selection,
      inspection:
        view.current.mode === "camera"
          ? defaultInspection()
          : view.current.inspection,
      camera:
        lensDraft.apply(viewing(s.scene), selectedCameraId(s.scene)).camera ??
        defaultCamera(),
      cameraId: selectedCameraId(s.scene),
      sourceQuality: engine.current?.quality || [],
      renderMetrics: engine.current?.metrics,
      sourceStatus: engine.current?.sourceStatus ?? [],
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
      dependencyRevision: s.dependencyRevision,
      displayedDependencyRevision: displayed.current.dependencyRevision,
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
  async function refresh(strict = false) {
    const sequence = ++refreshSequence.current.requested;
    const settling = [...settledLenses];
    try {
      const requestedScene = current.current?.scene.id;
      const s = await call<ProjectState>({
        type: "state",
        sceneId: current.current?.scene.id || savedView?.sceneId,
      });
      if (requestedScene && current.current?.scene.id !== requestedScene)
        return;
      if (sequence < refreshSequence.current.applied) return;
      refreshSequence.current.applied = sequence;
      if (cameraDraft.current && current.current?.scene.id === s.scene.id)
        s.scene = withSelectedCamera(s.scene, { ...cameraDraft.current });
      for (const ticket of settling) {
        lensDraft.settle(ticket);
        settledLenses.delete(ticket);
      }
      current.current = s;
      setState(s);
      if (settling.length && !clock.current.playing)
        request.current?.request(clock.current.time);
      if (s.error) setError(s.error);
    } catch (e) {
      setError(String(e));
      if (strict) throw e;
    }
  }
  const cameraDraft = useRef<CameraSettings | null>(null);
  function previewLens(field: LensField, value: number) {
    const s = current.current;
    if (!s) return -1;
    const ticket = lensDraft.change(
      s.scene.id,
      field,
      value,
      selectedCameraId(s.scene),
    );
    displayed.current.revision = null;
    // The same bounded scheduler and clock serve lens gestures and timeline seeks.
    if (!clock.current.playing) request.current?.request(clock.current.time);
    interacted.current = true;
    return ticket;
  }
  async function settleLens(ticket: number) {
    // Read the saved result before removing the matching overlay. A newer gesture
    // on this field (or another lens field) keeps its own preview while this saves.
    settledLenses.add(ticket);
    await refresh(true);
  }
  function editCameraNavigation(next: ReturnType<typeof defaultInspection>) {
    const state = current.current;
    if (!state || state.history?.pendingEdit?.kind === "agent") return;
    const camera = {
      ...(cameraDraft.current ??
        viewing(state.scene).camera ??
        defaultCamera()),
      ...cameraNavigationPatch(
        next,
        cameraDraft.current ?? viewing(state.scene).camera,
      ),
    };
    cameraDraft.current = camera;
    state.scene = withSelectedCamera(state.scene, camera);
    setState({ ...state });
    if (engine.current) {
      engine.current.document = lensDraft.apply(
        { ...engine.current.document, camera },
        selectedCameraId(),
      );
      engine.current.inspection = defaultInspection();
      engine.current.renderView();
    }
    interacted.current = true;
  }
  function finishCameraNavigation() {
    const draft = cameraDraft.current;
    const sceneId = current.current?.scene.id;
    if (!draft || !sceneId) return;
    const cameraId = selectedCameraId();
    const { rotation, elevation, roll, zoom, panX, panY } = draft;
    void queueControlEdit(async () => {
      await call({
        type: "set_camera",
        sceneId,
        cameraId,
        patch: { rotation, elevation, roll, zoom, panX, panY },
      });
      if (cameraDraft.current === draft) cameraDraft.current = null;
      await refresh();
    }).catch((error) => {
      cameraDraft.current = null;
      setError(String(error));
      void refresh();
    });
  }
  function applyView() {
    const e = engine.current;
    if (e) {
      e.mode = view.current.mode;
      e.sourceId = view.current.sourceId;
      e.inspection =
        view.current.mode === "camera"
          ? defaultInspection()
          : { ...view.current.inspection };
      e.renderView();
    }
    setMode(view.current.mode);
    setInspection({ ...view.current.inspection });
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
    request.current?.request(clock.current.time);
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
      current.current?.dependencyRevision === s.dependencyRevision &&
      current.current?.scene.id === s.scene.id;
    const base = viewing(s.scene);
    const document = lensDraft.apply(base, selectedCameraId(s.scene));
    e.cameraId = selectedCameraId(s.scene);
    if (document !== base && !clock.current.playing)
      await e.sampleCamera(t, document, canPresent, s.revision);
    else await e.sample(t, document, canPresent, s.revision);
    if (!canPresent()) return false;
    // An unsaved gesture must never masquerade as an acknowledged file revision.
    displayed.current = {
      time: t,
      revision: document === base ? s.revision : null,
      dependencyRevision: s.dependencyRevision ?? "",
    };
    setSourceQuality(e.quality);
    setTime(clock.current.time);
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
    clock.current.pause();
    setPlaying(false);
    const next = clock.current.seek(t);
    setTime(next);
    request.current?.request(next);
    interacted.current = true;
    activity.current?.scrub();
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
    setPreparing(true);
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
          compositions?: CompositionGraph;
          sourcePreviews?: Record<string,string>;
        }>({ type: "prepare", sceneId: s.id });
        if (disposed || n !== generation.current) return;
        candidate = new SceneEngine(
          viewing(prep.scene),
          (t, revision, captureZoom, knownImages, overrides) =>
            call({
              type: "frame",
              sceneId: s.id,
              time: t,
              revision,
              captureZoom,
              knownImages,
              overrides,
              includeContext: true,
            }),
        );
        candidate.cameraId = selectedCameraId(prep.scene);
        await candidate.init(
          prep.url,
          prep.compositions,
          (sceneId, time, revision, captureZoom, knownImages, overrides) =>
            call({
              type: "frame",
              sceneId,
              time,
              revision,
              captureZoom,
              knownImages,
              overrides,
              includeContext: true,
            }),
        );
        const t = Math.min(clock.current.time, s.duration);
        candidate.mode = view.current.mode;
        candidate.sourceId = view.current.sourceId;
        candidate.inspection =
          view.current.mode === "camera"
            ? defaultInspection()
            : { ...view.current.inspection };
        if (stage.current)
          candidate.setPreviewViewport(
            stage.current.clientWidth,
            stage.current.clientHeight,
            window.devicePixelRatio,
          );
        await candidate.sample(
          t,
          viewing(prep.scene),
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
        candidate.mountSourcePreviews(stage.current!, prep.sourcePreviews);
        old?.dispose();
        displayed.current = {
          time: t,
          revision: prep.revision,
          dependencyRevision: state.dependencyRevision ?? "",
        };
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
        request.current = new LatestFrame(
          async (t, valid) => {
            await draw(t, valid);
          },
          failed,
          true,
        );
        if (current.current?.revision !== prep.revision || lensDraft.has(s.id))
          request.current.request(t);
      } catch (e) {
        candidate?.dispose();
        if (!disposed) {
          if (String(e).includes("revision changed")) setRetry((x) => x + 1);
          else failed(e);
        }
      } finally {
        if (!disposed) setPreparing(false);
      }
    })();
    return () => {
      disposed = true;
    };
  }, [
    state?.scene.id,
    state?.codeRevision,
    state?.dependencyRevision,
    JSON.stringify(
      (state?.scene.clips ?? []).map((clip) => [clip.id, clip.compositionId]),
    ),
    JSON.stringify(state?.scene.sources),
    state?.scene.entry,
    state?.scene.sources.some(source => source.entry && !source.entry.replace(/^\.\//, "").includes("/")) ? state.revision : undefined,
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
    const reporter = createRenderActivity(
      (activity) => call({ type: "activity", activity }),
      {
        hidden: () => document.hidden,
        playing: () => clock.current.playing,
        onVisibilityChange(listener) {
          document.addEventListener("visibilitychange", listener);
          return () =>
            document.removeEventListener("visibilitychange", listener);
        },
      },
    );
    activity.current = reporter;
    return () => {
      activity.current = null;
      reporter.dispose();
    };
  }, []);
  useEffect(() => {
    activity.current?.playbackChanged();
  }, [playing]);
  useEffect(
    () =>
      onRequest(async (c) => {
        try {
          if (c.type === "open") {
            await flushControlEdits();
            lensDraft.clear();
            clock.current.pause();
            clock.current.seek(0);
            setPlaying(false);
            view.current.cameraId = undefined;
            setPreviewCameraId(undefined);
            view.current.mode = "camera";
            setMode("camera");
            view.current.selection = [];
            view.current.timeline = undefined;
            setSelectedTrackId(undefined);
            const next = await call<ProjectState>({
              type: "state",
              sceneId: c.sceneId,
            });
            current.current = next;
            setState(next);
          }
          if (c.type === "select_track") selectTrack(c.trackId ?? undefined);
          if (c.type === "wait_for_frame" || c.type === "open") {
            const deadline = performance.now() + (c.timeoutMs ?? 15000);
            while (true) {
              const currentState = current.current;
              if (currentState?.error) throw new Error(currentState.error);
              if (c.revision && currentState?.revision !== c.revision) {
                await refresh();
                if (current.current?.revision !== c.revision)
                  throw new Error("Expected revision is no longer current");
              }
              if (
                clock.current.ready &&
                displayed.current.revision === current.current?.revision &&
                (!c.sceneId || current.current?.scene.id === c.sceneId)
              )
                break;
              if (performance.now() >= deadline)
                throw new Error(
                  "Viewer did not present the expected revision in time",
                );
              await new Promise((resolve) => setTimeout(resolve, 25));
            }
          }
          if (c.type === "view") {
            if (c.mode !== "camera" && c.mode !== "source")
              throw new Error("View must be camera or source");
            if (c.cameraId) await chooseCamera(c.cameraId);
            changeMode(c.mode, c.sourceId);
            if (c.cameraId) await draw(clock.current.time);
          }
          if (["seek", "capture"].includes(c.type)) {
            if (c.type === "capture") await flushControlEdits();
            if (
              c.type === "capture" &&
              current.current &&
              lensDraft.has(current.current.scene.id)
            )
              throw new Error(
                "Finish the camera gesture before capturing its saved frame.",
              );
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
                  data: await engine.current!.captureFrame(clock.current.time, viewing(current.current!.scene), current.current!.revision),
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
        projection:
          current.current && viewing(current.current.scene).camera?.projection,
        inspection:
          view.current.mode === "camera"
            ? cameraNavigation(
                cameraDraft.current ??
                  (current.current && viewing(current.current.scene).camera),
              )
            : view.current.inspection,
      }),
      (next) => {
        if (view.current.mode === "camera") {
          editCameraNavigation(next);
          return;
        }
        view.current.inspection = next;
        applyView();
        interacted.current = true;
      },
      finishCameraNavigation,
    );
  }, []);
  useEffect(() => {
    const frame = stage.current?.parentElement,
      area = frame?.parentElement;
    if (!frame || !area || !state) return;
    const s = state.scene;
    let scheduled = 0;
    let previousWidth = -1,
      previousHeight = -1,
      previousDpr = -1;
    let previousEngine: typeof engine.current = null;
    const fit = () => {
      scheduled = 0;
      const padding = getComputedStyle(area);
      const horizontal =
        parseFloat(padding.paddingLeft) + parseFloat(padding.paddingRight);
      const vertical =
        parseFloat(padding.paddingTop) + parseFloat(padding.paddingBottom);
      const width = Math.max(
        1,
        Math.min(
          area.clientWidth - horizontal,
          ((area.clientHeight - vertical) * s.size.width) / s.size.height,
        ),
      );
      const height = (width * s.size.height) / s.size.width;
      const dpr = window.devicePixelRatio;
      const e = engine.current;
      if (
        width === previousWidth &&
        height === previousHeight &&
        dpr === previousDpr &&
        e === previousEngine
      )
        return;
      previousWidth = width;
      previousHeight = height;
      previousDpr = dpr;
      previousEngine = e;
      // Read layout before writing; avoid measuring the stage immediately
      // after changing its parent's width, which would force another layout.
      frame.style.width = width + "px";
      if (e) {
        // CSS can scale the already-presented image. Only redraw when its
        // backing buffer changed; scene time and inspection have not changed.
        if (e.setPreviewViewport(width, height, dpr)) e.renderView();
      }
    };
    const scheduleFit = () => {
      if (!scheduled) scheduled = requestAnimationFrame(fit);
    };
    const observer = new ResizeObserver(scheduleFit);
    observer.observe(area);
    window.addEventListener("resize", scheduleFit);
    fit();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", scheduleFit);
      cancelAnimationFrame(scheduled);
    };
  }, [state?.scene.size.width, state?.scene.size.height]);
  useEffect(() => {
    if (home) return;
    const key = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
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
        (e.key === "1" || e.key === "2") &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey &&
        !target.isContentEditable &&
        !target.closest(
          "input,textarea,select,[role='dialog'],[role='combobox']",
        )
      ) {
        e.preventDefault();
        changeMode(e.key === "1" ? "source" : "camera");
        return;
      }
      if (
        target.isContentEditable ||
        target.closest(
          "input,textarea,select,button,[role='dialog'],[role='slider'],[role='separator'],[role='radiogroup'],.dialkit-pad",
        )
      )
        return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        seek(clock.current.time - 1 / clock.current.fps);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        seek(clock.current.time + 1 / clock.current.fps);
      } else if (e.key === "Home") seek(0);
      else if (e.key.toLowerCase() === "f") fit();
    };
    const unbindTransport = bindTransportKeyboard(window, toggle);
    window.addEventListener("keydown", key);
    return () => {
      unbindTransport();
      window.removeEventListener("keydown", key);
    };
  }, [home]);
  async function render() {
    setExporting(true);
    try {
      await flushControlEdits();
      if (current.current && lensDraft.has(current.current.scene.id))
        throw new Error(
          "Finish the camera gesture before rendering its saved frames.",
        );
      await invoke({ type: "export", requestId: crypto.randomUUID() });
      await refresh();
    } catch (error) {
      setError(String(error));
    } finally {
      setExporting(false);
    }
  }
  const s = state?.scene;
  const viewedCamera = s && viewing(s).camera;
  const selectedClip = s?.clips?.find((clip) => clip.id === selectedTrackId);
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
      <div
        className="editor-shell"
        inert={home}
        aria-hidden={home}
        style={{ visibility: home ? "hidden" : undefined }}
      >
        <EditorPanels
          left={{ ref: leftPanel, open: leftOpen, onOpen: setLeftOpen }}
          right={{ ref: rightPanel, open: rightOpen, onOpen: setRightOpen }}
          bottom={{
            ref: timelinePanel,
            open: timelineOpen,
            onOpen: setTimelineOpen,
          }}
          project={
            state && (
              <ProjectBrowser
                state={state}
                onOpen={(id) => void openComposition(id)}
                onAdd={(compositionId) =>
                  void invoke({
                    type: "add_clip",
                    sceneId: s!.id,
                    compositionId,
                    start: clock.current.time,
                  })
                }
                reportError={(e) => setError(String(e))}
              />
            )
          }
          header={
            <>
              {" "}
              {compositionPath.length > 0 && (
                <nav
                  className="composition-breadcrumb"
                  aria-label="Containing compositions"
                >
                  {compositionPath.map((id, index) => (
                    <button
                      key={id + index}
                      className="ui-button"
                      onClick={() => {
                        setCompositionPath(compositionPath.slice(0, index));
                        void invoke({ type: "open", id });
                      }}
                    >
                      {state?.scenes.find((scene) => scene.id === id)?.name ??
                        id}
                      <Icon name="chevron" />
                    </button>
                  ))}
                </nav>
              )}
              <header className="titlebar">
                <div className="header-view-controls">
                  <Button
                    icon="home"
                    label="Home"
                    onClick={() => {
                      location.hash = "home";
                    }}
                  />
                  <Button
                    icon="sidebarLeft"
                    label={leftOpen ? "Hide compositions" : "Show compositions"}
                    expanded={leftOpen}
                    controls="compositions"
                    onClick={() =>
                      toggleEditorPanel(leftPanel.current, "compositions")
                    }
                  />
                </div>

                {s && (
                  <SceneHeader
                    scene={s}
                    sourceQuality={sourceQuality}
                    disabled={!!state?.history?.pendingEdit}
                    onSetting={(key, value) =>
                      queueControlEdit(() =>
                        invoke({
                          type: "set_setting",
                          sceneId: s.id,
                          key,
                          value,
                        }),
                      )
                    }
                  />
                )}
                <div className="header-actions">
                  <Button
                    icon="sidebarRight"
                    label={rightOpen ? "Hide inspector" : "Show inspector"}
                    expanded={rightOpen}
                    controls="inspector"
                    onClick={() =>
                      toggleEditorPanel(rightPanel.current, "inspector")
                    }
                  />
                  <Button
                    icon="undo"
                    label="Undo"
                    disabled={
                      !state?.history?.canUndo || !!state.history.pendingEdit
                    }
                    onClick={() => void invoke({ type: "undo" })}
                  />
                  <Button
                    icon="redo"
                    label="Redo"
                    disabled={
                      !state?.history?.canRedo || !!state.history.pendingEdit
                    }
                    onClick={() => void invoke({ type: "redo" })}
                  />
                  <ErrorIndicator
                    error={error}
                    onOpen={() => setShowJobs(false)}
                    onRetry={() => {
                      setError(null);
                      void refresh(true)
                        .then(() => setRetry((x) => x + 1))
                        .catch(() => {});
                    }}
                    onDismiss={() => setError(null)}
                  />
                  {(exporting || activeJobs.length > 0) && (
                    <button
                      className="ui-button icon-button"
                      data-variant="ghost"
                      data-size="icon"
                      aria-label="Render progress"
                      title="Render progress"
                      aria-expanded={showJobs}
                      aria-controls="render-jobs"
                      onClick={(event) => {
                        const bounds =
                          event.currentTarget.getBoundingClientRect();
                        setJobsPosition({
                          top: bounds.bottom + 8,
                          right: window.innerWidth - bounds.right,
                        });
                        setShowJobs((open) => !open);
                      }}
                    >
                      <span className="spinner" />
                    </button>
                  )}
                  <button
                    className="ui-button render-button"
                    data-size="composer"
                    onClick={() => void render()}
                    disabled={!ready || exporting}
                  >
                    <Icon name="share" size={16} />
                    {exporting ? "Preparing…" : "Render"}
                  </button>
                </div>
              </header>
            </>
          }
          workspace={
            <>
              {" "}
              <main className="workspace">
                <div className="canvas-area">
                  <div
                    className="canvas-frame"
                    style={{
                      aspectRatio: s
                        ? `${s.size.width}/${s.size.height}`
                        : "1.6",
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
                    {preparing && (
                      <div className="preparing">
                        <span className="spinner" />
                        Preparing composition
                      </div>
                    )}
                  </div>
                </div>
                <div className="viewer-mode-toggle" title="2D (1) · Camera (2)">
                  <SegmentedControl
                    label="Canvas view"
                    value={mode}
                    options={
                      s?.sources.length === 0
                        ? [{ value: "camera", label: "Camera" }]
                        : [
                            { value: "source", label: "2D" },
                            { value: "camera", label: "Camera" },
                          ]
                    }
                    onChange={(next) => changeMode(next)}
                  />
                </div>
              </main>
            </>
          }
          timeline={
            <>
              {" "}
              <section
                className="timeline"
                onDragOver={(event) => {
                  if (
                    event.dataTransfer.types.includes(
                      "application/x-tilt-composition",
                    )
                  )
                    event.preventDefault();
                }}
                onDrop={(event) => {
                  const compositionId = event.dataTransfer.getData(
                    "application/x-tilt-composition",
                  );
                  if (compositionId && s) {
                    event.preventDefault();
                    void invoke({
                      type: "add_clip",
                      sceneId: s.id,
                      compositionId,
                      start: clock.current.time,
                    });
                  }
                }}
              >
                <LiveTimeline
                  collapsed={!timelineOpen}
                  actions={
                    <>
                      <span
                        className="timecode timeline-duration"
                        aria-label="Duration"
                        title="Duration"
                      >
                        {timecode(
                          s?.duration || 8,
                          s?.fps || DEFAULT_FRAME_RATE,
                        )}
                      </span>
                      <Button
                        icon={timelineOpen ? "chevron" : "expand"}
                        label={
                          timelineOpen ? "Collapse timeline" : "Expand timeline"
                        }
                        expanded={timelineOpen}
                        controls="timeline"
                        onClick={() =>
                          toggleEditorPanel(timelinePanel.current, "timeline")
                        }
                      />
                    </>
                  }
                  transport={
                    <div className="transport-left">
                      {timelineOpen && (
                        <Button
                          icon="back"
                          label="Go to start"
                          onClick={() => seek(0)}
                        />
                      )}
                      <Button
                        icon={playing ? "pause" : "play"}
                        label={playing ? "Pause" : "Play"}
                        onClick={toggle}
                      />
                      {timelineOpen && (
                        <Button
                          icon="next"
                          label="Step forward"
                          onClick={() =>
                            seek(clock.current.time + 1 / clock.current.fps)
                          }
                        />
                      )}
                      <span className="timecode" title="Minutes:seconds:frames">
                        <LiveTimecode
                          playhead={playhead}
                          fps={s?.fps || DEFAULT_FRAME_RATE}
                          format={timecode}
                        />
                      </span>
                    </div>
                  }
                  key={s?.id}
                  duration={s?.duration || 8}
                  playhead={playhead}
                  fps={s?.fps || DEFAULT_FRAME_RATE}
                  tracks={[
                    ...(s?.tracks || []),
                    ...(s?.clips ?? []).map((clip) => ({
                      ...clip,
                      kind: "clip" as const,
                      keys: [],
                    })),
                  ]}
                  selectedId={selectedTrackId}
                  onSelect={selectTrack}
                  initialContext={
                    savedView?.sceneId === s?.id
                      ? savedView?.timeline
                      : undefined
                  }
                  onContextChange={timelineContext}
                  onTrackChange={async (track, timing) => {
                    try {
                      await flushControlEdits();
                      await call({
                        type: track.kind === "clip" ? "trim_clip" : "set_track",
                        sceneId: s?.id,
                        id: track.id,
                        base: { start: track.start, end: track.end },
                        timing,
                      });
                      await refresh();
                    } catch (error) {
                      setError(String(error));
                    }
                  }}
                  onSeek={seek}
                  onScrubEnd={() => activity.current?.endScrub()}
                />
              </section>
            </>
          }
          inspector={
            <>
              {" "}
              {s && (
                <div className="composition-inspector">
                  {selectedClip &&
                    state?.compositions?.[selectedClip.compositionId] && (
                      <ClipInspector
                        key={selectedClip.id}
                        clip={selectedClip}
                        parent={s}
                        source={state.compositions[selectedClip.compositionId]}
                        playhead={playhead}
                        onDeselect={() => selectTrack()}
                        onOpen={() =>
                          void openComposition(selectedClip.compositionId, true)
                        }
                        reportError={(e) => setError(String(e))}
                      />
                    )}
                  {!selectedClip && mode === "camera" && (
                    <CameraPicker
                      document={s}
                      selectedId={selectedCameraId(s)}
                      onSelect={(id) => void chooseCamera(id)}
                      reportError={(e) => setError(String(e))}
                    />
                  )}
                  {!selectedClip && (
                    <ParameterPanel
                      key={s.id + ":" + selectedCameraId(s)}
                      cameraId={selectedCameraId(s)}
                      exposedParameters={s.exposedParameters}
                      mode={mode}
                      parameters={s.parameters}
                      tracks={s.tracks}
                      selectedId={selectedTrackId}
                      duration={s.duration}
                      fps={s.fps}
                      onDeselect={() => selectTrack()}
                      camera={viewedCamera}
                      lensPreview={{ change: previewLens, settled: settleLens }}
                      cameraGizmo={
                        mode === "camera" ? (
                          <CameraGizmo
                            inspection={cameraNavigation(viewedCamera)}
                            step={
                              viewedCamera?.projection === "orthographic"
                                ? 5
                                : 1
                            }
                            disabled={!ready}
                            onChange={editCameraNavigation}
                            onInteractionEnd={finishCameraNavigation}
                          />
                        ) : null
                      }
                      sources={s.sources}
                      sceneId={s.id}
                      reportError={(e) => setError(String(e))}
                      disabled={state?.history?.pendingEdit?.kind === "agent"}
                    />
                  )}
                </div>
              )}
            </>
          }
        />
      </div>
      {home && (
        <ProjectHome
          current={state?.project}
          onReturn={() => {
            location.hash = "";
            requestAnimationFrame(() =>
              document
                .querySelector<HTMLButtonElement>('button[aria-label="Home"]')
                ?.focus(),
            );
          }}
        />
      )}
      {showJobs && (
        <div
          className="ui-popover jobs-panel"
          id="render-jobs"
          style={{
            top: jobsPosition.top,
            right: jobsPosition.right,
            bottom: "auto",
          }}
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
    const prep = await call<{
      scene: SceneDocument;
      url: string;
      compositions?: CompositionGraph;
    }>({
      type: "prepare",
    });
    const e = new SceneEngine(
      cameraDocument(prep.scene),
      (t, _revision, _zoom, knownImages, overrides) =>
        call({
          type: "frame",
          time: t,
          includeContext: true,
          knownImages,
          overrides,
        }),
    );
    e.cameraId = prep.scene.defaultCameraId ?? "main";
    await e.init(
      prep.url,
      prep.compositions,
      (sceneId, time, revision, captureZoom, knownImages, overrides) =>
        call({
          type: "frame",
          sceneId,
          time,
          revision,
          captureZoom,
          knownImages,
          overrides,
          includeContext: true,
        }),
    );
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
