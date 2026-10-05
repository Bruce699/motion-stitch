import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { cameraDocument, type CompositionGraph } from "../core/compositions";
import type { SceneDocument } from "../core/schema";
import { call } from "./bridge";
import { SceneEngine, type CompositionFrameSource } from "./engine";
import { PreviewCache } from "./preview-cache";
import { PreviewPool } from "./preview-pool";
import { WarmPreviewCache } from "./preview-warm-cache";
import { createThumbnailStore } from "./thumbnail-store";

export type CompositionPreviewHandle = {
  /** The containing workspace owns playback and awaits its selected preview batch. */
  sample(
    sceneId: string,
    time: number,
    isCurrent?: () => boolean,
  ): Promise<void>;
  /** Prepare an adjacent clip without replacing or advancing the visible frame. */
  warm(sceneId: string, time?: number): Promise<void>;
  /** A still for a clip handoff; never used as a per-frame capture path. */
  snapshot(): string | undefined;
};

type Props = {
  sceneId: string;
  active: boolean;
  /** Retain presented pixels while releasing renderers and deferring posters. */
  suspended?: boolean;
  revision?: string;
  /** A poster/renderer key for each scene, separate from a whole-sequence revision. */
  posterRevision?: string;
  hoverRevisions?: Readonly<Record<string, string>>;
  className?: string;
  fit?: "contain" | "cover";
  lazy?: boolean;
  quality?: "playback" | "hover";
  onReady?: () => void;
  onError?: (message: string) => void;
};

type Preview = {
  engine: SceneEngine;
  sceneId: string;
  revision: string;
  document: SceneDocument;
  sampledTime?: number;
  sampledViewport?: string;
  warmKey?: string;
  warmEpoch?: number;
};

const previewFrameSource =
  (thumbnail: boolean): CompositionFrameSource =>
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
      previewProfile: thumbnail ? "thumbnail" : "playback",
    });

async function preparePreview(
  sceneId: string,
  thumbnail = false,
  valid: () => boolean = () => true,
): Promise<Preview | undefined> {
  const prepared = await call<{
    scene: SceneDocument;
    url: string;
    revision: string;
    compositions: CompositionGraph;
  }>({
    type: "prepare",
    sceneId,
    previewProfile: thumbnail ? "thumbnail" : "playback",
  });
  if (!valid()) return;
  const document = cameraDocument(prepared.scene);
  const frameSource = previewFrameSource(thumbnail);
  const engine = new SceneEngine(
    document,
    (time, revision, zoom, known, overrides) =>
      frameSource(sceneId, time, revision, zoom, known, overrides),
    undefined,
    {
      maxSize: thumbnail
        ? { width: 480, height: 300 }
        : { width: 1280, height: 800 },
      maxSurfaceSize: thumbnail
        ? { width: 768, height: 768 }
        : { width: 1024, height: 1024 },
    },
  );
  engine.cameraId = document.defaultCameraId ?? "main";
  try {
    await engine.init(prepared.url, prepared.compositions, frameSource);
    return { engine, sceneId, revision: prepared.revision, document };
  } catch (error) {
    engine.dispose();
    throw error;
  }
}

// A library can contain many cards; only one temporary thumbnail compositor exists.
// Cached images retain no WebGL resources or second playback clock.
const thumbnails = new PreviewCache<{ sceneId: string; revision: string }>(
  async ({ sceneId, revision }, needed) => {
    const epoch = warmEpoch;
    const preview = await preparePreview(sceneId, true, needed);
    if (!preview) return;
    preview.warmKey = posterKey(sceneId, revision);
    preview.warmEpoch = epoch;
    let captured = false;
    try {
      if (!needed()) return;
      const time = Math.min(1.5, preview.document.duration / 4);
      await preview.engine.sample(
        time,
        preview.document,
        needed,
        preview.revision,
      );
      if (needed()) {
        const image = preview.engine.canvas.toDataURL("image/jpeg", 0.86);
        captured = true;
        return image;
      }
    } finally {
      if (captured && needed() && epoch === warmEpoch)
        warmPreviews.put(preview.warmKey, preview);
      else preview.engine.dispose();
    }
  },
  64,
  createThumbnailStore(),
);

