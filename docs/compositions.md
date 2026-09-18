# Projects and compositions

A project is a local folder containing source files, assets and compositions, usually a Git checkout. The running Tilt runtime is scoped to that folder. GitHub is not required. The project panel lists the compositions in that project. Create opens a blank composition; opening a composition does not duplicate its files.

A composition produces an image at an absolute time. It may contain browser sources, authored Three.js content and other compositions. The final edit is an ordinary composition. For compatibility, compositions still use `scenes/<id>/scene.json` and `scene.ts`; existing files are not moved or rewritten just by opening them. Internal CLI `sceneId` fields retain their established names.

## References and time

Drag a composition from the project panel into the timeline, or use its Insert button. The insertion is at the playhead. It creates a clip, a reference to the source composition. The clip lives in the containing composition's `clips` array:

```json
{
  "id": "dashboard-wide",
  "compositionId": "dashboard",
  "label": "Dashboard",
  "start": 0,
  "end": 1,
  "sourceIn": 1,
  "speed": 1,
  "cameraId": "main",
  "overrides": {},
  "bindings": {}
}
```

`sourceTime = sourceIn + (parentTime - start) * speed`. There is one advancing clock. Every nested time is calculated from it, including after backward seeks. Visibility is start-inclusive, end-exclusive, so the frame at a cut belongs to its right side. A composition's endpoint is outside a clip ending there; the last exported frame is before that endpoint.

Moving a clip preserves its source window. Trimming its left edge advances `sourceIn`; trimming its right edge changes duration. Neither operation changes speed. Split creates two references with independent controls and continuous source time. Changing the second source window creates a time jump deliberately. Select a clip for source range, speed, camera, transform and exposed controls. Open composition enters its shared source, and the breadcrumb returns to its containing edit. Editing that source affects all uses.

Clip and animation timings have different meanings. Animation-group resizing still retimes choreography; clip resizing trims footage. Clip IDs and animation-track IDs must be unique within the containing document. Clips are separate from animation tracks so existing scene code that samples `document.tracks` is unchanged.

## Cameras

Every composition has an implicit `main` camera backed by the existing `camera` field. `cameraName` optionally renames it. Additional cameras are declared in `cameras`, each with `id`, `name` and `settings` using the same shared camera contract. `defaultCameraId` chooses output, defaulting to `main`.

The preview camera is viewer state. Changing it preserves time and does not change the output camera. Use for output explicitly saves the default. A clip may specify `cameraId`, or omit it to follow the source's default. Camera edits, clip choices and defaults use the same file history as all other authored settings.

The factory receives the same `context.camera`; `sample(frame)` additionally receives `frame.cameraId`. Scene code can use that ID to sample independent camera motion. Create meaningful camera animation tracks with targets such as `{"kind":"camera","id":"detail"}`. Read their current Start/End from `frame.document`; do not hide camera moves behind constants. Camera and content both use the composition's source time. Switching views or splitting a clip never starts another clock or restarts a move.

```ts
sample({ time, cameraId, document }) {
  const id = cameraId === "detail" ? "detail-drift" : "wide-drift";
  const track = document.tracks.find(track => track.id === id)!;
  const t = motion.clamp((time - track.start) / (track.end - track.start));
  camera.position.set(t * (cameraId === "detail" ? 0.4 : 0.1), 0, 7);
  camera.lookAt(0, 0, 0);
}
```

These are animated views of one authored composition, not duplicated scene files. Legacy code that does not inspect `cameraId` continues to animate every view using its existing camera move.

## Exposed controls

`exposedParameters` lists parameter keys available to containing compositions. The Expose action beside a control edits this list. Definitions and defaults stay in `parameters`; reuse the established shared control vocabulary.

A clip's `overrides` map supplies independent values for exposed controls. Reset removes an override and resumes following the source. Undeclared, unexposed or out-of-range values fail validation. Browser adapters receive the resolved values as well as scene code. Controlled-source caching includes parameters, so two uses at the same time with different controls do not share incorrect pixels.

Expose on a nested control copies its definition to the containing composition, adds it to that composition's `exposedParameters`, and creates a `bindings` entry mapping the child parameter key to the parent parameter key. This explicitly passes controls through another nesting level. A binding takes its value from the current parent sample, including any overrides applied to that parent. Reset removes the clip binding. The created parent control remains an ordinary editable parameter.

## Rendering boundary

Nested compositions render to GPU textures through the same Three.js renderer as their parent. Their internal cameras photograph their own contents. The parent sees a rectangular rendered surface; its camera cannot reach into the child's 3D world. The surface fits the parent's frame preserving aspect ratio, with optional clip `position`, uniform `scale` and `opacity`. Later clips in the file draw above earlier clips; overlapping surfaces can form transitions. No camera-switching timeline, 3D-world sharing, or separate reel type is introduced.

The factory receives `context.clips`, a map from clip IDs to their meshes. The runtime samples children and restores clip timing/transforms before invoking parent scene code, so authored parent motion may transform these surfaces using existing animation tracks. Inactive child engines release their GPU resources; shared browser sessions remain owned by the project runtime. Dependencies use the same last-successful-frame reload path. A child-file revision reloads containing previews. Missing references, indirect cycles, missing cameras and source windows beyond a child's duration fail explicitly.

Each child render target follows the enclosing output/preview resolution, subject to the existing canvas limits. Browser layout remains separate from raster density. Nested allocations share the root composition's managed memory budget. The intermediate render targets use linear half-float color; display conversion is applied by the final render. See `docs/resolution.md` for capture limits.

Export freezes the entire reachable composition graph: each document, module and local browser source, plus the runtime. Every dependency must be exportable and have no unfinished edit. Subsequent source edits do not change a queued/resumed render. External live sources remain preview-only, including when nested.

## Verification

`npm run typecheck` and `npm test` cover timing, override isolation, forwarding, camera defaults and graph validation alongside the established tests. After building, `node scripts/verify-compositions.mjs` runs an isolated real Chromium editor and export workflow. It saves captures, an editor screenshot, a report and its video under `.tilt/checks/compositions/`. It does not edit the user's compositions.
