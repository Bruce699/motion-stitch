# Runtime refactor verification

Measured on 17 September 2026 using an Apple M2 Max with 64 GiB RAM, macOS arm64, Electron 41.10.7, Chromium 146.0.7680.216, and Electron's Node 24.18.0. These are local fixture results, not universal performance promises. All harnesses start isolated Electron processes and temporary scene folders. They do not connect to the user's runtime or edit user scenes.

## Source lifetime baseline and refactor

`scripts/verify-runtime-refactor.mjs` runs the same harness against a selected source checkout. The baseline checkout was frozen before this refactor. Both runs used three independent scene trials, each with two 320 × 240 browser sources at density 1, twelve unchanged samples, four changing/backward samples, and five edits to composition code. The first source is a real React 19 app with nested extracted layers; the second uses native DOM, canvas, root-relative SVG assets, and a same-origin iframe. Output settings are 640 × 480.

The measured endpoint is awaited `SceneSession.frame`. Choreography timing starts after the file journal has observed the edit and includes compilation, source reconciliation, browser sampling, PNG capture when needed, and layer metadata. It excludes the viewer compositor, network transfer, display presentation, and final video encoding. These are not FPS measurements.

| Measure                                        |  Baseline |  Refactor |               Samples |
| ---------------------------------------------- | --------: | --------: | --------------------: |
| Composition reload, median                     | 483.78 ms |  10.23 ms | 15 per implementation |
| Composition reload, p95                        | 488.58 ms |  14.48 ms | 15 per implementation |
| Browser restarts during composition reloads    |        30 |         0 |            15 reloads |
| PNG captures during composition reloads        |        75 |         0 |            15 reloads |
| Initial complete source preparation, median    | 476.86 ms | 467.76 ms |  3 per implementation |
| Unchanged sample, median                       |   0.18 ms |   0.30 ms | 36 per implementation |
| Changing layered React sample, median          | 298.16 ms | 298.22 ms | 12 per implementation |
| Browsers restarted after one app asset changes |         2 |         1 |  3 per implementation |
| PNG captures after one app asset changes       |         5 |         1 |  3 per implementation |

The demonstrated improvement is composition reload latency (47.3× in this fixture) and avoiding unnecessary browser/capture work. Initial startup and changing-source capture are essentially unchanged. Submillisecond unchanged-source measurements are noisy; there is no claimed gain there.

Every compared reload and backward seek retained identical decoded raster hashes. The harness also verifies app-origin isolation, real framework commits, layer capture, asset invalidation, browser disposal, and preservation of successful browser resources when a replacement's compilation or startup fails. Correcting each failure recovers the expected pixels.

Local artifacts: `.tilt/checks/runtime-refactor-baseline-expanded/results.json` and `.tilt/checks/runtime-refactor-final/results.json`. Each contains raw observations, denominators, runtime information, hashes, and resource counts. The harness retains PNGs for visual inspection.

Reproduce against two checkouts:

```sh
node scripts/verify-runtime-refactor.mjs --source-root /absolute/path/to/baseline --output .tilt/checks/runtime-refactor-baseline
node scripts/verify-runtime-refactor.mjs --expect-source-reuse --output .tilt/checks/runtime-refactor-current
```

The baseline directory must include its original source plus access to compatible `node_modules`. The harness and React fixture are identical in both runs. Trial counts can be changed through `TILT_REFACTOR_TRIALS`, `TILT_REFACTOR_WARM_SAMPLES`, and `TILT_REFACTOR_RELOAD_SAMPLES`.

## Binary surface transfer and renderer parity

`node scripts/verify-runtime-surfaces.mjs` runs the actual Three.js `SceneEngine`, real Chromium browser source, and HTTP transport. JSON and binary variants use the same PNG bytes, same receiver acknowledgement policy, same density, same animated layered composition, and the same timestamp sequence. Their order alternates between trials.

Across three trials of eight timed frames per transport, each variant transmitted 16 changed images per trial. JSON transferred 128,348 response bytes per trial; binary transferred 98,807, a **23.0% reduction** including metadata. All sampled composed PNG hashes match, including backward seeks. Capture dominates the mixed changed/unchanged sequence, so no meaningful end-to-end latency or display-FPS improvement is claimed for this small fixture.

The regression checks additionally verify:

- Independent receivers request and acknowledge their own surfaces.
- A real PNG decode failure rejects the frame without changing the last successful canvas.
- A direct inspection redraw after failure cannot expose partially accepted surfaces.
- Successfully decoded surfaces remain acknowledged; only failed/unprocessed surfaces retransmit on retry.
- Recovery matches a fresh independent receiver.
- A live density change from 2 to 3 preserves texture object identity and produces the same composed image as a fresh renderer at density 3.
- The resulting source is 960 × 720, output is 640 × 480, and reported surface memory remains inside the declared budget.

Artifacts: `.tilt/checks/runtime-surfaces/results.json` and `composed.png`. Timing includes CPU work through WebGL submission; it does not measure completed GPU work or monitor presentation. Surface memory is an estimate for owned decoded images and GPU textures, not total browser/driver process memory.

## Framework compatibility evidence

