# Native review + Order 1401 — Small things

2026-09-17. Implement the agent's visual review loop, use it to author a fresh macro composition, and record friction. This pass used files, CLI/MCP, native rendering and image inspection. No computer-use automation or editor screenshot was used.

## Delivered

- `tilt_review` and `tilt_review_status`, also available through the CLI. Full-resolution frames, matched before/after sheets, semantic native-pixel crops, sampled camera/source context, asynchronous motion clips and timed filmstrips.
- New composition: `scenes/order-1401-small-things-3906f540/`. Twelve seconds, 1920×1080, 60 fps. Three close shots: payment marks, ink/hairlines, total. Each has its own editable camera interval; paper separation has grouped child timing. Original order browser build and artwork copied unchanged. The composition hides the surrounding base/navigation, then animates the original payment surfaces and tiny declared details.
- Final video: `exports/order-1401-small-things-3906f540-5b5bdeb2.mp4`, 720 frames, 12 seconds. Export completed in 30.934 seconds.
- Contract and usage: `docs/agent-review.md`.

## Friction while building and using it

| Observation | Change / outcome |
| --- | --- |
| Capture required discovering a connected viewer, moving its playhead and assembling separate files. | Added a private native review renderer using the existing scene/source pipeline. It works with no viewer and does not change inspection or transport. |
| A file path in JSON does not let every agent see the evidence. | MCP returns actual image blocks. CLI retains local paths for filesystem-capable agents. Verified the real stdio MCP protocol, not just a formatting helper. |
| The first native invocation passed an omitted camera as JSON `null`. | Normalized it before camera selection. The viewer-free integration harness caught this immediately. |
| A successful scene creation was followed by an error trying to open a stale viewer. | The scene had already been created, so reused it instead of duplicating it. Creation now checks the viewer's fresh connection state before opening it. |
| A large layer's automatic crop centers the row and can miss its important numeral. | Declared the actual amount and currency icon as semantic child layers. The resulting crop exposed the exact sharpness of `$108.99`. This remains an authoring decision; the tool does not infer the important word. |
| The initial continuous macro move crossed a long empty area between logo and amount. | Replaced it with three deliberate shots, with each orbit/drift timed independently. A/B at identical times made the change easy to assess. |
| The second shot revealed distracting blurred navigation at the left edge. | Hid the surrounding base surface in composition code. A four-frame matched review confirmed the payment panel stayed identical while the distraction disappeared. |
| Motion status initially would have resent several image blocks on every poll. | Made status metadata-only by default; added selective artifact retrieval by index. |
| Video is useful to a person, but this agent's observation tool receives still images. | Motion reviews now include a six-frame timed strip. It improves temporal inspection, but it is not equivalent to watching continuous playback. Human feedback on rhythm still matters. |
| Rebuilding `dist` could otherwise swap renderer assets during an active session. | Pin renderer assets at runtime startup; comparisons reject different runtime builds. |
| Guarded undo rejected the verification script's missing revision. | The script incorrectly assumed `set` returned an object. Read fresh state, used its revision, then verified both parameter and timing restores. No stale overwrite occurred. |
| One existing macOS watcher test missed its event deadline while checks overlapped. | It passed alone, then the full clean run passed all 137 tests. Did not change the watcher or weaken the test. |

## Measurements

Single local observations on this Mac; these are request timings, not GPU timer results or guarantees.

| Review | Observed time |
| --- | ---: |
| Cold four-frame 4K original-order review + detail crops | 3.690 s |
| Warm four-frame 4K original-order review + detail crops | 0.894 s |
| Two-frame 4K MCP request returning image blocks | 0.539 s |
| Final three-frame 1080p macro MCP request, four image blocks | 0.248 s |
| Warm macro parameter A/B at three times | 0.349 s |
| Shot-retiming A/B, including renderer replacement | 0.772 s |
| Final navigation-removal A/B at four times | 0.667 s |
| 2.5 seconds of 1080p/60 motion, including a cold second renderer | 6.563 s |
| Final 12-second 1080p/60 export | 30.934 s |

The earlier workflow's single warm captures were already approximately 239–288 ms each. The main win is **one request containing coherent evidence**, not a claim that rendering itself became an order of magnitude faster. I no longer assemble a contact sheet, rediscover the viewer, or rely on memory of the prior image. Changed code reuses unchanged browser pixels.

The first macro review needed 3.710 seconds after introducing a new 4× source and layer set. That cold cost remains. Adding semantic layers costs more than changing camera code; warm camera-only edits are the fast path.

## Verification evidence

- Typecheck and build passed. Clean full unit suite: 137/137. Existing native camera-sampling check passed.
- Native review harness: no viewer, exact output dimensions, reverse sampling, immutable old-source re-render at a previously uncaptured time, stale revision rejection, open-edit rejection, scene-error recovery, nested dependency revisions, motion frame count and selective filmstrip retrieval.
- Actual MCP: metadata-only status, selective filmstrip image, and four attached image blocks in a review response.
- Lens distance 2.05 → 2.3 changed sampled camera position. Retiming the opening from 4 → 3.2 seconds changed the camera at t=2. Both restored. A backward 11.98 → 0 → 2 review reproduced the earlier PNGs byte-for-byte.
- Native 4× capture remained 5760×4000 for the original 1440×1000 CSS layout. No bitmap enlargement was used to claim additional source detail.
- Decoded export checkpoint pixels at 0, 4 and 8 seconds exactly match native review pixels. Normalized exported and current scene documents match. FFprobe confirms 1920×1080, 60 fps, 720 frames, 12 seconds. A contact sheet decoded from the actual MP4 was visually inspected.
- Reports: `.tilt/checks/review/report.json`, `mcp-report.json`, `macro-authoring.json`, `export-parity.json`, `final-video-sheet.png`.
- Final cleanup comparison: review `ae23ea66-2c80-4d01-94b5-3ddc67bef47e`. Final three-shot evidence: review `20e7f7a8-491b-4325-826e-88d3dd98e059`. Final scene revision: `9b875c037c98605c48f8f519f68f24dad5c7f940ff5c95ad2befaee57221b5ef`.

## Judgment and next useful improvement

The tool is already useful: it caught framing problems, showed the benefit of removing navigation, proved native numeral sharpness, and made editing controls/timing assessable in sub-second warm reviews. The composition is deliberately restrained: crisp small marks, subtle raised surfaces, soft surrounding rows and three quiet camera moves. It is ready for Jay's taste feedback; motion rhythm was assessed through timed samples and encoded-frame validation, not claimed as continuous visual perception by this agent.

The next largest improvement is target selection: allow a semantic element or local point to guide an observation crop without requiring it to become an animated layer. Then add a compact motion trajectory/velocity view, including cut markers, for image-only agents. A future video-capable agent could consume the clip directly. Neither capability is included in this implementation.

Current limits: motion preview uses another renderer and can compete for GPU/memory; runtime shutdown interrupts preview encoding; review history has no pruning yet; remote MP4 delivery needs an authorized transport; projected bounds do not prove occlusion or arbitrary shader geometry; external/network/nondeterministic source behavior is not frozen. Final exports retain the existing durable job system.
