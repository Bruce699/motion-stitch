# Live depth of field: editor verification

This benchmark exercises the actual editor and its Focus plane and Blur sliders with an isolated copy of the current Order #1401 scene. It does not alter the user's scene, playhead, view, or runtime.

Run it after building:

```sh
node scripts/verify-live-depth-of-field.mjs candidate . /path/to/frozen-baseline
```

The second argument supplies the runtime build; the third supplies the frozen scene. A label beginning with `baseline` records the previous behavior without requiring the new live-update thresholds. Artifacts are written under `.tilt/checks/live-depth-of-field/<label>/`.

## What is measured

Each slider receives three 1.8-second held gestures at 30 input events per second. The test uses native pointer-down and the same pointer-move handlers as the editor, then releases the gesture and waits for the persisted revision to appear. Focus moves monotonically from approximately −1.6 to 1.8; Blur moves from approximately 0.05 to 0.95. The exact values and input times are preserved in the report.

A probe installed before the editor loads observes the actual WebGL focus/strength uniforms and draws to the visible scene canvas. It matches the rendered shader value to the originating input, rather than mistakenly timing an old queued result against the most recent input. Focus matching accounts for the camera-space origin offset. After each draw, a nonblocking GPU fence confirms completion of those commands. Fence polling is quantized to animation frames; this is not physical monitor scanout latency.

Separate pixel checks hold three distinct values for each slider, save the canvas PNG while the pointer is still held, and compare the final held PNG with the settled persisted frame. PNG readback and encoding do not run inside the timing trials. The candidate must show three distinct held images, exact final held/settled parity, no editing chip, at least 80% of distinct input values changing the rendered effect, and p95 matched input-to-GPU completion below 100 ms.

The scene's authored output remains 1440×900. The isolated 1200×900 Electron window produces a 1629×1018 preview. The real layered browser source is captured at density 4 (5760×4000), with the original camera tilt, zoom, pan, materials and source assets. Scene time is fixed at 3.7017525112203464 seconds. Both builds use the same frozen scene and hardware. The test preserves the full rendering quality.

## Results

Measured September 17, 2026, on Apple M2 Max with Electron 41.10.7. The renderer before this change was `index-CLhHI_Fj.js` (SHA-256 `9614a88267963fea819c89fee6372f3dcfc9ea1e786970221a5a1e01cd329a27`); the tested candidate was `index-DGmkjKr_.js` (SHA-256 `f3b8f526d4c51155de4e52d3b997479655482ae4a0ed7a210a0c83183e0452dd`). Later runs save build and source-document hashes in `inputs.json`.

| Matched 30 Hz test, six gestures               |             Before |        After |
| ---------------------------------------------- | -----------------: | -----------: |
| Slider input events                            |                324 |          324 |
| Actual DOF updates while held                  |          24 (7.4%) |   324 (100%) |
| Median matched input-to-GPU completion         |         1,175.8 ms |       8.3 ms |
| p95 matched input-to-GPU completion            |         1,657.3 ms |       9.1 ms |
| p95 range across individual trials             | 1,549.2–1,683.4 ms |   8.8–9.8 ms |
| Durable camera writes per gesture              |                 54 |            1 |
| Release to persisted/presented revision, range |   20,204–21,881 ms | 973–1,166 ms |
| Editing chip while dragging                    |            Present |       Absent |

The latency rows include only values actually rendered during the held interval: 24 before and all 324 after. The old queue continued processing obsolete values after release; these later responses are not hidden in the new latency measurement. The release-to-settled endpoint includes a 150 ms stability wait and polling for the saved revision. The new preview already shows the final value before release, so its remaining save time is not visual latency.

An additional 120 Hz candidate stress run delivered 1,286 inputs and 1,286 main-canvas draws across six gestures. All 918 distinct values reached the effect shaders: Focus plane used 645 distinct values; Blur used 273 because its public step is 0.01. The aggregate p95 matched input-to-GPU completion was 10.0 ms, with a 10.9 ms maximum. Each gesture still made exactly one camera write.

## Final build verification

After the page-exit and numeric-field recovery work, the complete native editor check was rerun against `index-DSHRZZEv.js` (SHA-256 `a9590f2eeea355019f307afcb7e6d6d60dfa776e2cc515550de9edc20840ef83`). All 325 delivered held inputs rendered; aggregate matched p95 GPU completion was **9.0 ms**, median **8.3 ms**, maximum **10.5 ms**. Every observed GPU fence completed successfully. All earlier pixel, history and delayed-gesture assertions passed again.

The final run also checked real editor reload during a held gesture. Blur 0.73 persisted through the page-exit request, the reloaded image was byte-identical to the last held image, the numerical field showed 0.73, a fresh viewer identity was created, and no gesture remained open. An injected rejected keyboard write restored the saved value 0.1 in both the numerical control and scene file, with the exact previous pixels.

The original matched table remains above; this final rerun is separate and had one additional input due to animation-frame scheduling at the interval boundary. Its evidence is `.tilt/checks/live-depth-of-field/candidate-final/report.json`, with exact build/source hashes in `inputs.json`, plus `reload-held.png` and `reload-restored.png`.

## Fidelity and persistence checks

- All three held positions produce different PNGs for both sliders. Before the change, Focus plane produced one distinct image and Blur two over the same three held checkpoints.
- The final held preview is byte-identical to its persisted settled frame for both controls. Each final frame is also byte-identical to the baseline's eventual result: this change preserves the rendering rather than reducing blur quality.
- One undo restores the exact previous camera and pixels; one redo restores the exact final pixels, for both controls.
- With a 500 ms delay injected into camera writes, two rapid consecutive blur gestures remain independent. The earlier value (0.3) is verified saved while the newer gesture is still held at 0.8. The shader remains at 0.8 and the PNG never snaps back; releasing saves 0.8 and leaves no open edit group.
- No renderer console errors occurred. The saved held PNGs were also visually inspected: the focus band moves across the tilted UI and blur strength changes visibly.

The benchmark measures warm interactive editing after source preparation. Initial source loading, initial blur-cache construction, physical monitor scanout and other hardware are outside the timing claim. GPU completion is observed by a fence polled at the host's refresh cadence. It does not establish identical timing for arbitrary imported scenes, other machines or the general custom-geometry DOF path.

Generated evidence:

- `.tilt/checks/live-depth-of-field/baseline-matched/report.json`
- `.tilt/checks/live-depth-of-field/candidate/report.json`
- `.tilt/checks/live-depth-of-field/candidate-120hz/report.json`
- `.tilt/checks/live-depth-of-field/candidate-final/report.json`
- The same directories contain `focus-plane-held-0.png` through `focus-plane-held-2.png`, `blur-held-0.png` through `blur-held-2.png`, and settled PNGs. Candidate directories also contain rapid-drag proof frames.

For the higher input-rate run:

```sh
TILT_DOF_INPUT_HZ=120 node scripts/verify-live-depth-of-field.mjs candidate-120hz . /path/to/frozen-baseline
```

The harness targets the same editor controls and source contract as normal use, has no production debug API, and keeps generated evidence outside Git.