The source-lifetime and renderer harnesses use real React, with `flushSync` establishing the committed state before capture. `verify-framework-sources` additionally built Vue 3.5.42 and Svelte 5.57.0 from their official npm packages in a temporary dependency directory. Both mounted production bundles, awaited their framework's commit (`nextTick` / `tick`), captured density-2 surfaces and semantic layers, changed time, and reproduced exact backward-seek raster hashes. Equivalent Vue and Svelte content produced identical pixels and layer bounds. PNGs were inspected.

```sh
npm install --prefix /tmp/tilt-frameworks --no-save vue svelte
node scripts/verify-framework-sources.mjs --dependencies /tmp/tilt-frameworks
```

These optional fixture packages do not change Tilt's repository dependencies. For an exact rerun, pin the tested package versions above. Artifacts are under `.tilt/checks/framework-sources`. This proves the tested adapters, not every framework plugin, server framework, live backend, authentication flow, or future framework version. Managed server/export verification is covered by the source-hosting suite.

## Existing regression harnesses

The layer and frame-transfer scripts now consume fixed test fixtures instead of the mutable `scenes/interface` choreography/document. This prevents a creative edit from silently changing the test contract.

- `npm run test:layers` passed native density 1/2/4 and React density 3, nesting, clipping, transparent padding, visibility, optional remounts, selectors, route changes, and recovery after an injected capture failure. Mean reconstructed-channel error was 0.00056/255; no pixel exceeded the test's error threshold.
- `TILT_BENCH_DENSITIES=3,4 TILT_BENCH_FRAMES=12 TILT_BENCH_TRIALS=2 npm run test:transfer` passed full/delta composed parity, unchanged captures, changing pixels, backward seeks, independent receivers, partial decode recovery, hidden-layer restoration, and live density-4 versus fresh-renderer equality. Its final source was 4000 × 2560 and output 1440 × 900.

The old full-versus-delta comparison is a regression check for an existing optimization; its gains are not attributed to this refactor.

## Detached export and recovery

`scripts/verify-runtime-export.mjs --runtime /absolute/path/to/isolated/dist` creates a temporary project and submits actual detached render jobs. It freezes source and runtime, starts the real coordinator and worker, and renders a two-second, 30 fps, 320 × 240 scene with controlled browser DOM and an authored GLSL shader.

The check passed idempotent concurrent submission, verified-worker interruption at frame 4, resume, cancellation at frame 9 without publishing a video, and immediate resume to completion. Every one of the 60 resumed/pipelined PNG frames matched a fresh checkpoint-mode export. Both MP4s decoded to identical raw video streams; FFprobe reported 60 frames at 320 × 240 and 30 fps. The worker's own final full-decode verification also completed. Saved checkpoints were preserved through interruption and cancellation.

Artifacts: `.tilt/checks/runtime-export/results.json`, `pipelined.mp4`, `checkpoint.mp4`, and `first.png`. This is a correctness/recovery check, not an export throughput comparison. The harness starts no editor runtime and only signals a worker after verifying that its command names this test's exact job and temporary project.

## Complete editor and final integration

The full editor harness used the same actual imported interface and authored camera in isolated copies, at a 1629 × 1018 canvas. Each version received 3600 scrub inputs over six five-second trials, half with DOF enabled. The quiet baseline averaged 119.91 submissions/s without DOF and 119.99 with DOF. The first refactor run averaged 120.05 and 119.99 respectively. Both completed the requested final time without errors. These refresh-bound results demonstrate sustained scrub parity, not a throughput gain.

The final integration run after memory preflight changes also sustained approximately 120 submissions/s across all six trials. Its p95 submission gaps were 9.7–10.3 ms, compared with 9.1–9.4 ms in the quiet baseline; this small timing difference is recorded rather than presented as an improvement. All three final editor screenshots—baseline, initial refactor and final integration—were byte-identical (SHA-256 `383ad97ebefa09e2220d3c8b082d60668baefefda71863cace6fc14dbd08db3f`).

Artifacts: `.tilt/checks/editor-scrubbing/comparison.json` and the `refactor-before-quiet`, `refactor-after`, and `refactor-final` subdirectories. No authored scene files were modified by these checks. This records actual main-canvas draw submissions and rendered pixels, not completed physical monitor presentation.

## Review-driven corrections

Independent review and native harnesses exposed two failure paths during implementation. Retiring a browser on every sampling error broke settled capture/selector retry; retirement was restricted to unsettled timeout work, with replacement managed by source lifecycle. Incremental image acknowledgements could otherwise leak a mixed frame through direct inspection redraw after a decode failure; presentation is now gated until complete preparation succeeds. Both paths have explicit regression evidence above.

The export check also reproduced an immediate cancel/resume race: a cancelled worker was still cleaning up when resume requeued the job, allowing its coordinator to overwrite the fresh queued state as interrupted. The coordinator now preserves that queued retry. The original immediate-resume sequence then passed without adding a delay to hide the race.

## Final build and running app

The final integrated checkout passed all 111 automated tests, TypeScript checking, the production build and whitespace checks. The agent-interface native harness passed ten workflows, including two existing viewers recovering after a real runtime restart without reloading, retaining their timeline/selection and accepting a targeted seek. Authentication recovery retries only an explicit rejection made before command execution; ambiguous network failures are not replayed.

After rebuilding and restarting the shared runtime, the actual imported scene rendered successfully at `https://tilt.video`. Fresh viewer acknowledgement reported matching document/presented revisions, requested and presented time 0, ready source status and no error. The rendered editor was inspected. No authored scene or camera changes were needed for this refactor.
