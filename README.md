# Tilt

Tilt is an agent-first motion workspace built around scenes. A scene is a folder containing the real interface, executable animation code, assets, and a small persistent document. The editor is a capable container that gives people and agents a shared clock, browser surfaces, a compositor, inspection, and reliable rendering. It should make bespoke work easy: an agent can write a shader, adapt an unusual interface, or construct a 3D composition without waiting for a new effect to be added to the product. We provide clear contracts and useful skills, while leaving the creative implementation open. Files are the source of truth; the editor and agents change the same files.

## Run

Requires Node 24+ and FFmpeg/FFprobe on PATH. On macOS, `brew install ffmpeg` provides both.

```sh
npm ci
npm run setup:url
npm start
```

The one-time URL setup installs a loopback-only [Portless](https://github.com/vercel-labs/portless) HTTPS proxy on port 443 and trusts its local certificate authority. Administrator approval is required. It starts again after reboot and maps the registered `tilt.video` route to this Mac in `/etc/hosts`. Public DNS and Vercel remain unchanged; on this Mac the domain opens the local app. No deployment is needed to see local changes. Remove this shared Portless service with `npm run remove:url` if it is no longer needed; Portless cleans up its hosts entries when the proxy stops.

`npm start` builds and opens the desktop viewer at **[tilt.localhost](https://tilt.video)**. To run without a desktop window:

```sh
npm start -- --browser
```

Open `https://tilt.video` in Codex or any browser while Tilt is running. The address stays the same across restarts even when the internal port changes. The local Electron runtime supplies Chromium source capture, files, history and rendering to both viewers. Starting again reuses the running instance. Closing a viewer leaves the runtime running; `npm run cli -- stop` stops it. `npm run cli -- desktop` opens the desktop viewer again. `Tilt.command` remains a double-click launcher. Restart after changing editor/runtime code. No account, model key, built-in agent or MCP server is required.

For isolated verification without the local domain setup, `npm start -- --direct --browser` skips Portless and uses a direct loopback port. The CLI always uses its private loopback connection. Source capture and detached export workers keep their isolated local servers. The proxy starts at boot; Tilt itself still starts with `npm start` or `Tilt.command`.

Drag in either Perspective or Orthographic camera view to orbit. Shift-drag, right-drag or middle-drag pans; scroll or trackpad pinch zooms. In Isometric or 2D, dragging pans. **Fit** or **F** resets inspection. Inspection does not alter the authored camera or exported video. Space plays/pauses; arrows step frames. The timeline has a full-scene overview, scrubbing and zoom (Option/Alt-drag or wheel; Shift-drag resets). Controls save to the scene file; a slider drag becomes one undo step. Undo/Redo (Cmd/Ctrl-Z and Shift-Z) include settings, code and local assets, and survive restarting. Double-click the title to rename the scene (Enter/F2 also works). The adjacent settings button opens duration, frame rate and background. New scenes default to 60 fps; the available rates are 30 and 60 fps. The right panel contains parameter controls and the shared camera controls. Render writes an MP4 to `exports/`.

## Scene files

```text
scenes/interface/
  scene.json          # size, duration, fps, sources, custom parameter values, visual cue tracks
  scene.ts            # executable composition, camera, materials and sample(time)
  source/index.html   # real browser UI with a small time-control adapter
```

`scene.ts` exports a factory receiving Three.js, a world, a camera, source textures, and time helpers. It returns `sample({time, frame, parameters, controls, document})`. Sampling must reconstruct the frame from absolute time, including after backward seeks. Parameters are declared by the scene and generate inspector controls. The timeline exposes named animation actions and expandable groups with contextual controls. Group edits shift or retime their children together; scene code samples those intervals to drive arbitrary motion. Diamonds remain visual cues, not executable keyframes. Follow [the animation group contract](docs/animation-groups.md) when authoring motion.

Web sources run in isolated Chromium windows without Node or the editor bridge. Any framework that produces a browser app can supply a source: vanilla, React, Svelte, Vue, and others. A local entry gets its own origin rooted at the entry file’s directory, including root-relative assets and SPA routes. Live URLs can be previewed. For exports, use a local production build and fixture data; Tilt refuses to pretend a mutable URL is an immutable input.

## Resolution and sharpness

Header settings include 1080, 4K, Square and 9:16 presets/custom dimensions up to 4K and **UI density: Auto or 1–8×**. Density adds raster detail without changing the source's CSS layout. Auto follows output resolution and increases preview detail when inspecting close up; fixed density is saved for authored close-up shots and exports. Settings show effective capture dimensions and limits. See [the resolution contract](docs/resolution.md) for imports, Retina previews and memory limits.

## Layers

Declare DOM regions in `sources[].layers`, then use `createLayeredSource()` in scene code. Each region becomes a separately positioned, transparent surface, with browser layout preserved and nested regions inheriting their parent's 3D transform. The sample lifts navigation, its active item, summary cards and tasks into depth, then settles them back into the interface. Scrub around 4 seconds in Camera view; use Layer depth to adjust separation. The agent context records layers, hierarchy and local transforms.

This works at the rendered DOM boundary, so it does not depend on React or another specific framework. See [the layer contract](docs/layers.md) and [the agent skill](.agents/skills/ui-layers/SKILL.md) for selectors, transforms, grouping, and capture limits.

## Camera

Choose **Perspective** or **Orthographic** in the Camera parameter group. Orthographic offers exact Front, 15°, 30° and 45° stops, left/right orientation, and saved Rotation and Elevation controls. The degree labels describe projected edge angles; 30° is true isometric. Alignment follows the actual UI plane through its parent transforms, so lifting layers in Z preserves parallel edges. The selection saves in `scene.json.camera`, participates in Undo/Redo, and applies to exports. Pan and zoom remain viewer inspection. Layered sources register their frame automatically; custom scenes can use the same [camera contract](docs/camera.md).

## Parameter controls

The sidebar is generated from `scene.json.parameters`. The shared vocabulary supports Dial Kit sliders/numbers, colors, toggles, dropdowns, segmented choices, XY pads, text and XYZ vectors, with optional groups and units. An agent can expose an input for a bespoke shader or transform by adding a declaration and reading it in `sample` through `controls.number/color/boolean/select/vector3/pad/text(key)`. No editor component or effect-specific plugin is required. Values use the same validation, persistence, history and export path as other scene edits.

The editor automatically follows the device's light or dark theme using the supplied Codex palette, with no theme toggle or stored override.

The controls and timeline styling are a selective, MIT-licensed [local Dial Kit fork](src/renderer/vendor/dialkit/UPSTREAM.md), rather than a dependency on its stores or playback engine.

See [the control contract and recipes](docs/parameters.md) and [the agent skill](.agents/skills/parameter-controls/SKILL.md). The included scene groups its existing controls under Composition, Camera and Light field.

## Bring your own agent

The editor, CLI and MCP adapter share a validated [agent interface](docs/agent-interface.md). Start with `npm run cli -- capabilities`, `views`, and `context --fresh --view <id>`. Context includes the visible timeline range, selected track details, source diagnostics and pending edit owners. `watch` streams changes without taking control of a viewer. `wait-for-frame <revision>` confirms a new scene is displayed. Codex sessions receive distinct edit identities automatically; other clients can set `TILT_ACTOR`. A configured `TILT_URL`/runtime-injected `TILT_TOKEN` can target a compatible remote endpoint; hosted accounts, artifact delivery and WebMCP remain future work.

Point Codex, Claude or another agent at this folder and [AGENTS.md](AGENTS.md). Edit ordinary scene files. The viewer watches them and keeps the last successful frame while a replacement prepares. No special tool call is needed for a normal file edit.

The runtime writes `.tilt/context.json` plus `.tilt/views/<view-id>.json`: active viewer, scene, requested and presented time, source routes, layer hierarchy/bounds/transforms, paint warnings, 2D/camera mode, selection, pan/zoom/orbit, viewport, readiness, errors and saved/displayed revisions. These are **read-only observations**, with timestamps and connection state; editing them does not control the viewer. They contain no session credential. Read them before acting. For an acknowledged fresh observation or capture, use the CLI:

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

This is a working prototype, not a finished NLE. Browser-to-GPU transfer currently uses PNG readback, not shared GPU textures. Sources can remain whole surfaces or be separated into explicitly declared DOM layers. Clips and paint dependencies stay baked into their captured surfaces; backdrop effects and group compositing need deliberate boundaries. This is not automatic decomposition of every DOM element. Export runtime JavaScript and scene code are frozen, but the installed Electron binary and FFmpeg are still required. Media timing, external network resources, arbitrary shaders and app state need their scene adapter to be deterministic. Scene code is trusted project code: browser sources have reduced capabilities, but this is not a hostile-code sandbox. There is no integrated chat, audio timeline, Swift adapter, or packaged installer yet.

## Checks

```sh
npm run typecheck
npm test
npm run test:layers
npm run test:transfer
npm run build
```

See [docs/architecture.md](docs/architecture.md) for contracts and [docs/verification.md](docs/verification.md) for measured checks and remaining limits.

The [runtime refactor](docs/runtime-refactor.md) documents persistent browser sources, binary surfaces, memory accounting and recoverable pipelined export. See [source hosting](docs/source-hosting.md) for framework-neutral app imports and [refactor benchmarks](docs/runtime-refactor-benchmarks.md) for before/after measurements and regression evidence.

The [Admin Next performance review](docs/performance-review.md) records the selected optimizations, identical-output checks, measurements and changes deliberately left out. The transfer benchmark is an isolated native integration test, not a displayed-FPS benchmark.
