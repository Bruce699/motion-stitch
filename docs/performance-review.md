# Admin Next review — 17 September 2026

Reviewed `jaytel0/admin-next` commit `262df518a95cf02b4c67707fa349d549a09c7b67` (Harden animation lab playback and rendering), against Tilt `f33ed8c`. Three independent reviews covered playback, source capture, and the render queue. The original checkout was left unchanged.

The prototype's report distinguishes reliability from speed: live animation callback cadence is essentially unchanged, while Orders fulfilled reduces its specialized source-update work by about 21%. These are its recorded results, not measurements of Tilt.

## Changes adopted

- Release export priority when a viewer is hidden, and restore it when visible playback returns. Keep a visible but unfocused viewer eligible: Codex chat or a terminal can have focus beside the canvas. One ordered activity sender prevents a late play request from overwriting a newer idle release. Hidden viewers do not renew play or scrub leases. The worker's existing three-second expiry still handles a lost viewer.
- Extend Tilt's existing source cache across the transport boundary. Each compositor acknowledges the image versions it has decoded and installed. Cached camera-only frames then send current metadata without repeating their PNGs. This is a Tilt-specific application of avoiding unchanged work, rather than copied Admin Next renderer code. Full frames remain available for new receivers and older clients. Resolution, PNG capture, texture filtering and scene choreography are unchanged.

## Changes not imported

Tilt already has a warm source session, one clock, readiness gates, latest-request scheduling, previous-frame retention, resource disposal, frozen render snapshots, atomic PNG checkpoints, resume/adoption, verified video publication, activity expiry and non-overlapping status polling. Importing the prototype's Dial Kit clock patch or second queue would duplicate those mechanisms.

Admin Next's compact job summaries address responses containing frozen scene data. Tilt's eleven existing job records serialize to only 5,583 bytes; a read-only measurement found a warm list/read/sort median of about 0.79 ms. Pagination or a new summary store has no demonstrated meaningful gain at this scale.

The Orders-specific geometry/paint guards and compiled row-arrival timings do not belong in Tilt's general renderer. Further per-scene optimizations need their own profile. Process-identity checks, cancellation/publication coordination and encoder-version checks are reliability follow-ups, not evidence of normal rendering speed improvements.

The playback review also identified a separate candidate race: preparation samples the time saved before its await, then restores that time even if a newer seek arrived during preparation. It needs a delayed-preparation/latest-seek integration test and a focused fix; this performance change does not claim to resolve it.

## Measured hidden-viewer export

Measured locally on an Apple M2 Max, 64 GiB RAM, macOS arm64, Electron 41.10.7. The prototype's M4 Pro timings above are not directly comparable to this machine.

The isolated activity comparison uses the same immutable capture/runtime code on both sides; only the viewer's activity reporting changes. The real viewer is playing and then hidden. Each export is 24 frames at 1440×900, 30 fps, with Auto 3× UI density. Worker time includes startup, capture, encoding and full-decode verification, excluding submission/queue time.

| Run | Before | After |
| --- | ---: | ---: |
| 1 | 34.841 s | 21.891 s |
| 2 | 34.302 s | 21.952 s |
| 3 | 34.411 s | 21.699 s |
| Median | **34.411 s** | **21.891 s** |

Median savings: **12.520 seconds / 36.4%**. Before, the hidden viewer renews `play` and the worker adds 500 ms per frame. After, hiding sends `idle` and stops renewals. Every lossless frame's SHA-256 matches across all six exports. This is a removal of unnecessary background waiting, not a renderer FPS multiplier.

The visible-but-unfocused control still reports `play` and takes 33.474 seconds, preserving playback priority beside another pane. Abruptly terminating the viewer leaves an old lease, but it expires and the worker completes in 21.966 seconds. The reporter's focused tests cover visibility restoration, paused restoration, ordered delivery after a slow request, and recovery after a failed activity request.

Activity evidence is in `.tilt/perf-activity/project-{before,after}/results.json`. The standalone harness is `scripts/verify-activity.mjs`; it accepts an immutable runtime directory, a run label and `hidden,visible,lost` cases. Outputs and temporary projects remain ignored by Git.

## Measured cached-frame transfer

