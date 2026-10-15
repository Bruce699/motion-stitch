# Using Motion Stitch

Motion Stitch is this repository's motion workspace, built on Tilt. The app, runtime commands, and file formats still use the **Tilt** name. Projects live in local folders; compositions combine browser UI, animation code, cameras, and reusable compositions.

## Install and start

You need **Node.js 24 or newer**, **npm**, **Git**, and **FFmpeg/FFprobe** on your PATH. macOS is the primary tested platform. Electron installs with the project dependencies; you do not need to install it separately.

On macOS with Homebrew:

```sh
brew install node@24 ffmpeg
```

Follow Homebrew's PATH instructions or use a Node version manager if `node --version` does not report 24 or newer. Then install and launch:

```sh
git clone https://github.com/Bruce699/motion-stitch.git
cd motion-stitch
npm ci
npm start -- --direct --browser
```

Open the localhost URL printed in the terminal. Its port may change between launches. The browser displays the editor, while Electron runs locally to capture sources and render video. Keep the launching terminal open.

To use an Electron editor window instead:

```sh
npm start -- --direct
```

For an included example, run this from the repository root:

```sh
npm run demo:loop-search
```

This opens the bundled [Loop Search project](../examples/loop-search/README.md) in Electron. Its browser build is included and needs no account or API key. Press Play or Space to watch it.

## Open or create a project

Use the **Home** button to open Projects. Choose **Open folder** for an existing project or **New project** to create one. These folder dialogs appear on the computer running the Electron backend, even when you are using the browser viewer. Recent projects appear on the same page.

You can also launch a specific project from the repository root:

```sh
npm start -- --direct --browser --project "/absolute/path/to/project"
```

A project is separate from the installed app. Keep its folder when updating or replacing the app checkout. An external project is not automatically included when you clone this repository.

## Playground: arrange and compare

The top **Playground / Library** pill switches between the two project views. Playground has a preview stage above a clip canvas. Drag their divider to give either area more space.

| Action                                                              | Result                                                                                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Click a clip                                                        | Select it and play its composition.                                                                          |
| Shift-click another clip or connected sequence                      | Add or remove a comparison preview, up to four at once.                                                      |
| Hover a clip                                                        | Show a small floating preview. Connected clips have adjacent preview windows.                                |
| Drag a clip                                                         | Move it around the canvas.                                                                                   |
| Bring a clip's end near another clip's start and release            | Snap them into a sequence that plays continuously in one main preview.                                       |
| Select a connected sequence, then use **Disconnect selected clips** | Break its connections.                                                                                       |
| Use **Reset canvas layout** at the bottom left                      | Disconnect every clip, arrange scene families side by side with versions stacked, and fit all clips in view. |
| Use **− / +** at the bottom left                                    | Zoom the clip canvas out or in.                                                                              |
| Click **Open editor** on a main preview                             | Edit the composition currently shown there.                                                                  |

The playback row below the previews provides Play/Pause, playback speed, and a scrubber. Use it to compare selected compositions at the same elapsed time. Selecting a connected sequence plays its clips in order.

Canvas connections organize previews. To create a renderable edit from several compositions, insert references into a composition's editor timeline as described below.

## Library: browse and filter

Library displays compositions as thumbnail cards. Hover a card to play its preview. **Double-click** a card to open the editor; a focused card also opens with **Enter**.

- **All scenes** filters by the scene portion of a composition's name.
- **All versions** filters by its version portion. Choosing a scene narrows the available versions.
- The search field searches names and available keywords.
- The columns slider selects between one and eight columns.

Use the naming format **`scene - version`**, with spaces around the hyphen. For example:

| Composition name        | Scene filter    | Version filter    |
| ----------------------- | --------------- | ----------------- |
| `question - typing`     | `question`      | `typing`          |
| `question - zoom`       | `question`      | `zoom`            |
| `icon draw out - group` | `icon draw out` | `group`           |
| `ui reveal`             | `ui reveal`     | No version suffix |

Versions are names, not separate numbered badges. The same naming also determines which compositions stack together when you reset the Playground canvas.

The sun/moon button at the top right of Playground and Library switches the workspace theme. This does not change composition colors or exported video.

## Edit a composition

The editor has a composition list on the left, a viewer in the center, an inspector on the right, and a timeline below. The header buttons show or hide the side panels; the timeline has its own collapse/expand control. Use **Back to project** to return to Playground or Library.

### Names and output settings

Double-click the composition title to rename it. The adjacent **Composition settings** button contains resolution, duration, frame rate, background, and UI capture density. New compositions default to 60 fps; 30 fps is also available.

Output resolution sets the final frame size. **UI density** controls raster detail for captured browser UI without changing its CSS layout. Increase it for close-up shots when necessary; higher values use more memory. See [resolution and sharpness](resolution.md).

### Playback and timing

Press **Space** or Play to play/pause. Use the arrow keys to step frames, **Home** to go to the start, or drag the timeline ruler to scrub.

Select a named animation track to reveal its timing and related controls in the inspector. Move a track to change when it starts; resize it to change its duration. Expand a group for individual actions. Moving or resizing a group moves or retimes its children together. The controls available depend on what that composition's author exposed.

