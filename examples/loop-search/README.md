# Loop Search

A self-contained Tilt example using the real React search component imported from Loop. It includes a 15-second 2D sequence, the original component interactions, editable timing groups and independent UI layers for camera work. The gallery grid is removed.

## Run in Electron

From the Tilt repository root:

```sh
npm ci
npm run demo:loop-search
```

Tilt builds and opens this project in its desktop Electron window. Press Space or Play. Select **2D** for direct browser playback or **Camera** for the layered composition. Node.js 24+ and FFmpeg/FFprobe on PATH are required; see the [root setup instructions](../../README.md#run-the-electron-app).

The packaged browser assets are included. Running the demo requires no source build, Loop login, API key or network data source. Runtime caches and exports stay in this example's ignored `.tilt/` and `exports/` folders.

## Sequence and controls

| Time | Action |
| --- | --- |
| 0–2.75s | Idle bar appears; macOS cursor enters and opens recent searches |
| 2.75–5.6s | Color wheel opens the palette; cursor selects red |
| 5.6–9.25s | “architecture” types in, suggestions appear, query becomes a chip |
| 9.25–12.2s | Image-search panel opens and closes |
| 12.2–15s | Filters clear, cursor exits, idle bar settles |

The five timeline groups expand into individual cursor and component actions. Track intervals drive the source animation. Query, selected color and cursor size are saved inspector controls. **Playback → Single state** exposes idle, recent, suggestions, palette, image, applied query/color, empty, loading and error poses. Loading/error are fixtures for animation.

Bar, input, icons, chip, color, clear control and panel have individual transforms. The saved **Camera study** retains the perspective setup; the main camera is front orthographic. The composition is 1920×1080 at 30 fps. The source layout is 1280×720 with 2× capture density.

## Edit the React source

From this example folder:

```sh
npm ci
npm run typecheck
npm run build
```

Edit `scenes/composition-1-23d9a75c/app/`, then rebuild. `scene.json` contains the controls, layer declarations, cameras and timeline. `scene.ts` places the captured layers. Use Tilt edit groups for coordinated scene/source changes.

```sh
npm run preview
```

Open the printed localhost URL to interact with the original component directly. Cmd/Ctrl+K opens search; Escape and outside clicks dismiss panels. History is session-only. Choosing a local image extracts a dominant color; it does not upload the image or produce gallery results. These manual interactions are not recorded onto the timeline.

## Source and fidelity

Imported from Loop project `5b0a6634-927d-463e-b94d-8ab85691c572`, snapshot `8acc0973-52a6-43d7-b46e-290008a831b5`. The four Input frames share the same component; this uses its original standalone React extraction, `packages/savee-search-input/src/`, version `0.1.0-rc.2`.

Component styling, icons, spring settings and request handling are preserved. The host restores the original 1.2× sizing, seeded history and local suggestion titles. The dark backdrop is baked into the material so independently lifted layers do not depend on backdrop blur. The cursor is the macOS AppKit `NSCursor.arrow` asset exported at 4× with its native hotspot. Absolute-time sampling supports forward and backward seeking; direct 2D presentation omits capture-only paint waits.