`npm run test:transfer` uses the real Chromium source, HTTP server and Three compositor in an isolated project. It compares a receiver that requests every PNG with one that acknowledges accepted images. Each trial samples the same 35 camera-only frames, including backward seeks; three trials alternate the full/delta order. Source preparation, initial texture decoding and proof-PNG encoding are outside the timed region. Both variants use identical output dimensions, source density and composition.

| UI density | Response bytes, 35 frames | Median sampling total, 35 frames |
| --- | ---: | ---: |
| 3× | 16,976,225 → 45,710 (**−99.73%**) | 65.4 → 37.0 ms (**−43.4%**) |
| 4× | 23,534,385 → 45,290 (**−99.81%**) | 79.8 → 34.8 ms (**−56.4%**) |

These are awaited sampling times, about 1–2 ms per cached frame, not displayed FPS or a whole-export multiplier. Changing-UI samples still send all changed textures; their measured times were effectively unchanged (3×: 5.387 → 5.327 seconds; 4×: 7.102 → 7.255 seconds for six samples). The important reduction is repeated transfer/parse work on cached frames, rather than faster browser rasterization.

Before/after composed PNG hashes match for the same sequences. The harness also verifies two independent receivers, an image-decode failure after one texture has succeeded, partial acknowledgement and retry, hidden-to-visible layers, a fresh engine, and a live 3×→4× change against a fresh 4× engine. Current layer/route/quality metadata continues to arrive with cached pixels. The live-density proof was visually inspected.

Raw measurements are in `.tilt/checks/frame-transfer/results.json`; the rendered proof is `density-live.png` beside it. The script keeps no viewer state in the server, changes no authored project files, and closes its isolated source and viewer windows on completion.

## Production export and browser checks

The complete unchanged interface scene exported through both immutable runtimes at 1440×900, 30 fps, eight seconds, Auto 3× UI density. All **240 lossless frame hashes match**. Both videos passed the worker's metadata and full-decode verification. Worker times were 75.950 seconds before and 76.062 seconds after; total submit-to-observed-completion times were 76.580 and 76.568 seconds. This pair shows no meaningful normal-export throughput improvement. The measured transport savings apply to cached sampling, and the activity savings apply when a hidden viewer would otherwise throttle the worker.

Evidence: `.tilt/perf-review/export-results.json`, before job `08d8584a-c298-4908-9a86-210dfae1fe31`, after job `b056443b-11f8-4a5f-999b-13700b743655`. Temporary projects contain the frozen runtimes, frames and verified videos.

An isolated project in the actual Codex browser also loaded at fixed **7×** density, presented times 0, 2, 2.5 and 4 seconds, and captured the lifted layers at 4 seconds with readiness true and no error. Context reported 7000×4480 source pixels, 1440×900 output, and no layer warnings. The browser screenshot was inspected and console warnings/errors were empty. Its capture/context pair is `.tilt/perf-review/browser-qa/.tilt/captures/5798e121-f2e6-4091-bba6-b96de8082738.{png,json}`. This verifies the current browser path without claiming native 7× export support.

Typecheck, production build, **35 behavioral tests**, and the vanilla/React native layer integration pass. The existing bundle-size warning remains. No authored scene, source or parameter values were changed in the main project.

## High-density native decode boundary

The standalone Electron compositor could not complete its first 7× full-frame sample, before receiver acknowledgements were exercised. Each PNG decoded independently, but changing their order moved the failure to a later image after several large decodes. The full source and base alone are each 7000×4480 pixels (about 251 MB combined when decoded to RGBA). This points to cumulative decoded-image pressure in that native renderer, rather than malformed capture pixels; a specific Chromium budget has not been proven.

The benchmark therefore verifies 3× and 4×, with 7× still selectable for reproduction. This does not reduce the product's saved density or substitute smaller textures. It is an observed pre-existing limit and is not fixed by transport deduplication. The current successful Codex-browser 7× check above is a different rendering environment and does not prove that a fresh native compositor/export can retain those same layered textures.

## Depth of field and continuous scrubbing — 17 September 2026

The second review reproduced a failure missed by the earlier transfer benchmark. The imported Admin adapter's controlled sample waited for two browser paints even when it returned unchanged pixels. Continuous input then invalidated every in-flight frame. In a five-second 120 Hz forward/reverse scrub, both DOF Off and On received 601 inputs and produced **zero intermediate scene renders**, finally displaying after input stopped. Median sample latency was about **33.3 ms**.