Pinch or Option/Alt-wheel over the ruler to zoom its time range; scroll sideways to pan. Double-click the ruler to fit the composition. With the ruler focused, **+ / −** zoom and **0** fits.

### Viewer and camera

Scenes with browser sources offer **2D** and **Camera** views. Native compositions may show a Camera view or their named authored cameras instead. The 2D view is useful for inspecting the source; Camera shows the composition through its camera.

The inspector contains shared camera settings and composition-specific parameters. A camera selection for preview does not automatically change the output camera: use **Use for output** when you want that saved as the composition's default.

In Camera view, drag to orbit; Shift-drag, right-drag, or middle-drag pans, and scroll or pinch zooms. These gestures update the selected camera’s saved pose and affect its rendered output. Use Undo to reverse a camera change. In 2D, panning and zooming inspect the source without changing the authored camera. Use animation tracks for camera movement over time.

### Create and combine compositions

Use **+ / New composition** in the left panel to create a blank composition. Its artwork and motion are authored in project files, while the editor exposes their declared settings and timing.

To build an edit from existing compositions, open the containing composition, place the playhead, then use another composition's **Insert** button or drag it from the left panel into the timeline. This creates a reference rather than duplicating its source.

Select that reference to adjust source range, speed, camera, transform, and exposed controls. Moving it changes its placement; resizing trims its source window. This differs from resizing an animation group, which retimes choreography. Editing the referenced source updates every use. See [projects and compositions](compositions.md) for the full contract.

## Saving and undo

Editor settings save to project files automatically. There is no separate save step for ordinary parameter or timing edits. External file changes are watched and reloaded; the viewer keeps the last successful frame while the replacement prepares.

Use the header **Undo / Redo** buttons or **Cmd/Ctrl-Z / Cmd/Ctrl-Shift-Z**. A slider drag becomes one undo step. Scene history includes settings, code, and local assets, and survives restarts. Keep a separate Git backup of your project; local undo history is not a substitute for it.

## Render a video

1. Open the composition you want to export.
2. Check its duration, resolution, frame rate, and output camera.
3. Click **Render**. The runtime prepares a snapshot, captures frames, and encodes an MP4.
4. Open **Render progress** to inspect the job. A completed job offers **Show video** on the host computer.

Videos are written to the active project's **`exports/`** folder. Queued renders use the saved snapshot, so later scene edits do not change that job. Closing the editor does not stop the runtime or its render queue. Failed or interrupted jobs can be resumed from the render list.

For reliable export, keep source builds and assets local. Live external URLs are preview inputs and cannot be frozen as an export dependency. See [source hosting](source-hosting.md).

## File and agent workflow

A typical composition uses these files:

```text
your-project/
  scenes/
    your-composition/
      scene.json          # Name, size, duration, sources, controls, tracks
      scene.ts            # Executable motion sampled at an absolute time
      source/             # Browser UI, assets, and its adapter if needed
  exports/                # Rendered videos; keep out of Git
  .tilt/                  # Local runtime/history/cache; keep out of Git
```

To create bespoke scenes with an agent, point it at [AGENTS.md](../AGENTS.md) and the [scene-authoring skill](../.agents/skills/scene-authoring/SKILL.md). Author meaningful controls in `scene.json.parameters` and editable motion groups in `scene.json.tracks`; scene code reads those values to draw each frame. See [parameter controls](parameters.md) and [animation groups](animation-groups.md).

The CLI uses the same runtime as the editor. Run it from the repository root for its default project, or set `TILT_PROJECT` to the absolute project folder:

```sh
TILT_PROJECT="/absolute/path/to/project" npm run cli -- state
TILT_PROJECT="/absolute/path/to/project" npm run cli -- jobs
TILT_PROJECT="/absolute/path/to/project" npm run cli -- stop
```

See [the agent interface](agent-interface.md) for scene targeting, coordinated file edits, review captures, and history commands.

## Local access and troubleshooting

- **The page no longer opens:** restart with the same `--project` path and use the URL printed by that launch. An old tab may point to a previous port.
- **The editor window closed:** the backend may still be running. Launching the same project again reuses its runtime. Closing a browser tab also leaves the backend running.
- **Stop the runtime:** press Ctrl+C in its launching terminal, or run `npm run cli -- stop` for the relevant project.
- **Render fails immediately:** confirm `ffmpeg -version` and `ffprobe -version` work, then inspect the render job's error.
- **Preview stays on the previous image:** the new scene may still be preparing or may have an error. Inspect the error indicator and fix the scene before rendering.
- **Phone cannot open localhost:** `127.0.0.1` on a phone refers to the phone itself. This app is local, not a hosted service. Follow [temporary phone access](phone-access.md) to set up the protected proxy and an HTTPS tunnel; keep the host computer awake. Never publish a runtime token or expose the raw backend.

Optional local HTTPS setup at `https://tilt.video` is documented in the [README](../README.md#optional-local-https-address). Direct-port startup above does not require it.
