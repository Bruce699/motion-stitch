import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Group,
  Panel,
  Separator,
  type PanelImperativeHandle,
} from "react-resizable-panels";
import {
  applyPlaygroundSnap,
  findPlaygroundSnap,
  movePlaygroundTile,
  playgroundSequenceMarks,
  playgroundChain,
  playgroundSequenceDuration,
  playgroundTileWidth,
  playgroundSnapCue,
  playgroundSnapLineLength,
  playgroundPlaybackPins,
  playgroundPlaybackKey,
  reconcilePlayground,
  resetPlaygroundLayout,
  samplePlaygroundChain,
  selectPlaygroundChain,
  type PlaygroundDocument,
  type PlaygroundSnap,
} from "../core/playground";
import {
  WorkspaceUISchema,
  resetWorkspacePreviewUI,
  resetWorkspaceStageUI,
  resetWorkspaceHoverUI,
  compositionDetails,
  matchesComposition,
  type WorkspaceUI,
} from "../core/workspace-display";
import { TRACK_COLORS } from "../core/track-colors";
import { call, onChange } from "./bridge";
import {
  CompositionPreview,
  preloadCompositionHover,
  preloadCompositionPoster,
  clearHoverPreviews,
  type CompositionPreviewHandle,
} from "./composition-preview";
import { SelectControl } from "./vendor/dialkit/components/SelectControl";
import { SegmentedControl } from "./vendor/dialkit/components/SegmentedControl";
import { compositionTags } from "./workspace-navigation";
import { Icon } from "./icons";
import { usePlaygroundZoom } from "./playground-zoom";
import { playgroundPreviewNeighbors } from "../core/playground-preview";
import {
  computeHoverPreviewLayout,
  type HoverPreviewLayout,
} from "../core/hover-preview-layout";
import { CanvasHoverPreview } from "./canvas-hover-preview";
import {
  captureEditorEntry,
  type EditorEntryOrigin,
} from "./editor-entry-transition";
import "./project-workspace.css";

type Scene = {
  id: string;
  name: string;
  duration: number;
  size: { width: number; height: number };
  revision: string;
  previewRevision?: string;
};
type Snapshot = {
  workspace: PlaygroundDocument;
  revision: string;
  scenes: Scene[];
};
const colors = [
  TRACK_COLORS.teal,
  TRACK_COLORS.purple,
  TRACK_COLORS.orange,
  TRACK_COLORS.blue,
  TRACK_COLORS.pink,
  TRACK_COLORS.amber,
];
const durationLabel = (time: number) => `${Number(time.toFixed(1))}s`;
const alphaColor = (hex: string, opacity: number) =>
  `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${opacity})`;
