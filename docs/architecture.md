# Contracts and ownership

`src/core` contains the document and timing contracts without Electron or React dependencies. The document is versioned and runtime-validated with Zod. TypeScript protects code-level contracts; Zod protects files and commands arriving at runtime.

`src/main` owns filesystem authority, browser sources, authenticated local agent commands and durable jobs. The editor gets a narrow preload command bridge. Imported source pages get none. Agent file operations are scene-relative and reject traversal/symlink escapes; scene compilation is deliberately trusted local work.

`src/renderer/engine.ts` owns the WebGL renderer. Scene code owns its composition. The compositor receives textures, never framework-specific components. Each source adapter owns readiness, its rendering environment and a sampled surface. The current adapter is Chromium; an Apple runtime adapter is a separate future project.

## Time and reload

Play intent is independent of ready state. Source readiness includes document fonts/images and `tiltSource.ready`. Controlled sampling awaits the source adapter, assigns the shared time to Web Animations, and waits for paint. Source revisions permit whole-surface texture reuse. The editor's latest-frame scheduler keeps one in-flight seek and replaces pending seeks with the newest request.

The editor retains the last successful compositor during reload. A candidate must initialize and draw before replacing it; old resources then dispose. Invalid JSON retains the last valid document and reports the error. Scene metadata writes are atomic. Document undo is bounded to 100 edits and checks for external changes. Code undo is left to the agent/editor and Git.

## Rendering

Submissions persist a unique request ID before preparation. Repeated submissions with the same ID return the original job. Preparation fingerprints source files before and after copying, seals scene settings, bundles the scene module, and copies a content-addressed compiled application runtime. Source mutation during freezing fails explicitly.

An on-demand detached coordinator serializes queued jobs. Each job starts one Electron worker using its frozen app code and scene bundle, keeping its browser alive throughout capture. Frames are sampled at `index / fps`, saved with atomic rename, and checkpointed on disk. A resumed worker validates and adopts existing PNG frames, including a frame written before its progress checkpoint. Capture errors have bounded retries; frozen inputs never silently change. Workers lower capture throughput while editing activity is fresh.

MP4 encoding writes a temporary file, verifies dimensions/frame count with FFprobe, fully decodes it with FFmpeg, checks cancellation, then publishes it. Closing the editor does not stop the coordinator. Reopening reconciles stale active jobs; explicit Resume retries failed/interrupted jobs. CLI `jobs`, `cancel`, and `resume` also work with the editor closed.

The app code is frozen, not the complete OS: jobs still require the same installed Electron version, FFmpeg and compatible fonts/GPU behavior. Local assets and fixture data are the author’s responsibility. The v1 adapter uses PNG readback; shared GPU textures, multi-pass render graph, media contracts and independently editable DOM surfaces are future performance/capability work, not claimed features.
