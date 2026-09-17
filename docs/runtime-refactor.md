# Runtime and source refactor

Tilt continues to host real browser apps and compose their output. Agents keep ordinary scene folders, executable scene code, semantic layers, the shared clock, tracks, controls and file history. No framework conversion or experimental HTML-to-canvas API is required.

## Runtime boundaries

1. **Source host:** `entry`, preview `url`, or an owned local `server` runs the original app in isolated Chromium. The source adapter controls mounting, fixture state, media and absolute time. See [hosting real web apps](source-hosting.md).
2. **Source session:** scene compilation and source lifetimes are separate. A content fingerprint covers each app's entire served directory, including lazy assets. Choreography edits keep unaffected browsers alive; source edits replace only affected apps. Replacement preparation is transactional and disposal is awaited.
3. **Frame preparation:** preview and export use `sampleSources`. A complete frame carries its requested time/revision, source status, quality, routes, layer layout, image identities and memory estimate. Shared-session sampling stays serialized; revision conflicts fail explicitly.
4. **Surface transfer:** HTTP viewers negotiate a versioned binary packet containing metadata and the original PNG bytes. Existing JSON/data-URL clients and export IPC remain compatible. Receivers acknowledge only decoded images. Reloads and independent viewers begin with their own image ownership.
5. **Compositor:** `SurfaceResources` owns decoded images and textures; `SceneEngine` separates source preparation, decode, authored scene evaluation and render submission. Three.js, arbitrary shaders, cameras and semantic layers retain their APIs. A presentation gate keeps incomplete source or scene changes off the last successful canvas, including direct inspection redraws after an error.
6. **Editor:** the timecode and timeline subscribe to a small playhead store. Frame updates do not update the entire editor component. The existing latest-request scheduler coalesces rapid seeks; paused capture and export await exact preparation.
7. **Export:** the worker freezes inputs as before and writes every PNG atomically. The default encoder streams those checkpointed PNGs into FFmpeg with backpressure, overlapping capture and encoding without removing recovery. Resume starts a fresh encoder and replays saved frames. Frame count, dimensions, frame rate and full video decode are verified before publication.

`scene.json` can select the previous sequential encoding path with `"render": { "encoding": "checkpoint" }`. The default is `"pipelined"`. Both use the same codec settings and have matching decoded-video regression evidence. Changing encoding does not change frame evaluation.

## Memory and diagnostics

`capture.memoryBudgetMB` optionally sets the scene's managed surface budget, from 64 to 8192 MiB; its default is 2048 MiB. The estimate includes retained source PNGs, browser capture backing surfaces, decoded RGBA, mipmapped source textures, the output framebuffer, DOF targets/scratch buffers, and old-plus-replacement peaks. Shared source textures and effects are deduplicated within their respective owners. Exceeding the budget reports an actionable error; it does not silently lower density or effect quality.

This is conservative accounting for Tilt-owned pixel resources, not a process RSS limit or a measurement of physical GPU allocation. Imported app JavaScript, browser internals, driver overhead and arbitrary scene-owned custom allocations remain outside its estimate. Multiple viewers have independent compositor budgets while their source host may be shared. Custom resources must still be released in the scene's `dispose` hook.

Fresh viewer context exposes `renderMetrics` and `sourceStatus`. Timings distinguish queue wait, source preparation/transfer, decode, authored scene evaluation and CPU render submission. Byte and allocation estimates explain resource use. Source status records readiness/sample stages, adapter registration, cache reuse, per-sample capture count and capture bytes. Static reuse reports zero new captures. CPU submission time and canvas submission counts are never described as completed GPU work or physical display FPS.

## Compatibility and proof

Existing `entry`/`url` scenes, the `SceneFactory` API, data-URL frame clients, layer semantics, controls, camera projections, undo/history, revision guards, exact capture and detached jobs remain supported. Real React, Vue and Svelte fixtures, managed server fixtures, arbitrary GLSL, nested/transparent layers, backward seeks, decode failures, timeout recovery and export interruption were exercised.

The measured gains and reproduction commands are in [runtime refactor verification](runtime-refactor-benchmarks.md). In the fixed reload fixture, median complete source preparation after choreography edits fell from 483.78 ms to 10.23 ms; 15 reloads caused zero browser restarts or captures. Binary transport reduced actual HTTP response bytes by 23% without changing composed pixels. Full-editor scrubbing remained refresh-bound at approximately 120 canvas submissions/s with byte-identical before/after editor screenshots. These fixture results are not universal throughput guarantees.

Experimental DOM-to-canvas/GPU transfer remains outside the compatibility path. Source capture still uses Chromium PNG readback; binary transport removes base64 overhead on the HTTP leg, not the original screenshot encoding. A faster capture backend can implement the surface boundary after it proves equivalent pixels, isolation, layer semantics and recovery. It must not restrict which framework can supply a browser app.

## Verification commands

```sh
npm run typecheck
npm test
npm run build
npm run test:layers
npm run test:transfer
node scripts/verify-source-hosting.mjs
node scripts/verify-runtime-refactor.mjs --expect-source-reuse
node scripts/verify-runtime-surfaces.mjs
node scripts/verify-depth-of-field.mjs
node scripts/verify-runtime-export.mjs --runtime /absolute/path/to/isolated/dist
node scripts/verify-editor-scrubbing.mjs candidate
```

The benchmark report documents optional temporary Vue/Svelte fixture dependencies. Harness outputs belong under `.tilt/checks` or a temporary directory and stay out of Git. The export harness creates only its own isolated jobs and verifies a worker's identity before interrupting it. The full-editor harness copies the scene into an isolated project rather than changing the user's authored scene.
