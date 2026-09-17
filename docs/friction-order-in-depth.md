# Order 1401 — In depth: authoring friction log

Date: 2026-09-17. Task: create a new cinematic composition from the fresh orders UI, then review the visual feedback loop with Jay. No editor feature changes are part of this experiment.

## Creative intent

A 14-second continuous macro-to-context shot. Trace the payment, unfold fulfillment and customer information into depth, pass across the separated planes, then return to a legible complete order. Reuse the original browser build and artwork; author all choreography afresh.

References inspected: Liquid Glass sheet 1 (macro detail and selective focus resolving into context), iOS 7 sheet 3 (oblique close-up becoming a full object), Airbnb sheet 2 (one subject, deliberate scale changes, breathing room). These are visual references, not claims about their implementation or measured easing.

## Live log

| Step | Observation | Cost / consequence | Candidate improvement |
| --- | --- | --- | --- |
| Orient | Context JSON includes many disconnected historical viewers; scene state, source quality, layer bounds and revisions are useful but verbose. | Reading the whole observation hid the active scene in irrelevant history. Filtered locally to connected viewers. | A compact authoring brief: current viewer, revision, frame, quality, bounds, warnings. |
| Learn contract | Required authoring guidance spans workspace, scene, layers, controls, camera, groups, resolution and runtime types. | Several minutes before the first visual experiment; combined reads were truncated. | One task-shaped contract with links to details and an executable minimal example. |
| Find inspiration | Searchable catalog and contact sheets made choosing three visual ideas quick. | Sheets convey staging well; they do not establish acceleration or rhythm. | Return a timed clip and nearby frames together with each semantic reference match. |
| Start fresh | Create made an empty composition with a new ID and viewer; copied only the original local browser build and layer declarations. | Good separation from existing animation. CLI create returns excessive project/job history. | Compact create result with scene ID, viewer, revision and path. |
| First edit group | Runtime briefly reported stopped between create and begin; rerunning start found it already running. | One failed begin and follow-up; no files were lost. Shared runtime churn can interrupt otherwise local work. | Clear restart/reconnect state and a bounded read-only readiness check. |
| Scoped file writes | Coordination hook inferred a broad write set for a Python generator, blocking it on unrelated reservations. | Replaced it with explicit file targets. | Let an edit group expose its declared write set to coordination checks. |

| First pixels | Warm 4K captures took 0.14–0.15 seconds in the CLI; source cache reused all nine surfaces with no decoding or transfer. | Actual capture is fast; finding the right viewer and consuming separate PNG/context results cost more tool turns. | Batch ordered times into a labeled contact sheet plus native-resolution crops and paired context. |
| Visual revision 1 | Opening is well scaled, but DOF makes too much text unreadable; dimming the base to gray makes the reveal muddy. Final rest is also blurred by the offset focus plane. | Three sampled frames exposed a compositional problem that typecheck cannot detect. | Keep a sharp focal target and compare opening, peak separation and final hold in one view. Lowered blur, focused the rest plane, retained a brighter base. |
| CLI mutation scope | A batch of scene-targeted CLI commands was also blocked by the coordination hook on unrelated reserved files. | Used explicit scene-file patches, which have unambiguous paths. | Recognize the CLI scene target as its mutation boundary. |

| Visual revision 2 | Transparent side-column sections lost contrast when lifted beyond the white page; the customer block approached the top edge at maximum separation. | Layer bounds alone do not explain what backdrop text relies on. Added white paper backing in the copied browser fixture, reduced sidebar spread/depth, widened the reveal. | Paint-dependency diagnostics should distinguish text without a backing from a self-contained card. Projected safe-frame bounds would make this faster to catch. |

| Sequence review | A ten-frame contact sheet made the overall arc and empty middle-stage page obvious. The note's lifted backing appeared blank while its visible note stayed with the base. | Kept the note with its original page; did not expand scope into a capture-engine fix. Changed the middle stage to floating paper cards with the page fading away, then returning. | A layer-isolation sheet should show the real texture, alpha and its appearance on light/dark backdrops before choreography. |
| Review timing | Ten ordered 4K captures took roughly 0.2–0.4 seconds each while another render ran. First 14-second 4K/60 export completed 840 frames in 157.4 seconds. | A final encode is a materially slower review path than warm sampled images; stills alone cannot establish rhythm. | One low-latency motion proof plus simultaneous key frames; final export can run separately. |