const snapEasings = {
  linear: [0, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  soft: [0.22, 1, 0.36, 1],
} satisfies Record<string, [number, number, number, number]>;
type PresentedFrame = {
  time: number;
  selectionKey: string;
  sequenceKey: string;
  catalogKey: string;
};

export function ProjectWorkspace({
  project,
  tab,
  onTab,
  onHome,
  onOpen,
  leaving = false,
  hidden = false,
  returning = false,
  returnSceneId,
}: {
  project?: { name: string; path: string };
  tab: "playground" | "library";
  onTab: (tab: "playground" | "library") => void;
  onHome: () => void;
  onOpen: (id: string, origin?: EditorEntryOrigin) => Promise<void>;
  leaving?: boolean;
  hidden?: boolean;
  returning?: boolean;
  returnSceneId?: string;
}) {
  const leavingRef = useRef(leaving);
  leavingRef.current = leaving;
  const opening = useRef(false);
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const [draft, setDraft] = useState<PlaygroundDocument>();
  const [selection, setSelection] = useState<string[]>([]);
  const [autoplay, setAutoplay] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [filter, setFilter] = useState("all");
  const [versionFilter, setVersionFilter] = useState("all");
  const [uiPreview, setUIPreview] = useState<WorkspaceUI>();
  const uiPreviewRef = useRef<WorkspaceUI | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [columns, setColumns] = useState(() => {
    try {
      const value = Number(localStorage.getItem("tilt-library-columns") ?? 4);
      return Number.isInteger(value) && value >= 1 && value <= 8 ? value : 4;
    } catch {
      return 4;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("tilt-library-columns", String(columns));
    } catch {}
  }, [columns]);
  const [hovered, setHovered] = useState<string>();
  const [canvasHovered, setCanvasHovered] = useState<string>();
  const [settingsHoverPreview, setSettingsHoverPreview] = useState(false);
  const [hoverLayout, setHoverLayout] = useState<HoverPreviewLayout | null>(
    null,
  );
  const hoverTarget = useRef<string | undefined>(undefined);
  const lastCanvasHover = useRef<string | undefined>(undefined);
  const hoverTimer = useRef<number | undefined>(undefined);
  const hoverLeaveTimer = useRef<number | undefined>(undefined);
  const hoverApproachAt = useRef(0);
  const [snap, setSnap] = useState<PlaygroundSnap | null>(null);
  const [settling, setSettling] = useState<string[]>([]);
  const [presentedFrame, setPresentedFrame] = useState<PresentedFrame>();
  const reducedMotion = useReducedMotion();
  const [notice, setNotice] = useState("");
  const loading = useRef(false),
    dirty = useRef(false),
    mounted = useRef(true),
    initialized = useRef(false);
  const editGeneration = useRef(0);
  const drag = useRef<{
    id: string;
    pointer: number;
    clientX: number;
    clientY: number;
    scrollLeft: number;
    scrollTop: number;
    zoom: number;
    target: HTMLButtonElement;
    x: number;
    y: number;
    base: PlaygroundDocument;
    moved: boolean;
    canMove: boolean;
  } | null>(null);
  const canvasScroll = useRef<HTMLDivElement>(null);
  const canvasPanel = useRef<PanelImperativeHandle>(null);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const baseDocument = draft ?? snapshot?.workspace;
  const documentRef = useRef(baseDocument);
  documentRef.current = baseDocument;
  const scenes = snapshot?.scenes ?? [];
  const catalogKey = JSON.stringify(
    scenes.map((scene) => [
      scene.id,
      scene.duration,
      scene.previewRevision ?? scene.revision,
    ]),
  );
  const ui = useMemo(
    () => uiPreview ?? WorkspaceUISchema.parse(baseDocument?.ui ?? {}),
    [uiPreview, baseDocument?.ui],
  );
  const snapEase = snapEasings[ui.snapEase];
  useEffect(() => {
    if (!settling.length) return;
    const timer = window.setTimeout(
      () => setSettling([]),
      Math.max(ui.snapSettleDuration, ui.snapCornerDuration) + 20,
    );
    return () => window.clearTimeout(timer);
  }, [settling, ui.snapSettleDuration, ui.snapCornerDuration]);
  const document = useMemo(() => {
    if (!baseDocument || !uiPreview) return baseDocument;
    return { ...baseDocument, ui: uiPreview };
  }, [baseDocument, uiPreview]);
  const byId = useMemo(
    () => new Map(scenes.map((scene) => [scene.id, scene])),
    [scenes],
  );
  const previewScope = `${project?.path ?? ""}:${catalogKey}`;
  const previewScopeRef = useRef(previewScope);
  previewScopeRef.current = previewScope;
  const previewIdentity = (scene: Scene) =>
    `${project?.path ?? ""}:${scene.previewRevision ?? scene.revision}`;
  const hoverPreloadNeeded = useMemo(
    () => () =>
      mounted.current &&
      !leavingRef.current &&
      !window.document.hidden &&
      previewScopeRef.current === previewScope,
    [previewScope],
  );
  function primeHover(id: string) {
    if (leavingRef.current) return;
    const scene = byId.get(id);
    if (!scene) return;
    void preloadCompositionHover(
      id,
      previewIdentity(scene),
      hoverPreloadNeeded,
    ).catch(() => {});
  }
  useEffect(() => {
    let disposed = false;
    const needed = () =>
      !disposed &&
      mounted.current &&
      !leavingRef.current &&
      !window.document.hidden;
    // Prepare only visible posters while idle; cache entries share Library and
    // canvas identities, so switching views never recaptures the same image.
    const timer = window.setTimeout(async () => {
      const visibleIds = [
        ...window.document.querySelectorAll<HTMLElement>(
          ".canvas-clip, .library-card",
        ),
      ]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return (
            rect.bottom >= 0 &&
            rect.top <= innerHeight &&
            rect.right >= 0 &&
            rect.left <= innerWidth
          );
        })
        .map((element) => element.dataset.sceneId)
        .filter((id): id is string => !!id)
        .slice(0, 12);
      for (const [index, id] of visibleIds.entries()) {
        if (!needed()) break;
        const scene = byId.get(id);
        if (!scene) continue;
        try {
          await preloadCompositionPoster(id, previewIdentity(scene), needed);
          if (index === 0 && needed())
            void preloadCompositionHover(
              id,
              previewIdentity(scene),
              needed,
            ).catch(() => {});
        } catch {}
      }
    }, 250);
    const clearHidden = () => {
      if (window.document.hidden) clearHoverPreviews();
    };
    window.document.addEventListener("visibilitychange", clearHidden);
    return () => {
      disposed = true;
      clearTimeout(timer);
      clearHoverPreviews();
      window.document.removeEventListener("visibilitychange", clearHidden);
    };
  }, [previewScope]);
  function approachHover(event: React.PointerEvent<HTMLElement>) {
    if (
      leavingRef.current ||
      event.pointerType === "touch" ||
      event.buttons ||
      drag.current
    )
      return;
    const now = performance.now();
    if (now - hoverApproachAt.current < 80) return;
    hoverApproachAt.current = now;
    let closest: string | undefined;
    let distance = 120;
    for (const element of event.currentTarget.querySelectorAll<HTMLElement>(
      tab === "library" ? ".library-card" : ".canvas-clip",
    )) {
      const rect = element.getBoundingClientRect();
      const dx = Math.max(
        rect.left - event.clientX,
        0,
        event.clientX - rect.right,
      );
      const dy = Math.max(
        rect.top - event.clientY,
        0,
        event.clientY - rect.bottom,
      );
      const next = Math.hypot(dx, dy);
      if (next < distance) {
        distance = next;
        closest = element.dataset.sceneId;
      }
    }
    if (!closest) return;
    const id =
      tab === "playground" && documentRef.current
        ? playgroundChain(documentRef.current, closest)[0]
        : closest;
    if (id && id !== (tab === "playground" ? canvasHovered : hovered))
      primeHover(id);
  }
  const tags = useMemo(
    () =>
      new Map(
        scenes.map((scene) => [
          scene.id,
          compositionTags(scene.name, document?.tags?.[scene.id]),
        ]),
      ),
    [scenes, document?.tags],
  );
  const details = new Map(
    scenes.map((scene) => [
      scene.id,
      compositionDetails(scene, document?.compositions),
    ]),
  );
  const clipFillColor = (id: string) =>
    details.get(id)?.clipColor ??
    (ui.clipColorMode === "uniform"
      ? ui.clipFillColor
      : colors[
          Math.max(
            0,
            document?.tiles.findIndex((tile) => tile.sceneId === id) ?? 0,
          ) % colors.length
        ]);
  const titles = [
    ...new Set([...details.values()].map((item) => item.sceneName)),
  ];
  const versions = [
    ...new Set(
      [...details.values()]
        .filter((item) => filter === "all" || item.sceneName === filter)
        .map((item) => item.versionName)
        .filter(Boolean),
    ),
  ];
  const filterCatalogKey = JSON.stringify([titles, versions]);
  useEffect(() => {
    if (filter !== "all" && !titles.includes(filter)) setFilter("all");
    if (versionFilter !== "all" && !versions.includes(versionFilter))
      setVersionFilter("all");
  }, [filterCatalogKey, filter, versionFilter]);
  const visible = scenes.filter((scene) =>
    matchesComposition(
      details.get(scene.id)!,
      filter,
      versionFilter,
      search,
      `${scene.name} ${tags.get(scene.id)?.join(" ")}`,
    ),
  );
  const uiStyle = {
    "--switch-font-size": `${ui.switchFontSize}px`,
    "--switch-padding-x": `${ui.switchPaddingX}px`,
    "--switch-padding-y": `${ui.switchPaddingY}px`,
    "--toolbar-scale": ui.toolbarScale,
    "--toolbar-line-height": ui.toolbarLineHeight,
    "--label-font-size": `${ui.labelFontSize}px`,
    "--label-line-height": ui.labelLineHeight,
    "--version-gap": `${ui.versionGap}px`,
    "--version-opacity": ui.versionOpacity,
    "--card-padding": `${ui.cardPadding}px`,
    "--column-gap": `${ui.columnGap}px`,
    "--row-gap": `${ui.rowGap}px`,
    "--library-padding": `${ui.libraryPadding}px`,
    "--preview-column-gap": `${ui.previewColumnGap}px`,
    "--preview-row-gap": `${ui.previewRowGap}px`,
    "--preview-padding-top": `${ui.previewPaddingTop}px`,
    "--preview-padding-bottom": `${ui.previewPaddingBottom}px`,
    "--preview-padding-x": `${ui.previewPaddingX}px`,
    "--preview-transport-height": `${ui.previewTransportHeight}px`,
    "--preview-transport-gap": `${ui.previewTransportGap}px`,
    "--preview-transport-padding-x": `${ui.previewTransportPaddingX}px`,
    "--preview-transport-max-width": `${ui.previewTransportMaxWidth}px`,
    "--clip-font-size": `${ui.clipFontSize}px`,
    "--clip-height": `${ui.clipHeight}px`,
    "--clip-padding": `${ui.clipPadding}px`,
    "--clip-padding-y": `${ui.clipPaddingY}px`,
    "--clip-radius": `${ui.clipRadius}px`,
    "--snap-corner-duration": `${ui.snapCornerDuration}ms`,
    "--snap-settle-duration": `${ui.snapSettleDuration}ms`,
    "--snap-ease": `cubic-bezier(${snapEase.join(",")})`,
    "--snap-cue-width": `${ui.snapCueWidth}px`,
    "--snap-cue-gradient-angle": `${ui.snapCueGradientAngle}deg`,
    "--snap-cue-radius": `${ui.snapCueRadius}px`,
    "--play-pin-width": `${ui.playPinWidth}px`,
    "--play-pin-head-size": `${ui.playPinHeadSize}px`,
    "--play-pin-color": ui.playPinColor,
    "--clip-border-width": `${ui.clipBorderWidth}px`,
    "--clip-border-color": alphaColor(ui.clipBorderColor, ui.clipBorderOpacity),
    "--clip-text-color": ui.clipTextColor,
    "--clip-item-gap": `${ui.clipItemGap}px`,
    "--clip-identity-align": {
      left: "flex-start",
      center: "center",
      right: "flex-end",
    }[ui.clipLayoutAlign],
    "--clip-vertical-align": {
      start: "flex-start",
      center: "center",
      end: "flex-end",
    }[ui.clipVerticalAlign],
    "--clip-title-weight": ui.clipTitleWeight,
    "--clip-title-line-height": ui.clipTitleLineHeight,
    "--clip-title-letter-spacing": `${ui.clipTitleLetterSpacing}px`,
    "--clip-tag-gap": `${ui.clipTagGap}px`,
    "--clip-tag-font-size": `${ui.clipTagFontSize}px`,
    "--clip-tag-weight": ui.clipTagWeight,
    "--clip-tag-padding-x": `${ui.clipTagPaddingX}px`,
    "--clip-tag-padding-y": `${ui.clipTagPaddingY}px`,
    "--clip-tag-radius": `${ui.clipTagRadius}px`,
    "--clip-tag-fill": alphaColor(ui.clipTagFill, ui.clipTagFillOpacity),
    "--clip-tag-text-color": ui.clipTagTextColor,
    "--clip-tag-text-opacity": ui.clipTagTextOpacity,
    "--clip-tag-border-width": `${ui.clipTagBorderWidth}px`,
    "--clip-tag-border-color": alphaColor(
      ui.clipTagBorderColor,
      ui.clipTagBorderOpacity,
    ),
    "--clip-tag-letter-spacing": `${ui.clipTagLetterSpacing}px`,
    "--clip-duration-font-size": `${ui.clipDurationFontSize}px`,
    "--clip-duration-opacity": ui.clipDurationOpacity,
    "--clip-duration-weight": ui.clipDurationWeight,
  } as React.CSSProperties;
  function previewUI(key: keyof WorkspaceUI, value: number) {
    if (error) return;
    if (key.startsWith("hoverPreview")) setSettingsHoverPreview(true);
    const values = {
      ...(uiPreviewRef.current ??
        documentRef.current?.ui ??
        WorkspaceUISchema.parse({})),
      [key]: value,
    };
    const next = WorkspaceUISchema.parse(values);
    editGeneration.current++;
    uiPreviewRef.current = next;
    setUIPreview(next);
  }
  function commitUI() {
    const current = documentRef.current,
      next = uiPreviewRef.current;
    if (!current || !next || error) return;
    save({ ...current, ui: next });
    uiPreviewRef.current = undefined;
    setUIPreview(undefined);
  }
  function resetPreviewSpacing() {
    const current = documentRef.current;
    if (!current || error) return;
    save({
      ...current,
      ui: resetWorkspacePreviewUI(uiPreviewRef.current ?? current.ui),
    });
    uiPreviewRef.current = undefined;
    setUIPreview(undefined);
  }
  function resetStageSpacing() {
    const current = documentRef.current;
    if (!current || error) return;
    save({
      ...current,
      ui: resetWorkspaceStageUI(uiPreviewRef.current ?? current.ui),
    });
    uiPreviewRef.current = undefined;
    setUIPreview(undefined);
  }
  function resetHoverPreview() {
    const current = documentRef.current;
    if (!current || error) return;
    save({
      ...current,
      ui: resetWorkspaceHoverUI(uiPreviewRef.current ?? current.ui),
    });
    uiPreviewRef.current = undefined;
    setUIPreview(undefined);
    setSettingsHoverPreview(true);
  }
  function dismissCanvasHover() {
    window.clearTimeout(hoverTimer.current);
    window.clearTimeout(hoverLeaveTimer.current);
    hoverTarget.current = undefined;
    setCanvasHovered(undefined);
  }
  function beginCanvasHover(id: string, immediate = false) {
    if (leavingRef.current || drag.current || tab !== "playground") return;
    const current = documentRef.current;
    const head = current && playgroundChain(current, id)[0];
    if (!head) return;
    lastCanvasHover.current = head;
    window.clearTimeout(hoverLeaveTimer.current);
    if (hoverTarget.current === head) return;
    primeHover(head);
    window.clearTimeout(hoverTimer.current);
    hoverTarget.current = head;
    hoverTimer.current = window.setTimeout(
      () => {
        if (
          !leavingRef.current &&
          !drag.current &&
          hoverTarget.current === head
        )
          setCanvasHovered(head);
      },
      immediate ? 0 : ui.hoverPreviewDelay,
    );
  }
  function leaveCanvasHover() {
    window.clearTimeout(hoverTimer.current);
    hoverTarget.current = undefined;
    window.clearTimeout(hoverLeaveTimer.current);
    hoverLeaveTimer.current = window.setTimeout(dismissCanvasHover, 70);
  }
  useEffect(() => {
    const hide = () => {
      dismissCanvasHover();
      setSettingsHoverPreview(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    const visibilityChanged = () => {
      if (window.document.hidden) hide();
    };
    window.addEventListener("blur", hide);
    window.addEventListener("keydown", escape);
    window.document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      window.clearTimeout(hoverTimer.current);
      window.clearTimeout(hoverLeaveTimer.current);
      window.removeEventListener("blur", hide);
      window.removeEventListener("keydown", escape);
      window.document.removeEventListener(
        "visibilitychange",
        visibilityChanged,
      );
    };
  }, []);
  useEffect(() => {
    dismissCanvasHover();
    setSettingsHoverPreview(false);
  }, [tab]);
  useEffect(() => {
    if (!leaving) return;
    setHovered(undefined);
    dismissCanvasHover();
    setSettingsHoverPreview(false);
    clearHoverPreviews();
  }, [leaving]);
  const selected = document
    ? [
        ...new Set(
          selection
            .map((id) => playgroundChain(document, id)[0])
            .filter(Boolean),
        ),
      ].slice(0, 4)
    : [];
  useEffect(() => {
    if (!returning || !returnSceneId || !byId.has(returnSceneId)) return;
    setSelection([returnSceneId]);
    setAutoplay(false);
  }, [returning, returnSceneId, byId]);
  const selectedTiles = new Set(
    document ? selected.flatMap((id) => playgroundChain(document, id)) : [],
  );
  const sequenceKey = document ? playgroundPlaybackKey(document, selected) : "";
  const pins = new Map(
    document &&
      ui.playPinVisible &&
      presentedFrame?.selectionKey === selected.join(":") &&
      presentedFrame.sequenceKey === sequenceKey &&
      presentedFrame.catalogKey === catalogKey
      ? playgroundPlaybackPins(
          document,
          scenes,
          selected,
          presentedFrame.time,
        ).map((pin) => [pin.sceneId, pin.progress] as const)
      : [],
  );

  async function refresh() {
    if (
      loading.current ||
      dirty.current ||
      drag.current ||
      uiPreviewRef.current
    )
      return;
    loading.current = true;
    const generation = editGeneration.current;
    try {
      const next = await call<Snapshot>({ type: "workspace" });
      if (
        !mounted.current ||
        dirty.current ||
        drag.current ||
        generation !== editGeneration.current
      )
        return;
      snapshotRef.current = next;
      documentRef.current = next.workspace;
      setSnapshot(next);
      const firstLoad = !initialized.current;
      initialized.current = true;
      setSelection((current) =>
        firstLoad
          ? next.scenes.slice(0, 1).map((scene) => scene.id)
          : current.filter((id) =>
              next.scenes.some((scene) => scene.id === id),
            ),
      );
    } catch (e) {
      if (mounted.current) setError(String(e).replace(/^Error: /, ""));
    } finally {
      loading.current = false;
    }
  }
  useEffect(() => {
    mounted.current = true;
    void refresh();
    const off = onChange(() => void refresh());
    return () => {
      mounted.current = false;
      off();
    };
  }, []);

  function save(next: PlaygroundDocument) {
    dirty.current = true;
    editGeneration.current += 1;
    documentRef.current = next;
    setDraft(next);
    setSaving(true);
    setError(undefined);
    saveQueue.current = saveQueue.current
      .then(async () => {
        const current = snapshotRef.current;
        if (!current) return;
        const result = await call<{
          workspace: PlaygroundDocument;
          revision: string;
        }>({
          type: "workspace_save",
          workspace: next,
          revision: current.revision,
        });
        snapshotRef.current = { ...current, ...result };
        if (mounted.current) setSnapshot(snapshotRef.current);
      })
      .catch((e) => {
        if (mounted.current)
          setError(
            `${String(e).replace(/^Error: /, "")} Reload the saved canvas to continue.`,
          );
        throw e;
      });
    const queued = saveQueue.current;
    void queued.then(
      () => {
        if (saveQueue.current !== queued) return;
        dirty.current = false;
        if (!drag.current?.moved)
          documentRef.current = snapshotRef.current?.workspace;
        if (mounted.current) {
          if (!drag.current?.moved) setDraft(undefined);
          setSaving(false);
        }
        if (mounted.current) void refresh();
      },
      () => {
        if (saveQueue.current === queued && mounted.current) setSaving(false);
      },
    );
  }
  async function reloadSaved() {
    await saveQueue.current.catch(() => {});
    saveQueue.current = Promise.resolve();
    uiPreviewRef.current = undefined;
    setUIPreview(undefined);
    dirty.current = false;
    documentRef.current = snapshotRef.current?.workspace;
    setDraft(undefined);
    setError(undefined);
    await refresh();
  }
  function choose(id: string, additive: boolean) {
    if (!document) return;
    const root = playgroundChain(document, id)[0];
    if (additive && selected.length === 4 && !selected.includes(root)) {
      setNotice("You can compare up to four clips at a time.");
      return;
    }
    setNotice("");
    setSelection(selectPlaygroundChain(document, selected, id, additive));
    setAutoplay(true);
    setPlayKey((key) => key + 1);
  }
  async function open(id: string, source?: HTMLElement) {
    if (leavingRef.current || opening.current) return;
    const origin = source ? captureEditorEntry(source, tab) : undefined;
    opening.current = true;
    commitUI();
    try {
      await saveQueue.current;
      await onOpen(origin?.sceneId ?? id, origin);
    } catch (e) {
      setError(String(e).replace(/^Error: /, ""));
    } finally {
      opening.current = false;
    }
  }
  async function home() {
    commitUI();
    try {
      await saveQueue.current;
      onHome();
    } catch (e) {
      setError(String(e).replace(/^Error: /, ""));
    }
  }
  function dragPosition(
    gesture: NonNullable<typeof drag.current>,
    event: React.PointerEvent<HTMLButtonElement>,
  ) {
    return {
      x: Math.max(
        20,
        gesture.x +
          (event.clientX -
            gesture.clientX +
            (canvasScroll.current?.scrollLeft ?? 0) -
            gesture.scrollLeft) /
            gesture.zoom,
      ),
      y: Math.max(
        20,
        gesture.y +
          (event.clientY -
            gesture.clientY +
            (canvasScroll.current?.scrollTop ?? 0) -
            gesture.scrollTop) /
            gesture.zoom,
      ),
    };
  }
  function finishDrag(
    event: React.PointerEvent<HTMLButtonElement>,
    cancel = false,
  ) {
    const gesture = drag.current;
    if (!gesture || gesture.pointer !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    setSnap(null);
    if (cancel) {
      if (gesture.moved) {
        documentRef.current = gesture.base;
        setDraft(dirty.current ? gesture.base : undefined);
      }
      return;
    }
    if (!gesture.moved) {
      choose(gesture.id, event.shiftKey);
      return;
    }
    const position = dragPosition(gesture, event);
    const moved = movePlaygroundTile(
      gesture.base,
      gesture.id,
      position.x,
      position.y,
    );
    const target = findPlaygroundSnap(moved, scenes, gesture.id);
    const next = target ? applyPlaygroundSnap(moved, scenes, target) : moved;
    if (target && !reducedMotion)
      setSettling(playgroundChain(moved, gesture.id));
    save(next);
    if (target) {
      if (!selected.length) {
        setSelection([playgroundChain(next, gesture.id)[0]]);
        setAutoplay(true);
        setPlayKey((key) => key + 1);
      }
      setNotice("Clips connected.");
    }
  }
  function unlink() {
    const current = documentRef.current;
    if (!current || error) return;
    save({
      ...current,
      tiles: current.tiles.map((tile) =>
        selectedTiles.has(tile.sceneId) ? { ...tile, nextId: null } : tile,
      ),
    });
    setSelection(selected.slice(0, 1));
    setPlayKey((key) => key + 1);
    setNotice("Clips disconnected.");
  }
  const canvasWidth = Math.max(
    800,
    ...(document?.tiles.map(
      (tile) =>
        tile.x +
        playgroundTileWidth(
          byId.get(tile.sceneId)?.duration ?? 8,
          document,
          tile.sceneId,
        ) +
        80,
    ) ?? []),
  );
  const canvasHeight = Math.max(
    360,
    ...(document?.tiles.map((tile) => tile.y + 130) ?? []),
  );
  const snapCue = document ? playgroundSnapCue(document, scenes, snap) : null;
  const snapLineLength = playgroundSnapLineLength(ui, snapCue?.progress ?? 0);
  const canvasZoom = usePlaygroundZoom({
    scrollRef: canvasScroll,
    contentWidth: canvasWidth,
    contentHeight: canvasHeight,
    enabled: !!snapshot && !!document && tab === "playground",
    canZoom: () => !drag.current,
    onPinchStart: () => {
      dismissCanvasHover();
      setSettingsHoverPreview(false);
      const gesture = drag.current;
      if (!gesture) return;
      drag.current = null;
      if (gesture.target.hasPointerCapture(gesture.pointer))
        gesture.target.releasePointerCapture(gesture.pointer);
      if (gesture.moved) {
        documentRef.current = gesture.base;
        setDraft(dirty.current ? gesture.base : undefined);
      }
      setSnap(null);
    },
  });
  const floatingId =
    tab === "playground"
      ? (canvasHovered ??
        (settingsHoverPreview
          ? (lastCanvasHover.current ?? selected[0] ?? scenes[0]?.id)
          : undefined))
      : undefined;
  const floatingIds = useMemo(
    () => (document && floatingId ? playgroundChain(document, floatingId) : []),
    [document, floatingId],
  );
  const floatingKey = floatingIds.join(":");
  const floatingScenes = useMemo(
    () =>
      floatingIds.flatMap((id) => {
        const scene = byId.get(id);
        return scene
          ? [
              {
                ...scene,
                previewRevision: previewIdentity(scene),
                name: compositionDetails(scene, document?.compositions).title,
              },
            ]
          : [];
      }),
    [floatingKey, byId, document?.compositions, project?.path],
  );
  useLayoutEffect(() => {
    const scroll = canvasScroll.current;
    if (!scroll || !floatingIds.length) {
      setHoverLayout(null);
      return;
    }
    let raf = 0;
    const place = () => {
      const ids = new Set(floatingIds);
      const rects = [
        ...scroll.querySelectorAll<HTMLButtonElement>(".canvas-clip"),
      ]
        .filter((element) => ids.has(element.dataset.sceneId ?? ""))
        .map((element) => element.getBoundingClientRect());
      if (!rects.length) {
        setHoverLayout(null);
        return;
      }
      const left = Math.min(...rects.map((rect) => rect.left));
      const top = Math.min(...rects.map((rect) => rect.top));
      setHoverLayout(
        computeHoverPreviewLayout({
          anchor: {
            left,
            top,
            width: Math.max(...rects.map((rect) => rect.right)) - left,
            height: Math.max(...rects.map((rect) => rect.bottom)) - top,
          },
          viewport: { width: window.innerWidth, height: window.innerHeight },
          count: floatingScenes.length,
          frameWidth: ui.hoverPreviewWidth,
          frameHeight: ui.hoverPreviewHeight,
          gap: ui.hoverPreviewGap,
          offset: ui.hoverPreviewOffset,
          padding: ui.hoverPreviewPadding,
        }),
      );
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(place);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(scroll);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    place();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [
    floatingKey,
    document,
    canvasZoom.zoom,
    ui.hoverPreviewWidth,
    ui.hoverPreviewHeight,
    ui.hoverPreviewGap,
    ui.hoverPreviewOffset,
    ui.hoverPreviewPadding,
  ]);
  function resetCanvas() {
    const current = documentRef.current;
    if (!current || error || drag.current) return;
    const arranged = resetPlaygroundLayout(current, scenes);
    setSnap(null);
    setSettling([]);
    save(arranged.document);
    canvasZoom.fitBounds(arranged.bounds);
    setNotice("Clips disconnected, arranged by scene, and fitted in view.");
  }
  return (
    <main
      className="project-workspace"
      style={{ ...uiStyle, visibility: hidden ? "hidden" : undefined }}
      aria-hidden={hidden}
      data-editor-return={returning ? "preparing" : undefined}
      aria-label={`${project?.name ?? "Project"} workspace`}
      inert={leaving}
      aria-busy={leaving}
      onPointerMoveCapture={approachHover}
    >
      <header className="workspace-toolbar">
        <div className="workspace-identity">
          <button
            className="ui-button icon-button"
            aria-label="Home"
            title="Home"
            onClick={() => void home()}
          >
            <Icon name="home" size={18} />
          </button>
          <span className="workspace-project-name">
            {project?.name ?? "Project"}
          </span>
        </div>
        <div className="workspace-switch">
          <SegmentedControl
            label="Project view"
            options={[
              { value: "playground", label: "Playground" },
              { value: "library", label: "Library" },
            ]}
            value={tab}
            onChange={onTab}
          />
        </div>
        <div className="workspace-toolbar-end" />
      </header>
      {error && (
        <div className="workspace-error" role="alert">
          <span>{error}</span>
          <button className="ui-button" onClick={() => void reloadSaved()}>
            Reload saved canvas
          </button>
        </div>
      )}
      {!snapshot ? (
        <div className="workspace-loading">
          <span className="spinner" /> Loading compositions
        </div>
      ) : tab === "library" ? (
        <>
          <nav className="library-toolbar" aria-label="Library filters">
            <div className="library-filter-group">
              <div className="library-category workspace-dropdown">
                <SelectControl
                  label="Scene"
                  options={[
                    { value: "all", label: "All scenes" },
                    ...titles.map((title) => ({ value: title, label: title })),
                  ]}
                  value={filter}
                  onChange={(value) => {
                    setFilter(value);
                    setVersionFilter("all");
                  }}
                />
              </div>
              <div className="library-version-filter workspace-dropdown">
                <SelectControl
                  label="Version"
                  options={[
                    { value: "all", label: "All versions" },
                    ...versions.map((name) => ({ value: name, label: name })),
                  ]}
                  value={versionFilter}
                  onChange={setVersionFilter}
                />
              </div>
            </div>
            <div className="library-toolbar-actions">
              <div className="library-columns">
                <Icon name="grid" size={18 * ui.toolbarScale} />
                <div className="library-columns-slider">
                  <input
                    type="range"
                    min={1}
                    max={8}
                    step={1}
                    value={columns}
                    dir="rtl"
                    aria-label="Library columns"
                    aria-valuetext={`${columns} ${columns === 1 ? "column" : "columns"}`}
                    onChange={(event) => setColumns(Number(event.target.value))}
                  />
                  <output
                    className="library-columns-tooltip"
                    aria-hidden="true"
                  >
                    {columns} {columns === 1 ? "column" : "columns"}
                  </output>
                </div>
                <Icon name="square" size={18 * ui.toolbarScale} />
              </div>
              <div className="library-search">
                <Icon name="search" size={16 * ui.toolbarScale} />
                <input
                  type="text"
                  aria-label="Search compositions"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>
          </nav>
          <section className="library-content" aria-label="Composition library">
            <div
              className="library-grid"
              style={{ "--library-columns": columns } as React.CSSProperties}
            >
              {visible.map((scene) => (
                <LibraryCard
                  key={scene.id}
                  scene={scene}
                  details={details.get(scene.id)!}
                  revisionToken={previewIdentity(scene)}
                  active={!leaving && hovered === scene.id}
                  suspended={leaving}
                  onHover={(active) => {
                    if (leavingRef.current) return;
                    if (active) primeHover(scene.id);
                    setHovered(active ? scene.id : undefined);
                  }}
                  onOpen={(source) => void open(scene.id, source)}
                />
              ))}
            </div>
            {!visible.length && (
              <div className="workspace-empty">
                No compositions match your filters.
                <button
                  className="ui-button"
                  onClick={() => {
                    setFilter("all");
                    setVersionFilter("all");
                    setSearch("");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </>
      ) : (
        document && (
          <Group
            orientation="vertical"
            className="playground-panels"
            onLayoutChanged={(_layout, meta) => {
              const current = documentRef.current;
              if (!meta.isUserInteraction || !current || drag.current || error)
                return;
              const height = Math.min(
                2000,
                Math.max(
                  120,
                  Math.round(
                    canvasPanel.current?.getSize().inPixels ??
                      current.canvasHeight,
                  ),
                ),
              );
              if (height !== current.canvasHeight)
                save({ ...current, canvasHeight: height });
            }}
          >
            <Panel id="playground-preview" minSize={220}>
              <PreviewDeck
                workspace={document}
                scenes={scenes}
                selected={selected}
                autoplay={autoplay}
                playKey={playKey}
                columnGap={ui.previewColumnGap}
                rowGap={ui.previewRowGap}
                suspended={leaving}
                onOpen={(id, source) => void open(id, source)}
                onPresentedFrame={setPresentedFrame}
                catalogKey={catalogKey}
              />
            </Panel>
            <Separator
              className="resize-handle playground-divider"
              aria-label="Resize clip canvas"
            >
              <span />
            </Separator>
            <Panel
              id="playground-canvas"
              panelRef={canvasPanel}
              defaultSize={document.canvasHeight}
              minSize={180}
              maxSize="65%"
              groupResizeBehavior="preserve-pixel-size"
            >
              <section
                className="playground-canvas-panel"
                aria-label="Clip canvas"
              >
                <div
                  className="canvas-scroll"
                  ref={canvasScroll}
                  {...canvasZoom.touchHandlers}
                  style={{
                    ...canvasZoom.touchStyle,
                    backgroundSize: `${16 * canvasZoom.zoom}px ${16 * canvasZoom.zoom}px`,
                    backgroundPosition: `${3 * canvasZoom.zoom}px ${3 * canvasZoom.zoom}px`,
                  }}
                  onPointerDown={(event) => {
                    if (event.pointerType === "touch") return;
                    if (
                      !(event.target as HTMLElement).closest(".canvas-clip")
                    ) {
                      setSelection([]);
                      setAutoplay(false);
                    }
                  }}
                >
                  <div className="canvas-extent" style={canvasZoom.spacerStyle}>
                    <div
                      className="clip-canvas"
                      style={canvasZoom.contentStyle}
                    >
                      {document.tiles.map((tile) => {
                        const scene = byId.get(tile.sceneId);
                        if (!scene) return null;
                        const previous = document.tiles.some(
                          (other) => other.nextId === tile.sceneId,
                        );
                        const selectedClip = selectedTiles.has(tile.sceneId);
                        const snapHead = snap?.toId === tile.sceneId;
                        const snapTail = snap?.fromId === tile.sceneId;
                        return (
                          <button
                            key={tile.sceneId}
                            className={`canvas-clip${selectedClip ? " selected" : ""}${previous ? " connected-head" : ""}${tile.nextId ? " connected-tail" : ""}${snapHead ? " snap-head" : ""}${snapTail ? " snap-tail" : ""}${settling.includes(tile.sceneId) ? " settling" : ""}`}
                            data-scene-id={scene.id}
                            aria-label={`${details.get(scene.id)!.title}, ${durationLabel(scene.duration)}${previous || tile.nextId ? ", connected sequence" : ""}`}
                            aria-pressed={selectedClip}
                            style={
                              {
                                left: tile.x,
                                top: tile.y,
                                width: playgroundTileWidth(
                                  scene.duration,
                                  document,
                                  scene.id,
                                ),
                                "--clip-color": clipFillColor(scene.id),
                                "--clip-facing-radius": `${ui.clipRadius * (1 - (snapCue?.progress ?? 0) * ui.snapCornerAnticipation)}px`,
                                "--clip-tag-text-color":
                                  ui.clipTagColorMode === "clip"
                                    ? clipFillColor(scene.id)
                                    : ui.clipTagTextColor,
                              } as React.CSSProperties
                            }
                            onPointerEnter={(event) => {
                              if (
                                event.pointerType !== "touch" &&
                                event.buttons === 0
                              )
                                beginCanvasHover(scene.id);
                            }}
                            onPointerLeave={leaveCanvasHover}
                            onFocus={(event) => {
                              if (event.currentTarget.matches(":focus-visible"))
                                beginCanvasHover(scene.id, true);
                            }}
                            onBlur={leaveCanvasHover}
                            onPointerDown={(event) => {
                              if (
                                event.button !== 0 ||
                                drag.current ||
                                canvasZoom.isPinchingRef.current ||
                                error
                              )
                                return;
                              event.preventDefault();
                              commitUI();
                              event.currentTarget.focus();
                              dismissCanvasHover();
                              setSettingsHoverPreview(false);
                              const current = documentRef.current;
                              const currentTile = current?.tiles.find(
                                (item) => item.sceneId === tile.sceneId,
                              );
                              if (!current || !currentTile) return;
                              setSettling([]);
                              drag.current = {
                                id: tile.sceneId,
                                pointer: event.pointerId,
                                clientX: event.clientX,
                                clientY: event.clientY,
                                scrollLeft:
                                  canvasScroll.current?.scrollLeft ?? 0,
                                scrollTop: canvasScroll.current?.scrollTop ?? 0,
                                zoom: canvasZoom.zoomRef.current,
                                target: event.currentTarget,
                                x: currentTile.x,
                                y: currentTile.y,
                                base: current,
                                moved: false,
                                canMove: !error && !uiPreviewRef.current,
                              };
                              event.currentTarget.setPointerCapture(
                                event.pointerId,
                              );
                            }}
                            onPointerMove={(event) => {
                              const gesture = drag.current;
                              if (
                                !gesture &&
                                event.pointerType !== "touch" &&
                                event.buttons === 0
                              )
                                beginCanvasHover(scene.id);
                              if (
                                !gesture ||
                                gesture.pointer !== event.pointerId ||
                                !gesture.canMove
                              )
                                return;
                              const dx = event.clientX - gesture.clientX,
                                dy = event.clientY - gesture.clientY;
                              if (!gesture.moved && Math.hypot(dx, dy) < 5)
                                return;
                              gesture.moved = true;
                              const position = dragPosition(gesture, event);
                              const next = movePlaygroundTile(
                                gesture.base,
                                gesture.id,
                                position.x,
                                position.y,
                              );
                              documentRef.current = next;
                              setDraft(next);
                              setSnap(
                                findPlaygroundSnap(next, scenes, gesture.id),
                              );
                            }}
                            onPointerUp={(event) => finishDrag(event)}
                            onPointerCancel={(event) => finishDrag(event, true)}
                            onLostPointerCapture={(event) =>
                              finishDrag(event, true)
                            }
                            onClick={(event) => {
                              if (event.detail === 0)
                                choose(scene.id, event.shiftKey);
                            }}
                            onDoubleClick={() => void open(scene.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Escape" && drag.current) {
                                const gesture = drag.current;
                                drag.current = null;
                                if (
                                  event.currentTarget.hasPointerCapture(
                                    gesture.pointer,
                                  )
                                )
                                  event.currentTarget.releasePointerCapture(
                                    gesture.pointer,
                                  );
                                if (gesture.moved) {
                                  documentRef.current = gesture.base;
                                  setDraft(
                                    dirty.current ? gesture.base : undefined,
                                  );
                                }
                                setSnap(null);
                                return;
                              }
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                if (!event.repeat)
                                  choose(scene.id, event.shiftKey);
                                return;
                              }
                              if (event.key.startsWith("Arrow")) {
                                event.preventDefault();
                                if (error) return;
                                commitUI();
                                const current = documentRef.current;
                                const currentTile = current?.tiles.find(
                                  (item) => item.sceneId === scene.id,
                                );
                                if (!current || !currentTile) return;
                                const step = event.shiftKey ? 40 : 10;
                                const next = movePlaygroundTile(
                                  current,
                                  scene.id,
                                  Math.max(
                                    20,
                                    currentTile.x +
                                      (event.key === "ArrowRight"
                                        ? step
                                        : event.key === "ArrowLeft"
                                          ? -step
                                          : 0),
                                  ),
                                  Math.max(
                                    20,
                                    currentTile.y +
                                      (event.key === "ArrowDown"
                                        ? step
                                        : event.key === "ArrowUp"
                                          ? -step
                                          : 0),
                                  ),
                                );
                                const target = findPlaygroundSnap(
                                  next,
                                  scenes,
                                  scene.id,
                                );
                                save(
                                  target
                                    ? applyPlaygroundSnap(next, scenes, target)
                                    : next,
                                );
                              }
                            }}
                            onKeyUp={(event) => {
                              if (event.key === " ") event.preventDefault();
                            }}
                          >
                            <span className="clip-identity">
                              <span className="clip-label">
                                {details.get(scene.id)!.title}
                              </span>
                            </span>
                            <span className="clip-duration">
                              {durationLabel(scene.duration)}
                            </span>
                            {pins.has(scene.id) && (
                              <span
                                className="clip-play-pin"
                                aria-hidden="true"
                                style={{
                                  left: `${pins.get(scene.id)! * 100}%`,
                                }}
                              />
                            )}
                          </button>
                        );
                      })}
                      <AnimatePresence>
                        {snap && snapCue && ui.snapCueVisible && (
                          <motion.span
                            key={`${snap.fromId}:${snap.toId}`}
                            className="canvas-snap-cue"
                            aria-hidden="true"
                            style={
                              {
                                left: snapCue.x,
                                top: snapCue.y + ui.clipHeight / 2,
                                "--snap-from-color":
                                  ui.snapCueColorMode === "clips"
                                    ? clipFillColor(snap.fromId)
                                    : ui.snapCueFromColor,
                                "--snap-to-color":
                                  ui.snapCueColorMode === "clips"
                                    ? clipFillColor(snap.toId)
                                    : ui.snapCueToColor,
                              } as React.CSSProperties
                            }
                            initial={{
                              opacity: reducedMotion ? ui.snapCueOpacity : 0,
                            }}
                            animate={{ opacity: ui.snapCueOpacity }}
                            exit={{
                              opacity: 0,
                              transition: {
                                duration: reducedMotion
                                  ? 0
                                  : ui.snapCueFadeOut / 1000,
                                ease: snapEase,
                              },
                            }}
                            transition={{
                              duration: reducedMotion
                                ? 0
                                : ui.snapCueFadeIn / 1000,
                              ease: snapEase,
                            }}
                          >
                            <motion.span
                              className="canvas-snap-cue-line"
                              data-snap-progress={snapCue.progress}
                              data-target-length={snapLineLength}
                              initial={false}
                              animate={{ height: snapLineLength }}
                              transition={{
                                duration: reducedMotion
                                  ? 0
                                  : ui.snapCueGrowDuration / 1000,
                                ease: snapEase,
                              }}
                            />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
                <div className="canvas-actions">
                  <button
                    className="ui-button icon-button canvas-reset"
                    aria-label="Reset canvas layout"
                    title="Disconnect clips, arrange by scene, and fit in view"
                    disabled={!!error}
                    onClick={resetCanvas}
                  >
                    <Icon name="undo" />
                  </button>
                  <div
                    className="canvas-zoom"
                    role="group"
                    aria-label="Canvas zoom"
                  >
                    <button
                      className="ui-button icon-button"
                      aria-label="Zoom out canvas"
                      title="Zoom out"
                      disabled={canvasZoom.zoom <= canvasZoom.minimumZoom}
                      onClick={canvasZoom.zoomOut}
                    >
                      <Icon name="minus" />
                    </button>
                    <button
                      className="ui-button icon-button"
                      aria-label="Zoom in canvas"
                      title="Zoom in"
                      disabled={canvasZoom.zoom >= 2}
                      onClick={canvasZoom.zoomIn}
                    >
                      <Icon name="plus" />
                    </button>
                  </div>
                  {selectedTiles.size > selected.length && (
                    <button
                      className="ui-button icon-button"
                      aria-label="Disconnect selected clips"
                      title="Disconnect selected clips"
                      disabled={!!error}
                      onClick={unlink}
                    >
                      <Icon name="unlink" />
                    </button>
                  )}
                </div>
                <span className="workspace-sr-only" role="status">
                  {notice}
                </span>
              </section>
            </Panel>
          </Group>
        )
      )}
      {createPortal(
        <AnimatePresence>
          {!leaving && floatingScenes.length > 0 && hoverLayout && (
            <CanvasHoverPreview
              key={floatingKey}
              scenes={floatingScenes}
              layout={hoverLayout}
              ui={ui}
            />
          )}
        </AnimatePresence>,
        window.document.body,
      )}
    </main>
  );
}

function PreviewDeck({
  workspace,
  scenes,
  selected,
  autoplay,
  playKey,
  columnGap,
  rowGap,
  onOpen,
  onPresentedFrame,
  catalogKey,
  suspended = false,
}: {
  workspace: PlaygroundDocument;
  scenes: Scene[];
  selected: string[];
  autoplay: boolean;
  playKey: number;
  columnGap: number;
  rowGap: number;
  onOpen: (id: string, source: HTMLElement) => void;
  onPresentedFrame: (frame: PresentedFrame) => void;
  catalogKey: string;
  suspended?: boolean;
}) {
  const suspendedRef = useRef(suspended);
  suspendedRef.current = suspended;
  const handles = useRef(new Map<string, CompositionPreviewHandle>());
  const warmQueue = useRef<Promise<void>>(Promise.resolve());
  const grid = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState<number>();
  const aspect = Math.max(
    1,
    ...selected.map((id) => {
      const scene = scenes.find((scene) => scene.id === id);
      return scene ? scene.size.width / scene.size.height : 16 / 9;
    }),
  );
  useEffect(() => {
    const element = grid.current;
    if (!element) return;
    const fit = () => {
      const rows = selected.length > 2 ? 2 : 1;
      const columns = selected.length > 1 ? 2 : 1;
      const styles = getComputedStyle(element);
      const paddingY =
        parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      const paddingX =
        parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      const effectiveRowGap = parseFloat(styles.rowGap);
      const effectiveColumnGap = parseFloat(styles.columnGap);
      const height = Math.max(
        0,
        (element.getBoundingClientRect().height -
          paddingY -
          (rows - 1) * effectiveRowGap) /
          rows,
      );
      setGridWidth(
        height * aspect * columns +
          (columns - 1) * effectiveColumnGap +
          paddingX,
      );
    };
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    fit();
    return () => observer.disconnect();
  }, [selected.length, aspect, columnGap, rowGap]);
  const [speed, setSpeed] = useState("1");
  const speedRef = useRef(1);
  const [playing, setPlaying] = useState(autoplay);
  const [time, setTime] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const playback = useRef({ time: 0, playing: autoplay, restart: 0 });
  const duration = Math.max(
    0,
    ...selected.map((id) => playgroundSequenceDuration(workspace, scenes, id)),
  );
  const selectionKey = selected.join(":");
  const sequenceKey = playgroundPlaybackKey(workspace, selected);
  const playbackIdentity = `${selectionKey}:${sequenceKey}:${playKey}`;
  const previousPlaybackIdentity = useRef<string | undefined>(undefined);
  useEffect(() => {
    let disposed = false,
      raf = 0;
    let warmPlan = "";
    let warmGeneration = 0;
    const warmNeighbors = (at: number) => {
      const plans = selected.map((id) => ({
        id,
        targets: playgroundPreviewNeighbors(workspace, scenes, id, at),
      }));
      const key = JSON.stringify(plans);
      if (key === warmPlan) return;
      warmPlan = key;
      const generation = ++warmGeneration;
      // First warm each comparison's next clip, then its previous clip. Keep
      // speculative source capture serial so it cannot saturate the runtime.
      warmQueue.current = warmQueue.current
        .catch(() => {})
        .then(async () => {
          for (let index = 0; index < 2; index++) {
            for (const plan of plans) {
              if (
                disposed ||
                suspendedRef.current ||
                generation !== warmGeneration
              )
                return;
              const target = plan.targets[index];
              if (!target) continue;
              try {
                await handles.current
                  .get(plan.id)
                  ?.warm(target.sceneId, target.time);
              } catch {
                // The foreground request retries and reports any real error.
              }
            }
          }
        });
    };
    if (
      !suspendedRef.current ||
      previousPlaybackIdentity.current !== playbackIdentity
    ) {
      playback.current.time = 0;
      playback.current.playing = autoplay;
      setPlaying(autoplay);
      setTime(0);
    }
    previousPlaybackIdentity.current = playbackIdentity;
    setError(undefined);
    let last = performance.now(),
      rendered = -1,
      renderedRequest = -1;
    let wasSuspended = false;
    async function tick() {
      if (disposed) return;
      if (suspendedRef.current) {
        if (!wasSuspended) {
          wasSuspended = true;
          warmGeneration++;
          warmPlan = "";
          setBusy(false);
        }
        last = performance.now();
        raf = requestAnimationFrame(() => void tick());
        return;
      }
      if (wasSuspended) {
        wasSuspended = false;
        last = performance.now();
        rendered = -1;
      }
      const current = playback.current;
      if (rendered !== current.time || renderedRequest !== current.restart) {
        const at = current.time;
        const request = current.restart;
        const isCurrent = () =>
          !disposed &&
          !suspendedRef.current &&
          playback.current.restart === request;
        setBusy(true);
        try {
          await Promise.all(
            selected.map(async (id) => {
              const sample = samplePlaygroundChain(workspace, scenes, id, at);
              const handle = handles.current.get(id);
              if (sample && handle)
                await handle.sample(
                  sample.sceneId,
                  sample.sourceTime,
                  isCurrent,
                );
            }),
          );
          if (disposed) return;
          if (!isCurrent()) {
            last = performance.now();
            raf = requestAnimationFrame(() => void tick());
            return;
          }
          rendered = at;
          renderedRequest = request;
          setTime(at);
          onPresentedFrame({ time: at, selectionKey, sequenceKey, catalogKey });
          setBusy(false);
          warmNeighbors(at);
        } catch (e) {
          if (disposed) return;
          if (!isCurrent()) {
            last = performance.now();
            raf = requestAnimationFrame(() => void tick());
            return;
          }
          rendered = at;
          renderedRequest = request;
          current.playing = false;
          setPlaying(false);
          setBusy(false);
          setError(String(e).replace(/^Error: /, ""));
        }
      }
      const now = performance.now();
      if (current.playing && duration > 0 && rendered >= 0) {
        current.time =
          (current.time +
            Math.min((now - last) / 1000, 0.1) * speedRef.current) %
          duration;
      }
      last = now;
      raf = requestAnimationFrame(() => void tick());
    }
    void tick();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
    };
  }, [selectionKey, sequenceKey, playKey, catalogKey]);
  const toggle = () => {
    playback.current.playing = !playback.current.playing;
    setPlaying(playback.current.playing);
  };
  return (
    <section
      className="playground-preview"
      aria-label="Playground previews"
      onKeyDown={(event) => {
        if (event.key === " " && event.target === event.currentTarget) {
          event.preventDefault();
          toggle();
        }
      }}
      tabIndex={0}
    >
      <div
        ref={grid}
        className={`preview-grid count-${selected.length}`}
        style={{ maxWidth: selected.length ? gridWidth : undefined }}
      >
        {selected.map((id) => {
          const sample = samplePlaygroundChain(workspace, scenes, id, time);
          const scene = scenes.find(
            (scene) => scene.id === (sample?.sceneId ?? id),
          );
          return (
            <div className="preview-cell" key={id}>
              <div className="preview-picture" data-preview-root={id}>
                <CompositionPreview
                  ref={(handle) => {
                    if (handle) handles.current.set(id, handle);
                    else handles.current.delete(id);
                  }}
                  sceneId={id}
                  active
                  suspended={suspended}
                  revision={catalogKey}
                />
                <button
                  className="preview-edit ui-button"
                  onClick={(event) => {
                    const source =
                      event.currentTarget.closest<HTMLElement>(
                        ".preview-picture",
                      );
                    if (source) onOpen(scene?.id ?? id, source);
                  }}
                  title="Open composition in editor"
                >
                  Open editor
                  <Icon name="next" size={12} />
                </button>
              </div>
            </div>
          );
        })}
        {!selected.length && (
          <div className="preview-empty">
            <Icon name="play" size={24} />
            <span>Select a clip to preview</span>
            <span>Shift-click to compare up to four</span>
          </div>
        )}
      </div>
      <div className="preview-transport">
        <button
          className="ui-button icon-button preview-play"
          aria-label={playing ? "Pause previews" : "Play previews"}
          disabled={!selected.length}
          onClick={toggle}
        >
          <Icon name={playing ? "pause" : "play"} variant="solid" />
        </button>
        <div className="preview-speed workspace-dropdown">
          <SelectControl
            label="Playback speed"
            value={speed}
            options={[0.25, 0.5, 1, 1.5, 2].map((value) => ({
              value: String(value),
              label: `${value}×`,
            }))}
            onChange={(value) => {
              speedRef.current = Number(value);
              setSpeed(value);
            }}
          />
        </div>
        <span className="preview-time">{durationLabel(time)}</span>
        <div className="preview-seek">
          {selected
            .flatMap((id) => playgroundSequenceMarks(workspace, scenes, id))
            .map((mark, index) => (
              <button
                key={`${mark.sceneId}:${mark.time}:${index}`}
                className="preview-bookmark"
                style={{
                  left: `${duration ? (mark.time / duration) * 100 : 0}%`,
                }}
                aria-label={`Go to mark ${scenes.find((scene) => scene.id === mark.sceneId)?.name ?? mark.sceneId} at ${mark.sourceTime.toFixed(2)} seconds`}
                title={`${scenes.find((scene) => scene.id === mark.sceneId)?.name}: ${mark.sourceTime.toFixed(2)}s`}
                onClick={() => {
                  playback.current.time = mark.time;
                  playback.current.restart++;
                  playback.current.playing = false;
                  setTime(mark.time);
                  setPlaying(false);
                }}
              />
            ))}
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.01}
            value={time}
            aria-label="Preview playhead"
            disabled={!selected.length}
            onChange={(event) => {
              playback.current.time = Number(event.target.value);
              playback.current.restart++;
              setTime(Number(event.target.value));
            }}
          />
        </div>
        <span className="preview-time preview-total">
          {durationLabel(duration)}
        </span>
        <span
          className="preview-busy"
          aria-label={busy ? "Preparing preview" : undefined}
        >
          {busy && !time && <span className="spinner" />}
        </span>
      </div>
      {error && (
        <div className="preview-error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}

function LibraryCard({
  scene,
  details,
  active,
  suspended,
  revisionToken,
  onHover,
  onOpen,
}: {
  scene: Scene;
  details: { title: string };
  revisionToken: string;
  active: boolean;
  suspended: boolean;
  onHover: (active: boolean) => void;
  onOpen: (source: HTMLElement) => void;
}) {
  const preview = useRef<CompositionPreviewHandle>(null);
  useEffect(() => {
    if (!active || suspended) return;
    let disposed = false,
      raf = 0,
      at = 0,
      last = performance.now();
    async function tick() {
      if (disposed) return;
      try {
        await preview.current?.sample(scene.id, at);
      } catch {
        return;
      }
      if (disposed) return;
      const now = performance.now();
      at = (at + Math.min((now - last) / 1000, 0.1)) % scene.duration;
      last = now;
      raf = requestAnimationFrame(() => void tick());
    }
    void tick();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
    };
  }, [active, suspended, scene.id, revisionToken]);
  return (
    <button
      className={`library-card${active ? " previewing" : ""}`}
      data-scene-id={scene.id}
      aria-label={`Open ${details.title}`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      onDoubleClick={(event) =>
        onOpen(
          event.currentTarget.querySelector<HTMLElement>(
            ".library-thumbnail",
          ) ?? event.currentTarget,
        )
      }
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onOpen(
            event.currentTarget.querySelector<HTMLElement>(
              ".library-thumbnail",
            ) ?? event.currentTarget,
          );
        }
      }}
    >
      <div className="library-thumbnail">
        <CompositionPreview
          ref={preview}
          sceneId={scene.id}
          active={active}
          suspended={suspended}
          quality="hover"
          fit="cover"
          lazy
          revision={revisionToken}
        />
        <div className="library-card-meta">
          <span className="library-card-name">{details.title}</span>
          <span className="library-duration">
            {durationLabel(scene.duration)}
          </span>
        </div>
      </div>
    </button>
  );
}
