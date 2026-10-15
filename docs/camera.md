# Camera projection

The Camera parameter group has a shared Perspective / Orthographic switch. Its settings live in `scene.json.camera`, use ordinary file history and affect both the Camera preview and exported frames. Files without this field retain their existing perspective camera. The 2D source view is independent.

```json
{
  "camera": {
    "projection": "orthographic",
    "preset": "isometric",
    "side": "right",
    "sourceId": "ui"
  }
}
```

Optional `rotation` (-180–180° heading) and `elevation` (0–90° above the UI plane) override the named stop. The Camera-mode sidebar exposes Rotation and Elevation as stepped sliders in 5° increments: clicks, drags, keyboard changes and typed values all snap to the same stops. Elevation is the actual camera elevation, not the projected edge slope in the legacy preset table below. Rotation replaces the Left/Right toggle and orbits through both orientations. Camera settings are hidden in 2D mode.

Existing named presets and custom angles remain exact until edited; opening the new controls never rounds a saved shot. The legacy preset and side fields remain supported in scene files and the API. Selecting a preset through the API removes both overrides and restores exact math; changing side restores the preset heading while preserving custom elevation.

`projection` is `perspective` or `orthographic`; `side` is `left` or `right`. The default is perspective, with the 30° stop and right orientation remembered for switching to isometric. A partial API edit uses `set_camera` with a `patch`; ordinary JSON edits are the primary agent workflow. Unknown presets and source IDs fail validation.

## Exact stops

The degree labels describe the UI's **projected edges on screen**, not Euler rotation values. Both sets of parallel edges have equal and opposite slopes. The shared renderer uses named stops with exact formulas:

| Preset       | Label | Camera elevation from the UI plane | Heading |
| ------------ | ----- | ---------------------------------- | ------- |
| `front`      | Front | 90°                                | 0°      |
| `diagonal15` | 15°   | `asin(tan(15°))` ≈ 15.542°         | ±45°    |
| `isometric`  | 30°   | `atan(1 / sqrt(2))` ≈ 35.264°      | ±45°    |
| `diagonal45` | 45°   | 90°, with 45° roll                 | ±45°    |

Only the 30° stop is true isometric: equal lengths along X, Y and Z have equal foreshortening. The 15° and 45° stops are other orthographic views. Perspective uses the scene's existing `context.camera`, including its authored position, orientation, field of view and animation.

The formulas come from the original motion-study prototype's `camera-shot.ts` and `apply-camera-shot.ts` (Admin Next commit `d59df618`), adapted from its horizontal XZ plane to Tilt's upright XY source plane. Do not round the stored elevation or independently invent another camera preset system.

## Align to the actual UI

`createLayeredSource(id, {width})` automatically registers its group as that source's camera frame. Local X and Y define the UI plane; local positive Z is depth. Each frame, the camera follows that group's world position and orientation. Parent translation and rotation therefore do not disturb the exact projected edge angles. Layer Z separation still renders normally. Independently rotated child layers have their own orientation and are not forced into alignment.

For a custom whole-surface mesh or another composition, register an equivalent frame once in the scene factory:

```ts
const plane = new THREE.Mesh(geometry, material); // local XY geometry
world.add(plane);
registerCameraFrame("ui", plane);
```

`sourceId` selects the reference frame. With multiple sources the editor shows an **Align to** dropdown. If omitted, Tilt uses the first declared source's registered frame, or world XY when that source has no registered frame. An explicitly selected source must have a registered frame. Frames must have nonzero scale and perpendicular axes; nonuniform orthogonal scale works, but sheared frames are rejected. Multiple differently oriented sources cannot all have exact isometric slopes in one camera; choose the reference intentionally.

Orthographic framing derives from the authored perspective camera's field of view, zoom and distance to the frame origin. Front matches its plane-height framing; angled views can occupy different screen bounds. Continue using meaningful authored distance/framing controls. The supplied camera is unparented. The saved orthographic setting owns viewing orientation, so authoring rotation on the perspective camera does not tilt an isometric shot.

Native compositions without a browser source can register their composition frame with `registerCameraFrame(null, object)`. Its local XY axes define the plane, and its origin defines the shared camera's focus and orbit pivot. An empty `THREE.Object3D` is enough for a moving target: register it once, then set its position from absolute time alongside `camera.position` and `camera.lookAt` in `sample`. This keeps saved Rotation/Elevation controls centered on the authored target instead of world origin. It also supplies the depth-of-field reference. A registered source frame still takes precedence when a source is selected or the first source has a frame; omitting registration retains the world XY fallback. String IDs must still name a declared source.

## Camera navigation and export

In Camera mode, drag to change saved Rotation and Elevation, Shift/right/middle-drag to change Pan X/Y, and scroll/pinch to change Zoom. Orthographic angles snap to 5°; perspective angles use 1° steps. The sidebar and gizmo reflect the same values immediately. Releasing a drag or ending a wheel gesture saves one history step. The gizmo controls elevation, rotation and roll; reset returns the saved camera to a centered front view. These values live in `scene.json.camera` (`rotation`, `elevation`, `roll`, `zoom`, `panX`, `panY`) and affect preview and export alike. Camera distance remains the scene's authored distance parameter; mouse zoom uses the separate shared Zoom control.

2D pan and zoom remain temporary inspection state. Switching modes preserves the 2D inspection without applying it to the saved camera. The hidden Fit action/keyboard shortcut resets inspection only. Agent context reports the saved camera separately from inspection.

