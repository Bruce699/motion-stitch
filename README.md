# Tilt

Tilt is an agent-first motion workspace built around scenes. A scene is a folder containing the real interface, executable animation code, assets, and a small persistent document. The editor is a capable container that gives people and agents a shared clock, browser surfaces, a compositor, inspection, and reliable rendering. It should make bespoke work easy: an agent can write a shader, adapt an unusual interface, or construct a 3D composition without waiting for a new effect to be added to the product. We provide clear contracts and useful skills, while leaving the creative implementation open. Files are the source of truth; the editor and agents change the same files.

## Run

Requires Node 22.12+ and FFmpeg/FFprobe on PATH. On macOS, `brew install ffmpeg` provides both.

```sh
npm ci
npm start
```

This builds and opens the desktop viewer. To run without a desktop window:

```sh
npm start -- --browser
```

Open the printed localhost URL in Codex or any browser. The local Electron runtime supplies Chromium source capture, files, history and rendering to both viewers. It reuses its previous port when available. Closing a viewer leaves the runtime running; `npm run cli -- stop` stops it. `npm run cli -- desktop` opens the desktop viewer again. `Tilt.command` remains a double-click launcher. Restart after changing editor/runtime code. No account, model key, built-in agent or MCP server is required.

Drag in Camera view to orbit. Shift-drag, right-drag or middle-drag pans; scroll or trackpad pinch zooms. In 2D, dragging pans the source directly. **Fit** or **F** resets inspection. Inspection does not alter the authored camera or exported video. Space plays/pauses; arrows step frames. The timeline scrubs. Numeric controls save immediately; a slider drag becomes one undo step. Undo/Redo (Cmd/Ctrl-Z and Shift-Z) include settings, code and local assets, and survive restarting. New Scene copies the starter. Render writes an MP4 to `exports/`.

## Scene files

```text
scenes/interface/
  scene.json          # size, duration, fps, sources, custom parameter values, visual cue tracks
  scene.ts            # executable composition, camera, materials and sample(time)
  source/index.html   # real browser UI with a small time-control adapter
```

`scene.ts` exports a factory receiving Three.js, a world, a camera, source textures, and time helpers. It returns `sample({time, frame, parameters, document})`. Sampling must reconstruct the frame from absolute time, including after backward seeks. Parameters are declared by the scene and generate inspector controls. Timeline tracks and diamonds are **authored visual cues**; animation remains in scene code. They are not a second animation engine or a keyframe-editing UI.

Web sources run in isolated Chromium windows without Node or the editor bridge. Any framework that produces a browser app can supply a source: vanilla, React, Svelte, Vue, and others. A local entry gets its own origin rooted at the entry file’s directory, including root-relative assets and SPA routes. Live URLs can be previewed. For exports, use a local production build and fixture data; Tilt refuses to pretend a mutable URL is an immutable input.

## Bring your own agent

Point Codex, Claude or another agent at this folder and [AGENTS.md](AGENTS.md). Edit ordinary scene files. The viewer watches them and keeps the last successful frame while a replacement prepares. No special tool call is needed for a normal file edit.

The runtime writes `.tilt/context.json` plus `.tilt/views/<view-id>.json`: active viewer, scene, requested and presented time, source routes, 2D/camera mode, selection, pan/zoom/orbit, viewport, readiness, errors and saved/displayed revisions. These are **read-only observations**, with timestamps and connection state; editing them does not control the viewer. They contain no session credential. Read them before acting. For an acknowledged fresh observation or capture, use the CLI:

```sh
npm run cli -- context --fresh
npm run cli -- inspect
npm run cli -- seek 4.5
npm run cli -- capture 4.5
npm run cli -- history
npm run cli -- undo
npm run cli -- render
npm run cli -- jobs
```

Add `--view <id>` to target a particular viewer; add `--scene <id>` for file/history/render operations. Capture saves both a PNG and the context of the frame actually presented. Multiple viewers have independent transport and inspection state. Reloading a tab restores its inspection state and time; playback resumes paused.

For a multi-file change, `npm run cli -- begin "Describe the edit" <revision>` returns an edit ID. Write the files, then `npm run cli -- apply <id>`. The old complete preview stays visible until Apply, and the change becomes one undo step. `discard <id>` restores its base. Groups survive runtime restarts. The JSON `command` escape hatch also accepts `paths` on `edit_begin` to restrict the files an edit may touch. Ordinary ungrouped saves are checkpointed after a short debounce; use a group when partial multi-file builds would be invalid.

Revision/hash guards reject stale replacements through the command API. Independent programs writing the same raw file cannot communicate their intent; the history records what it observes, not keystrokes or ownership. Avoid simultaneous writers to the same file. Scenes containing symlinks or hidden dependencies must be materialized into ordinary local files. History currently retains snapshots without automatic pruning.

An optional MCP adapter remains at `dist/agent.cjs` for clients that want it; set `TILT_PROJECT` to the absolute project folder. It is not needed for the file/CLI workflow.

## Architecture and boundaries

- **Electron runtime + React + TypeScript viewer:** one local runtime, optional desktop shell and the same editor over HTTP in a browser. The source app does not need React or TypeScript.
- **Standalone TypeScript contracts:** validated scene document, absolute-time helpers, playback intent, latest-request scheduling.
- **Chromium web adapter:** readiness, controlled UI sampling, actual browser pixels, semantic subject inspection.
- **Three.js compositor:** textures, geometry, cameras, arbitrary materials and shaders. A native adapter could later supply surfaces through the same boundary; no Swift implementation is included.
- **Local background queue + FFmpeg:** frozen source/module/runtime snapshots, one warm browser per job, atomic PNG checkpoints, frame adoption on resume, verified MP4 before publication.

The editor advances only after preparation succeeds. Browser sessions use an HTTP-only cookie and origin checks; local CLI authentication lives in a private session file. A sampled source route travels with the presented frame, not another viewer’s last sample. Rapid seeks coalesce. Unchanged source revisions reuse their last texture; camera-only animation does not recapture the browser. Scene code reload keeps the previous valid canvas until the replacement draws successfully. Workers pause capture during scrubbing and reduce throughput during playback; activity expires after three seconds. Jobs survive closing the editor and recover queued/capture work on reopening. Cancelling preserves diagnostics and prevents publication.

This is a working prototype, not a finished NLE. Browser-to-GPU transfer currently uses PNG readback, not shared GPU textures. Source capture is a faithful **whole surface**, not automatic independent DOM layers. Native DOM clips, masks and blur stay baked into that surface; split surfaces explicitly when independent depth is required. Export runtime JavaScript and scene code are frozen, but the installed Electron binary and FFmpeg are still required. Media timing, external network resources, arbitrary shaders and app state need their scene adapter to be deterministic. Scene code is trusted project code: browser sources have reduced capabilities, but this is not a hostile-code sandbox. There is no integrated chat, audio timeline, Swift adapter, or packaged installer yet.

## Checks

```sh
npm run typecheck
npm test
npm run build
```

See [docs/architecture.md](docs/architecture.md) for contracts and [docs/verification.md](docs/verification.md) for measured checks and remaining limits.
