# Tilt

Tilt is an agent-first motion workspace built around **projects and compositions**. A project scopes the source files, assets and compositions to a local folder, usually a Git repository. A composition produces an image over time from real interfaces, executable animation code and other compositions. A final edit is another composition: place references on its timeline, trim or split them, choose a camera and override exposed controls independently. Editing the original updates its uses.

The editor gives people and agents a shared clock, browser surfaces, a compositor, inspection and reliable rendering. It should make bespoke work easy: an agent can write a shader, adapt an unusual interface or construct a 3D composition without waiting for a new effect. Files are the source of truth; the editor and agents change the same files. The existing `scenes/`, `scene.json` and `scene.ts` filenames remain compatible. See [projects and compositions](docs/compositions.md) for the reference, camera, timing and export contracts.

## Run the Electron app

Tilt currently runs locally. The Electron runtime manages project files, browser capture and video export; the editor opens in an Electron desktop window. Node.js 24+ and FFmpeg/FFprobe on PATH are required. Electron is installed by `npm ci`—there is no separate Electron installation step. macOS is the primary tested platform.

```sh
# macOS prerequisites (using Homebrew)
brew install node@24 ffmpeg

# Clone the private repo with an account that has access
git clone https://github.com/jaytel0/tilt.git
cd tilt
npm ci

# Build and launch the desktop Electron app on a local port
npm start -- --direct
```

Use a Node version manager or Homebrew's printed PATH instructions if `node --version` does not report 24 or newer. Keep the launching terminal open; Ctrl+C stops that runtime. Closing the editor window leaves the runtime running, so `npm start -- --direct` reopens it. To stop it explicitly, run `npm run cli -- stop` from another terminal in this folder.

### Loop Search demo

From the repository root after `npm ci`:

```sh
npm run demo:loop-search
```

This builds Tilt and opens the bundled **Loop Search** project in Electron. Press Space or Play to watch the 15-second sequence. The React source, packaged browser assets, native macOS cursor, controls and editable timeline are included in [examples/loop-search](examples/loop-search/README.md). The demo requires no Loop account or API key. Its browser bundle is checked in, so no second dependency install is required to run it.

To open another project:

```sh
npm start -- --direct --project /path/to/project
```

### Optional browser viewer

```sh
npm start -- --direct --browser
```

Open the localhost URL printed in the terminal. This runs the same local Electron backend and uses your browser for the editor. It is not a hosted web service.

For a phone on another device or network, see [temporary phone access](docs/phone-access.md).

### Optional local HTTPS address

```sh
npm run setup:url
npm start
```

This configures the local `https://tilt.video` address using Portless. Setup requires administrator approval for its local HTTPS proxy, certificate and hosts mapping; it does not publish a website or change public DNS. Stop an existing direct-port runtime before switching to this mode. Use `npm run remove:url` to remove the shared local service. The direct-port commands above need none of this setup.

Drag in either Perspective or Orthographic camera view to orbit. Shift-drag, right-drag or middle-drag pans; scroll or trackpad pinch zooms. In Isometric or 2D, dragging pans. **Fit** or **F** resets inspection. Inspection does not alter the authored camera or exported video. Space plays/pauses; arrows step frames. The timeline combines playback and one time readout with its ruler. Drag to scrub; pinch or Option/Alt-wheel to zoom around the pointer; scroll sideways to pan. Double-click the ruler to fit the scene. With the ruler focused, +/− zoom and 0 fits. Controls save to the scene file; a slider drag becomes one undo step. Undo/Redo (Cmd/Ctrl-Z and Shift-Z) include settings, code and local assets, and survive restarting. Double-click the title to rename the scene (Enter/F2 also works). The adjacent settings button opens duration, frame rate and background. New scenes default to 60 fps; the available rates are 30 and 60 fps. The right panel contains parameter controls and the shared camera controls. Render writes an MP4 to `exports/`.

## Composition files

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

This is a working prototype, not a finished NLE. Controlled local HTML sources play directly in an isolated browser frame in 2D, sampled on the editor clock. Camera views, captures and exports use browser-to-GPU PNG readback, not shared GPU textures. Sources can remain whole surfaces or be separated into explicitly declared DOM layers. Clips and paint dependencies stay baked into their captured surfaces; backdrop effects and group compositing need deliberate boundaries. This is not automatic decomposition of every DOM element. Export runtime JavaScript and scene code are frozen, but the installed Electron binary and FFmpeg are still required. Media timing, external network resources, arbitrary shaders and app state need their scene adapter to be deterministic. Scene code is trusted project code: browser sources have reduced capabilities, but this is not a hostile-code sandbox. There is no integrated chat, audio timeline, Swift adapter, or packaged installer yet.

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