const posterKey = (id: string, revision: string) =>
  `poster-v1:${id}:${revision}`;
const warmPreviews = new WarmPreviewCache<Preview>(
  (preview) => preview.engine.dispose(),
  2,
);
let warmEpoch = 0;
const hoverOwners = new Map<string, number>();
function releaseHoverOwner(key: string) {
  const owners = (hoverOwners.get(key) ?? 1) - 1;
  if (owners > 0) hoverOwners.set(key, owners);
  else hoverOwners.delete(key);
}

/** Preload pixels before a floating window mounts, without retaining a renderer. */
export async function preloadCompositionPoster(
  sceneId: string,
  revision: string,
  needed: () => boolean,
) {
  const key = posterKey(sceneId, revision);
  if (hoverOwners.has(key)) return;
  await thumbnails.request(key, { sceneId, revision }, needed);
}

/** Only two speculative hover engines are retained; taking one transfers ownership. */
export async function preloadCompositionHover(
  sceneId: string,
  revision: string,
  needed: () => boolean,
) {
  const key = posterKey(sceneId, revision);
  if (hoverOwners.has(key)) return;
  const epoch = warmEpoch;
  await warmPreviews.warm(
    key,
    async (valid) => {
      const preview = await preparePreview(sceneId, true, valid);
      if (!preview) return;
      preview.warmKey = key;
      preview.warmEpoch = epoch;
      try {
        preview.engine.setPreviewViewport(160, 90, 1);
        await preview.engine.sample(
          0,
          preview.document,
          valid,
          preview.revision,
        );
        if (valid()) {
          preview.sampledTime = 0;
          preview.sampledViewport = "160:90:1";
          if (!thumbnails.peek(key)) {
            try {
              thumbnails.seed(
                key,
                preview.engine.canvas.toDataURL("image/jpeg", 0.8),
              );
            } catch {}
          }
        }
        return preview;
      } catch (error) {
        preview.engine.dispose();
        throw error;
      }
    },
    needed,
  );
}

export function clearHoverPreviews() {
  warmEpoch++;
  warmPreviews.clear();
}

