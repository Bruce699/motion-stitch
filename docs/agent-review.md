# Native visual review

`tilt_review` (MCP) and `review` (CLI) render evidence through Tilt's scene engine without controlling a viewer. No browser tab, computer-use tool, mouse or screenshot permission is required. Scene files remain the authoring interface.

```sh
node dist/cli.cjs review '{"times":[0,2,5,8],"focus":["ui/payment-surface"],"motion":{"start":2,"end":4,"fps":60}}' --scene SCENE_ID
# Edit and apply the scene, then compare at the exact same times:
node dist/cli.cjs review '{"compareTo":"REVIEW_UUID","focus":["ui/payment-surface"]}' --scene SCENE_ID
node dist/cli.cjs review-status REVIEW_UUID
```

MCP uses the same arguments plus `sceneId`. `tilt_review` returns labeled **image content blocks**, not just file paths. `tilt_review_status` is metadata-only by default. Set `includeImages:true` to retrieve images; use `artifactIndices:[4,5]` to select up to four later artifacts. Indices refer to the returned `artifacts` array. For example, fetch the completed motion filmstrip using `motion.artifactIndex`.

The CLI defaults to paths and compact context. Filesystem-capable agents can open those PNGs directly. The generic CLI `command` also exposes status options:

```sh
node dist/cli.cjs command '{"type":"review_status","id":"REVIEW_UUID","includeImages":true,"artifactIndices":[0,2]}'
```

## What one request produces

- Full-resolution PNGs at 1–12 requested absolute times, with paired sampled context. Defaults sample the opening, quarter, midpoint and final frame.
- Labeled contact sheets, four timestamps per page. Comparisons put before on the left and after on the right at identical times.
- Native-pixel detail windows for up to four `sourceId/layerId` targets. Before/after use identical output coordinates. Windows are capped at 960 pixels per edge; a large layer is intentionally only partially shown. Declare a smaller semantic layer for tiny details. Offscreen targets produce no crop.
- Effective sampled camera position, direction, FOV, focus distance, output size, actual source density and paint warnings. Paired JSON includes projected layer rectangles and engine metrics.
- Optional asynchronous motion preview: up to four seconds at 30 or 60 fps, rendered through the full scene then reduced to fit 1920×1080 and encoded as H.264. Status reports progress, output path, elapsed time and a six-frame timed filmstrip. Stills are available before the clip completes.

A review is saved under `.tilt/reviews/<uuid>/review.json`. It records the root and dependency revisions, selected camera, artifact paths, times and render context. The first four images are attached to an MCP review response; remaining artifacts can be requested by index. Motion paths are local artifacts, not public download URLs. A remote client needs its own authorized file-delivery mechanism for the MP4; image blocks work over MCP directly.

## Fidelity and lifecycle

The runtime materializes immutable scene history, bundles the exact scene code and freezes all referenced compositions. It verifies revisions again after collecting the graph. An expected `revision` rejects stale requests; open edit groups must be applied first. Read state/apply before asking for a review.

A private warm renderer uses the same `SceneEngine`, `SceneSession`, browser source host, capture density, layered source and depth-of-field implementation as preview/export. It preserves no inspection orbit or playhead state. Static source pixels are reused when possible, including across camera-only code edits. Render assets are pinned at runtime startup so rebuilding `dist` cannot change an in-flight review.

A/B requires the same composition, runtime build, output dimensions and camera selection. Baseline frames are reused when present; missing times render from the baseline's frozen graph, even after source files change. Saved images survive restarts. Comparisons across runtime builds fail explicitly because engine changes could otherwise be mistaken for scene edits.

Motion uses a second renderer and serial queue so an encode does not hold the still-review queue. It can still compete for GPU/memory; this is not a separate GPU. Runtime shutdown interrupts motion and the saved status reports failure. Review clips are not durable export jobs: use `render` for resumable final delivery. Artifacts and runtime pins are Git-ignored with `.tilt`; no automatic pruning is included yet.

Local packaged sources are required. This freezes controlled files/code, not Electron, graphics drivers, FFmpeg, network responses or nondeterministic scene code. Scene adapters still own fonts, image readiness and absolute-time behavior. Projected bounds describe top-level declared layer geometry; they do not prove visibility through occlusion, trace arbitrary shader displacement, or recursively identify nested composition internals. Clipping may be intentional in macro work. Images still require visual judgment.

## Verification

```sh
npm run typecheck
npm test
npm run build
node scripts/verify-review.mjs
```

The native harness runs without an editor viewer and checks exact PNG dimensions, native image delivery, reverse-sample pixel identity, frozen baseline re-render after source changes, stale revision/open-edit rejection, failure recovery, nested dependency changes, motion frame count and selective filmstrip retrieval. Generated evidence goes to `.tilt/checks/review/`.

Measured on this Mac during development: a warm four-frame 4K order review with four detail windows took 894 ms internally; a two-frame MCP request with image blocks took 539 ms end to end. Cold four-frame 4K review took 3.69 s. A 2.5-second 1080p/60 motion clip took 6.56 s. These are individual local observations, not latency guarantees or GPU/display timing. See `docs/friction-small-things.md` for the creative test and remaining friction.

The final macro pass also measured a 248 ms three-frame MCP response with four image blocks, and a 667 ms four-frame A/B after a code edit. Export checkpoints at 0, 4 and 8 seconds matched review pixels exactly. These measurements use 1080p output with a 5760×4000 source capture; they are not interchangeable with the 4K measurements above.