## Authored tracking moves

Scene code can animate Three.js `camera.setViewOffset()` from absolute time to pan through the saved shot. Tilt forwards the view window into the orthographic projection as well as the perspective camera. Positive X/Y offsets track the camera right/down; angle and zoom stay unchanged. Call `clearViewOffset()` when no lens shift is needed so backward seeks do not retain a previous offset. The order scene exposes Drift right/down as fractions of the output frame and eases the move over its settle time.

## Depth of field

Camera has a **Depth of field** Off/On control, off by default. Turning it on reveals only **Focus plane** and **Blur**. Both projections use the same effect; 2D source view bypasses it. Values live in `scene.json.camera.depthOfField`, participate in history, and are frozen into exports:

```json
"depthOfField": { "enabled": false, "focusPlane": 0, "blur": 0.35 }
```

Focus plane is a signed offset in scene units from a camera-facing plane through the aligned source's registered origin (world origin when no frame is registered). Zero focuses that plane. Positive moves it toward the camera; negative moves it away. It follows the source origin and current camera pose, including camera animation, without persisting viewer inspection. The resulting distance is clamped to the camera's near/far range. The slider spans -10 to 10 and expands to display larger file-authored values, supported up to ±1000. Blur is 0–1. One scene unit from focus reaches the selected blur cap, with a narrow smooth transition around the sharp plane. Tilt's orthographic effect is an artistic depth blur, not a physical lens simulation.

`set_camera` accepts nested partial patches, for example `{ "depthOfField": { "enabled": true } }`. Switching off retains focus and blur. Missing settings mean off; opening an old scene does not rewrite it. Reuse these shared settings rather than adding scene parameters with the same purpose.

Focus plane and Blur preview locally throughout a slider gesture. The shared latest-frame scheduler runs authored scene code with the draft values, while a paused camera edit can reuse browser surfaces already prepared at exactly that time. This also works for controlled sources; it does not change their sampling policy. Changed time, source/capture contracts, failures and explicit invalidation require fresh preparation. Playback and export retain normal source sampling. A drag saves its final value as one history step, and unfinished drafts are never acknowledged as a saved file revision. There is no gesture-status chip or reduced-quality blur mode.

Normal textured `MeshBasicMaterial` planes, including the default surfaces made by `createLayeredSource`, use **surface depth of field**. It filters each original texture's color and alpha together in linear, premultiplied RGBA before compositing layers. Blurred letters therefore retain letter-shaped coverage; another layer cannot stamp a rectangular hole into their blur. Padded textures and expanded geometry allow blur outside the original bounds. Parallel tilted layers are ordered by plane offsets, preserving the base/child relationship even when their centers have different camera depths.

Each texture gets an eight-level Gaussian pyramid, rebuilt only when its pixels or dimensions change. Time, camera motion, focus, blur, output size and transforms reuse those textures. Focus is per-pixel camera depth, so an angled card can cross the focus plane. The sharp original stays available, and radius scales with output height for consistent preview/export size. This shared path contains no Admin Next selectors, layer IDs or animation timings.

Custom shaders, non-plane geometry, custom UV transforms, alpha maps and other unsupported materials retain the general post-process path. It draws the actual scene color and depth into a multisampled target and chooses from a six-level Gaussian pyramid. Its single depth per pixel remains approximate around translucent overlaps. Arbitrary intersecting 3D surfaces also exceed what transparent surface sorting can represent. The new UI result does not establish that these general 3D lens cases are solved. Neither path uses temporal accumulation or different export quality.

Effect textures allocate only when enabled with nonzero blur and release when disabled, in 2D, or on engine disposal. While enabled, crossing zero retains an already warm cache to avoid rebuilding it on the next positive value; retained bytes remain in the memory budget. Zero and disabled use the exact original direct render. Surface-cache memory follows captured texture size; the post-process fallback's targets follow output area.

For sources explicitly declared `sampling: "static"`, the renderer reuses prepared pixels, layer layout and routes without another browser/HTTP sample. Capture-density or source-contract changes invalidate that cache; file/code changes replace the engine. Never mark changing browser content static to obtain this optimization. Controlled sources still sample at their requested absolute times. Rapid seeks replace the pending request and allow completed frames to display, avoiding starvation when sampling is slower than pointer input. Explicit scene/reload/capture invalidation still rejects obsolete work.

Run `npm test`, `node scripts/verify-depth-of-field.mjs`, `node scripts/verify-scrubbing.mjs <label>` and, after a build, `node scripts/verify-editor-scrubbing.mjs <label>`. Native checks cover independently composited overlapping letters, transparent gaps, blur beyond glyph bounds, tilted layer order, cache reuse/invalidation, both projections, backward sampling, resize, exact off/zero-blur output, GPU resource release and GPU timer queries. Real-scene and full-editor benchmarks exercise forward/reverse scrubbing. Results and proof boundaries are in `docs/performance-review.md`; generated outputs stay under `.tilt`.

The [live slider benchmark](live-depth-of-field-benchmarks.md) measures actual held-gesture shader updates and completed GPU commands, with final-pixel, undo/redo, failed-save and mid-drag reload checks. `node scripts/verify-camera-sampling.mjs` checks the prepared-source boundary and custom asynchronous scene code. `node scripts/verify-page-exit.mjs` checks graceful final-value persistence. `TILT_EXPORT_DOF=1 node scripts/verify-runtime-export.mjs --runtime /absolute/path/to/isolated/dist` checks DOF-enabled detached export recovery.