export const CompositionPreview = forwardRef<CompositionPreviewHandle, Props>(
  function CompositionPreview(
    {
      sceneId,
      active,
      suspended = false,
      revision = "",
      posterRevision = revision,
      hoverRevisions,
      className = "",
      fit = "contain",
      lazy = false,
      quality = "playback",
      onReady,
      onError,
    },
    ref,
  ) {
    const stage = useRef<HTMLDivElement>(null);
    const suspendedRef = useRef(suspended);
    suspendedRef.current = suspended;
    const preview = useRef<Preview | null>(null);
    const pool = useRef<PreviewPool<Preview> | null>(null);
    const qualityRef = useRef(quality);
    qualityRef.current = quality;
    const identityRef = useRef({ posterRevision, hoverRevisions });
    identityRef.current = { posterRevision, hoverRevisions };
    if (!pool.current)
      pool.current = new PreviewPool(
        async (id, valid) => {
          if (qualityRef.current !== "hover")
            return preparePreview(id, false, valid);
          const identity = identityRef.current;
          const epoch = warmEpoch;
          const key = posterKey(
            id,
            identity.hoverRevisions?.[id] ?? identity.posterRevision,
          );
          hoverOwners.set(key, (hoverOwners.get(key) ?? 0) + 1);
          let owned = false;
          try {
            const reused = await warmPreviews.take(key, valid);
            if (!valid()) {
              if (reused) {
                if (epoch === warmEpoch) warmPreviews.put(key, reused);
                else reused.engine.dispose();
              }
              return;
            }
            const value = reused ?? (await preparePreview(id, true, valid));
            if (value) {
              value.warmKey = key;
              value.warmEpoch = epoch;
              owned = true;
            }
            return value;
          } finally {
            if (!owned) releaseHoverOwner(key);
          }
        },
        (value) => {
          if (value.warmKey) releaseHoverOwner(value.warmKey);
          if (
            value.warmKey &&
            value.warmEpoch === warmEpoch &&
            !suspendedRef.current &&
            !document.hidden
          )
            warmPreviews.put(value.warmKey, value);
          else value.engine.dispose();
        },
        quality === "hover" ? 2 : 3,
      );
    const presentationRequest = useRef(0);
    const generation = useRef(0);
    const mounted = useRef(false);
    const activeRef = useRef(active && !suspended);
    const callbacks = useRef({ onReady, onError });
    const firstReady = useRef(false);
    const imageKey = posterKey(sceneId, posterRevision);
    const [posterState, setPoster] = useState<{ key: string; image: string }>();
    const poster =
      posterState && (suspended || posterState.key === imageKey)
        ? posterState.image
        : thumbnails.peek(imageKey) ?? posterState?.image;
    const [status, setStatus] = useState<"loading" | "ready" | "error">(
      "loading",
    );
    const [error, setError] = useState<string>();
    const [nearViewport, setNearViewport] = useState(!lazy);
    activeRef.current = active && !suspended;
    callbacks.current = { onReady, onError };

    const fail = (reason: unknown) => {
      if (!mounted.current) return;
      const message = String(reason).replace(/^Error: /, "");
      setStatus("error");
      setError(message);
      callbacks.current.onError?.(message);
    };

    const samplePrepared = async (
      next: Preview,
      time: number,
      valid: () => boolean,
    ) => {
      const host = stage.current;
      const width = host?.clientWidth ?? 0;
      const height = host?.clientHeight ?? 0;
      const dpr =
        qualityRef.current === "hover" ? 1 : Math.min(2, devicePixelRatio);
      const viewport = `${width}:${height}:${dpr}`;
      const at = Math.max(0, Math.min(time, next.document.duration));
      if (next.sampledTime === at && next.sampledViewport === viewport) return;
      next.engine.setPreviewViewport(width, height, dpr);
      try {
        await next.engine.sample(at, next.document, valid, next.revision);
      } catch (error) {
        // Failed/lost renderers must never re-enter the reusable idle cache.
        if (next.warmKey) {
          releaseHoverOwner(next.warmKey);
          next.warmKey = undefined;
        }
        throw error;
      }
      if (valid()) {
        next.sampledTime = at;
        next.sampledViewport = viewport;
      }
    };

    const sample = async (
      id: string,
      time: number,
      isCurrent: () => boolean = () => true,
    ) => {
      const requestedGeneration = generation.current;
      const request = ++presentationRequest.current;
      const started = performance.now();
      const valid = () =>
        mounted.current &&
        activeRef.current &&
        requestedGeneration === generation.current &&
        request === presentationRequest.current &&
        isCurrent();
      try {
        await pool.current!.run(id, valid, async (next, current) => {
          await samplePrepared(next, time, current);
          if (!current()) return;
          const previous = preview.current;
          if (previous !== next) {
            preview.current = next;
            pool.current!.pin(id);
            stage.current?.replaceChildren(next.engine.canvas);
          }
          next.engine.canvas.style.width = "100%";
          next.engine.canvas.style.height = "100%";
          next.engine.canvas.style.objectFit = fit;
          next.engine.canvas.style.display = "block";
          const host = stage.current?.parentElement;
          if (host) {
            const elapsed = (performance.now() - started).toFixed(1);
            host.dataset.presentedScene = id;
            host.dataset.presentedTime = String(next.sampledTime);
            host.dataset.sampleMs = elapsed;
            if (previous !== next) host.dataset.switchMs = elapsed;
          }
          setStatus("ready");
          setError(undefined);
          if (!firstReady.current) {
            firstReady.current = true;
            callbacks.current.onReady?.();
          }
        });
      } catch (reason) {
        if (valid()) {
          fail(reason);
          throw reason;
        }
      }
    };
    const warm = async (id: string, time = 0) => {
      const requestedGeneration = generation.current;
      const valid = () =>
        mounted.current &&
        activeRef.current &&
        requestedGeneration === generation.current;
      if (preview.current?.sceneId === id) return;
      const started = performance.now();
      const host = stage.current?.parentElement;
      if (host) {
        host.dataset.warmingScene = id;
        host.dataset.warmState = "loading";
      }
      await pool.current!.run(id, valid, async (next, current) => {
        // A queued warm-up must not rewind an engine that has since gone live.
        if (preview.current === next) return;
        await samplePrepared(
          next,
          time,
          () => current() && preview.current !== next,
        );
        if (current() && host) {
          host.dataset.warmState = "ready";
          host.dataset.warmedScene = id;
          host.dataset.warmMs = (performance.now() - started).toFixed(1);
        }
      });
    };
    const snapshot = () => {
      try {
        return preview.current?.engine.canvas.toDataURL("image/jpeg", 0.72);
      } catch {
        return undefined;
      }
    };
    useImperativeHandle(ref, () => ({ sample, warm, snapshot }));

    useEffect(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
        generation.current++;
        pool.current?.clear();
        preview.current = null;
      };
    }, []);

    useEffect(() => {
      const element = stage.current;
      if (!lazy || !element || typeof IntersectionObserver === "undefined") {
        setNearViewport(true);
        return;
      }
      const observer = new IntersectionObserver(
        ([entry]) => setNearViewport(entry.isIntersecting),
        {
          root: element.closest(".library-content"),
          rootMargin: "200px",
        },
      );
      observer.observe(element);
      return () => observer.disconnect();
    }, [lazy]);

    useEffect(() => {
      ++generation.current;
      firstReady.current = false;
      setError(undefined);
      if (!suspended) setStatus("loading");
      // A static snapshot remains visible while a replacement engine prepares.
      const previous = preview.current;
      if (previous) {
        try {
          setPoster({
            key: imageKey,
            image: previous.engine.canvas.toDataURL("image/jpeg", 0.86),
          });
        } catch {
          // A lost context can still be rebuilt without preserving its old frame.
        }
        preview.current = null;
        stage.current?.replaceChildren();
      } else if (suspended && !posterState && poster) {
        // A cached image may have painted before its asynchronous cache read
        // committed. Keep those exact pixels across hidden revision changes.
        setPoster({ key: imageKey, image: poster });
      }
      pool.current?.clear();
      if (active && !suspended) void sample(sceneId, 0).catch(() => {});
      return () => {
        generation.current++;
      };
    }, [sceneId, active, revision, quality, suspended]);

    useEffect(() => {
      if (suspended || active || !nearViewport) return;
      const token = generation.current;
      let disposed = false;
      const needed = () =>
        !disposed &&
        mounted.current &&
        !suspendedRef.current &&
        generation.current === token;
      void thumbnails
        .request(imageKey, { sceneId, revision: posterRevision }, needed)
        .then(
          (image) => {
            if (!image || !needed()) return;
            setPoster({ key: imageKey, image });
            if (!activeRef.current) {
              setStatus("ready");
              callbacks.current.onReady?.();
            }
          },
          (reason) => {
            if (needed() && !activeRef.current) fail(reason);
          },
        );
      return () => {
        disposed = true;
      };
    }, [sceneId, active, revision, imageKey, nearViewport, quality, suspended]);

    return (
      <div
        className={`composition-preview ${className}`}
        data-preview-state={status}
        data-preview-poster={poster ? "ready" : "missing"}
        data-preview-suspended={suspended || undefined}
        aria-busy={status === "loading"}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {poster && (
          <img
            src={poster}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: fit,
            }}
          />
        )}
        <div ref={stage} style={{ position: "absolute", inset: 0 }} />
        {status === "loading" && !poster && (
          <span
            className="spinner composition-preview-spinner"
            aria-label="Loading composition"
            style={{ position: "absolute", top: "50%", left: "50%" }}
          />
        )}
        {error && (
          <span
            className="composition-preview-error"
            role="status"
            title={error}
            style={{
              position: "absolute",
              inset: 16,
              display: "grid",
              placeItems: "center",
              fontSize: 12,
            }}
          >
            Preview unavailable
          </span>
        )}
      </div>
    );
  },
);