| Control verification | Changed Separation in the real inspector: 1 → 0.79, saved to disk, payment depth 0.88 → 0.6952. Undo/redo restored the authored state. Child Payment duration 3.3 → 2.5 seconds changed its depth at t=3 from 0.4150 → 0.6592. Group move shifted children; resize scaled them. | Controls and track timings do drive the composition. A CLI timing patch requires both start and end; sending only end failed explicitly. | Return a small before/after timing and frame diff with each edit. |
| Revision and reload | Reload creates a new viewer ID. Capturing immediately after Apply can fail with Scene is preparing. Paired context prevented confusing the old frame with the new result. | Extra discovery/wait steps; a static tab identity is not enough. | A capture request should wait for a specified revision and return the current viewer binding. |
| Fidelity at review time | The 3840×2160 image is downscaled to 2048×1152 in the model tool result. A contact sheet is smaller again. | Small-text judgments need a separate native-pixel crop; source resolution alone does not ensure useful observation. | Deliver overview plus automatic native-resolution crops around the selected/focal objects. |
| Camera understanding | The inspector shows the saved default angles while scene code animates the actual camera. | A still plus saved settings does not fully describe the currently rendered shot. | Report effective sampled camera position, target, FOV, projected layer bounds and focus distance together. |

## Completed review pass

- New composition: `scenes/order-1401-in-depth-f9ed6fe4/`. Existing demo animation untouched. Browser build copied locally; the only source adaptation adds paper backing/shadows to lifted sections. No added interface copy or artwork.
- Final video: `exports/order-1401-in-depth-f9ed6fe4-4708311c.mp4`; 3840×2160, 60 fps, 14 seconds, 840 frames. Final export job reported 112.1 seconds elapsed. No audio.
- Typecheck passed. Inspector parameter changes, child retiming, group move/resize, Undo/Redo and reload verified; all test changes restored. Normalized scene document matches the frozen export snapshot.
- Final captures at 0, 3, 7 and 13.5 seconds; backward 13.5 → 7 reproduced the earlier t=7 image pixel-for-pixel. Five capture commands took 239–288 ms each, including process launch and image decode/hash work in the measurement script.
- Actual MP4 played through in the browser; its separated stage and final hold were visually inspected. Metadata confirms all 840 frames. Captures/context and the comparison sheet are in `.tilt/checks/order-in-depth/`.

## My judgment before Jay's feedback

The macro opening and transition from one page to a spatial arrangement are the strongest parts. The full order returns cleanly. The middle is intentionally spare, and the last few seconds are quiet; Jay may prefer a more assertive pass through the layers or a shorter reveal. The white section backings preserve readable text, but they change the feeling of the original flat page slightly. These are taste choices to review, not proof that the result is universally successful.

The largest latency was between observations and decisions, not warm rendering. I could acquire a frame in a few hundred milliseconds, yet several tool calls were required to choose the viewer, wait for the correct revision, get a PNG, open it, discover a visual problem and gather a comparison. Still-image reasoning also leaves a real limit: sparse samples do not prove continuous rhythm or perceptual smoothness.

## Improvements to discuss after visual feedback

1. **One review bundle per revision:** ordered contact sheet, a short playable motion preview, selected-object native-pixel crops, frame times and revision IDs. One request; progressive results as frames become available.
2. **A useful sampled-scene brief:** effective camera/focus, projected layer bounds, which objects are out of frame, source density and meaningful warnings. Exclude disconnected viewer history by default.
3. **A/B before and after:** preserve the prior reviewed revision and show matched times/crops, plus changed timings and controls. This would make correction much more reliable than visual memory.
4. **Isolation proof before animation:** layer thumbnails on light, dark and checkerboard backdrops; flag transparent text and dependent paint. This would have caught the note/backing and sidebar problems earlier.

These are proposals, not implemented editor features. Command elapsed time is not GPU timing or human-perceived playback smoothness. A faster review encode should be labeled as such and never silently replace final-resolution verification.
