# Contracts and ownership

`src/core` contains the document and timing contracts without Electron or React dependencies. The document is versioned and runtime-validated with Zod. TypeScript protects code-level contracts; Zod protects files and commands arriving at runtime.

`src/main` owns filesystem authority, browser sources, authenticated local agent commands and durable jobs. Browser and desktop editors share a cookie-authenticated HTTP API and an event stream. A private token authenticates local CLI clients. Only frozen render workers use the narrow preload bridge. Imported source pages get neither. Agent file operations are scene-relative and reject traversal/symlink escapes; scene compilation is deliberately trusted local work.

`src/renderer/engine.ts` owns the WebGL renderer. Scene code owns its composition. The compositor receives textures, never framework-specific components. Each source adapter owns readiness, its rendering environment and a sampled surface. The current adapter is Chromium; an Apple runtime adapter is a separate future project.

## Time and reload

Play intent is independent of ready state. Source readiness includes document fonts/images and `tiltSource.ready`. Controlled sampling awaits the source adapter, assigns the shared time to Web Animations, and waits for paint. Source revisions permit whole-surface texture reuse. The editor's latest-frame scheduler keeps one in-flight seek and replaces pending seeks with the newest request.

The editor retains the last successful compositor during reload. A candidate must initialize and draw before replacing it; old resources then dispose. Invalid JSON retains the last valid document and reports the error. Scene metadata writes are atomic. A content-addressed journal snapshots JSON, code and local assets. The persistent cursor supports undo/redo across restart. A write-ahead record recovers interrupted multi-file restores; conflicts fail rather than silently clobber files. Agent edit groups hold a frozen base preview until applied. Inspector gesture groups preview parameters live while making one checkpoint on release. Unknown external changes are recorded before undo is attempted. Raw file edits have no universal cross-process lock; grouping and expected revisions are the coordination contract.

## Rendering

Submissions persist a unique request ID before preparation. Repeated submissions with the same ID return the original job. Preparation fingerprints source files before and after copying, seals scene settings, bundles the scene module, and copies a content-addressed compiled application runtime. Source mutation during freezing fails explicitly.

An on-demand detached coordinator serializes queued jobs. Each job starts one Electron worker using its frozen app code and scene bundle, keeping its browser alive throughout capture. Frames are sampled at `index / fps`, saved with atomic rename, and checkpointed on disk. A resumed worker validates and adopts existing PNG frames, including a frame written before its progress checkpoint. Capture errors have bounded retries; frozen inputs never silently change. Workers lower capture throughput while editing activity is fresh.

MP4 encoding writes a temporary file, verifies dimensions/frame count with FFprobe, fully decodes it with FFmpeg, checks cancellation, then publishes it. Closing the editor does not stop the coordinator. Reopening reconciles stale active jobs; explicit Resume retries failed/interrupted jobs. CLI `jobs`, `cancel`, and `resume` also work with the editor closed.

The app code is frozen, not the complete OS: jobs still require the same installed Electron version, FFmpeg and compatible fonts/GPU behavior. Local assets and fixture data are the author’s responsibility. The v1 adapter uses PNG readback; shared GPU textures, multi-pass render graph, media contracts and automatic DOM decomposition are future performance/capability work, not claimed features.

## Viewer context and navigation

Each page gets a distinct viewer ID. Per-scene source sampling is serialized so two viewers cannot interleave an adapter's asynchronous work. Requested and displayed revisions/time are separate. Source routes are paired with sampled pixels. Normal context updates are coalesced; playback updates at most four times per second, with a heartbeat while idle. A timestamp older than seven seconds is disconnected. Last interaction chooses the active view; background heartbeats do not steal it. `context --fresh`, transport and capture use a request/acknowledgement to the selected viewer. PNG captures include adjacent JSON context.

Canvas gestures update an inspection transform. The compositor uses a copy of the authored camera, or a flat orthographic source view, to apply it. Navigation redraws existing textures immediately, without recapturing the source or resampling animation. Fit returns to the authored framing. This state lives in runtime context and per-tab session state, while creative state remains in scene files. It is excluded from video export.

`.tilt/history`, `.tilt/views` and `.tilt/context.json` are runtime-owned. `.tilt/session.json` contains a private local CLI credential and must never be copied into agent context, exports, logs or Git. The service binds only to loopback and checks Host/Origin; it is a local development runtime, not a remotely hosted editing service.

## Declared DOM layers

`src/core/layers.ts` defines source-pixel bounds, crops and layer-frame metadata. `src/main/dom-layers.ts` plans selectors and paint isolation inside the source browser. `WebSource` samples once, captures full/base/region passes, then restores normal paint. Source revisions cache the complete frame. `src/renderer/layered-source.ts` maps crops back into one coordinate system, with separate browser-layout anchors and authored transform groups. The scene gets `createLayeredSource`; it owns choreography. Export uses this same path. See `docs/layers.md` for the declaration contract and compositing boundaries.
