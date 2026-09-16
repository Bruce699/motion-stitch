# Tilt

Tilt is an agent-first motion workspace built around scenes. A scene is a folder containing the real interface, executable animation code, assets, and a small persistent document. The editor is a capable container that gives people and agents a shared clock, browser surfaces, a compositor, inspection, and reliable rendering. It should make bespoke work easy: an agent can write a shader, adapt an unusual interface, or construct a 3D composition without waiting for a new effect to be added to the product. We provide clear contracts and useful skills, while leaving the creative implementation open. Files are the source of truth; the editor and agents change the same files.

## Run

Requires Node 22.12+ and FFmpeg/FFprobe on PATH. On macOS, `brew install ffmpeg` provides both.

```sh
npm ci
npm start
```

This builds and opens the Electron app. You can also double-click `Tilt.command`. Scene files reload automatically; restart after changing the editor or main process. No account, cloud service, or model key is required. The included interface is an original local HTML fixture, not Shopify code.

Space plays/pauses. Arrow keys step a frame. Click or drag the timeline to seek. Inspector edits save immediately to `scene.json`; Undo/Redo cover document edits. New Scene creates a separate editable copy of the starter. Render produces an MP4 under `exports/`.

## Scene files

```text
scenes/interface/
  scene.json          # size, duration, fps, sources, custom parameter values, visual cue tracks
  scene.ts            # executable composition, camera, materials and sample(time)
  source/index.html   # real browser UI with a small time-control adapter
```

`scene.ts` exports a factory receiving Three.js, a world, a camera, source textures, and time helpers. It returns `sample({time, frame, parameters, document})`. Sampling must reconstruct the frame from absolute time, including after backward seeks. Parameters are declared by the scene and generate inspector controls. Timeline tracks and diamonds are **authored visual cues**; animation remains in scene code. They are not a second animation engine or a keyframe-editing UI.

Web sources run in isolated Chromium windows without Node or the editor bridge. Any framework that produces a browser app can supply a source: vanilla, React, Svelte, Vue, and others. A local entry gets its own origin rooted at the entry file’s directory, including root-relative assets and SPA routes. Live URLs can be previewed. For exports, use a local production build and fixture data; Tilt refuses to pretend a mutable URL is an immutable input.

## Agent tools

Start Tilt, then use the CLI or configure an MCP client:

```json
{
  "mcpServers": {
    "tilt": {
      "command": "node",
      "args": ["/Users/jaytel/Developer/Tilt/dist/agent.cjs"],
      "env": { "TILT_PROJECT": "/Users/jaytel/Developer/Tilt" }
    }
  }
}
```

```sh
npm run cli -- state
npm run cli -- inspect
npm run cli -- set tilt 0.4
npm run cli -- capture 4.5
npm run cli -- render
npm run cli -- jobs
```

MCP supports scene state, reading/writing files with conflict checks, replacing the document with a revision check, parameters, DOM subjects, seeking, PNG capture, and submitting/cancelling/resuming exports. External agents may also edit scene files directly. No model is coupled to the engine. See [AGENTS.md](AGENTS.md) and the three skills under `.agents/skills/` before authoring.

## Architecture and boundaries

- **Electron + React + TypeScript:** desktop host and thin editor. The source app does not need React or TypeScript.
- **Standalone TypeScript contracts:** validated scene document, absolute-time helpers, playback intent, latest-request scheduling.
- **Chromium web adapter:** readiness, controlled UI sampling, actual browser pixels, semantic subject inspection.
- **Three.js compositor:** textures, geometry, cameras, arbitrary materials and shaders. A native adapter could later supply surfaces through the same boundary; no Swift implementation is included.
- **Local background queue + FFmpeg:** frozen source/module/runtime snapshots, one warm browser per job, atomic PNG checkpoints, frame adoption on resume, verified MP4 before publication.

The editor advances only after preparation succeeds. Rapid seeks coalesce. Unchanged source revisions reuse their last texture; camera-only animation does not recapture the browser. Scene code reload keeps the previous valid canvas until the replacement draws successfully. Workers pause capture during scrubbing and reduce throughput during playback; activity expires after three seconds. Jobs survive closing the editor and recover queued/capture work on reopening. Cancelling preserves diagnostics and prevents publication.

This is a working prototype, not a finished NLE. Browser-to-GPU transfer currently uses PNG readback, not shared GPU textures. Source capture is a faithful **whole surface**, not automatic independent DOM layers. Native DOM clips, masks and blur stay baked into that surface; split surfaces explicitly when independent depth is required. Export runtime JavaScript and scene code are frozen, but the installed Electron binary and FFmpeg are still required. Media timing, external network resources, arbitrary shaders and app state need their scene adapter to be deterministic. Scene code is trusted project code: browser sources have reduced capabilities, but this is not a hostile-code sandbox. There is no integrated chat, audio timeline, Swift adapter, or packaged installer yet.

## Checks

```sh
npm run typecheck
npm test
npm run build
```

See [docs/architecture.md](docs/architecture.md) for contracts and [docs/verification.md](docs/verification.md) for measured checks and remaining limits.
