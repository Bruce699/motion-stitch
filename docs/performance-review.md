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