The static Admin interface now declares the existing `static` contract. The shared renderer caches prepared static frames across camera/time samples and invalidates them for changed capture/source inputs. The shared scheduler retains one in-flight sample and one latest pending request, but permits completed work to display during continuous input. Explicit invalidation remains separate. No camera values, animation timings, source dimensions or density limits changed for this fix.

UI depth of field now filters each source texture's color and coverage before composition. Cached Gaussian levels and padded bounds preserve blurred glyph shapes at overlaps and avoid rebuilding blur during camera-only frames. This applies across ordinary textured UI planes. The general custom-shader/3D fallback remains approximate; these results do not establish universal 3D lens quality or performance.

### Measurements and evidence

Same Apple M2 Max / Electron 41.10.7 environment. Scene revision `535bbc68390e252aec5a7ead3b5449e584bbce5313cc9ecf8a593b611c53db27`, 1440×900 output, effective 4× source density (5760×4000), saved focus 1.11 and blur 0.14. Full-density originals remain available; there is no scrub-only resolution reduction.

| Measurement | DOF off | DOF on |
| --- | ---: | ---: |
| Actual-scene scrub, 1636×1023 canvas | 120.36 renders/s | 120.30 renders/s |
| 95th-percentile sample time | 0.40 ms | 0.50 ms |
| GPU time, 1636×1023 | 0.126 ms | 0.265 ms |
| GPU time, 1440×900 | 0.054 ms | 0.127 ms |
| GPU time, 3840×2160 | 0.309 ms | 0.749 ms |

The real-source harness uses the production SceneEngine and scheduler, feeds absolute times at requestAnimationFrame cadence, and counts completed render submissions. GPU measurements use `EXT_disjoint_timer_query_webgl2`, averaging 60 warm renders and rejecting invalid queries. They measure GPU workload, not whole-editor latency. Preparing blur on first enable took **49–67 ms** across measured runs; initial browser capture/image preparation is outside steady-state scrubbing. Camera-only scrubbing made **zero source requests**. Subsequent output-size changes requested updated capture metadata without additional pixel captures.

The separate **full React editor** test drives the real timeline handler for three five-second DOF-on runs with reversals. Default-framebuffer draw cadence measured **119.84, 119.98 and 119.98 renders/s** at 1629×1018. The 95th-percentile intervals were 9.2–9.3 ms; the maximum was 10.5 ms. Every run finished with requested and presented times equal and no console errors. This measures canvas rendering in native Chromium, not a physical monitor. One DOF-off warm-up trial overlapped another GPU test and had a 103 ms outlier; the other off trials sustained about 120 renders/s. The report retains every result.

- Original failure and frozen fixture: `.tilt/checks/scrubbing/before/report.json`.
- Current real scene and exact 4K GPU timings: `.tilt/checks/scrubbing/gpu-4k/report.json`.
- Full-editor trials and screenshot: `.tilt/checks/editor-scrubbing/verified/report.json` and `editor.png`.
- Pixel regression: `.tilt/checks/depth-of-field/report.json` and `surface-*.png`. Composite error against independently rendered foreground/background is **0.052/255** per channel; uncovered text has **zero** error. Coverage expands beyond glyph shapes, focused text stays crisp over a blurred background, tilted layer order is preserved, transforms/focus/resize reuse cached levels, changed pixels rebuild them, and disabling releases effect textures. General shader-fallback checks remain separate.

The actual Codex browser at `https://tilt.video/` was reloaded and checked with forward/reverse ruler drags, then restored to user time 3.478895063. Paired capture/context: `.tilt/captures/b43a9b87-c71e-47d3-a6a6-4fdc334fac5a.{png,json}`. It reported ready, no error, a 1444×903 Retina canvas and unchanged saved camera. The existing composer blend-dependency warning is unchanged.

The complete scene exported **480 frames at 1440×900, 60 fps, eight seconds**, through frozen runtime `bc7c2b45bfcd8a58edef`, job `0d2dc327-66b9-4bb0-b8f1-4b9015db2c5e`. Worker completion took **13.877 seconds**, including metadata/full-decode verification. This establishes end-to-end export, not a controlled before/after export speed comparison. Output: `exports/interface-0d2dc327.mp4`.
