# 2D browser-source playback — 30 September 2026

The changing Loop Search source exposed the bottleneck: every 2D frame sampled the source, captured the whole page, isolated and captured the base and each declared layer, PNG-encoded the results, transferred them and decoded textures. The source view then displayed only the whole-page texture. Layer isolation adds repeated paint waits and screenshot readbacks that 2D does not need.

Controlled local HTML sources now render directly in an origin-isolated, sandboxed iframe. One MessagePort carries absolute samples from the existing editor clock and acknowledges readiness/errors. The engine serializes samples, preserves revision/presentation guards, and releases frames and ports on replacement. Camera rendering and export still use captured textures. Explicit captures bypass direct presentation and acquire current raster pixels. Source adapters can skip capture-only paint barriers when `presentation` is `dom`.

`TILT_PREVIEW_PROJECT=<project> TILT_PREVIEW_SCENE=<id> node scripts/verify-source-preview.mjs` exercises the real source and SceneEngine without touching a running editor. The Loop Search run at 1920×1080 with 2× capture density measured:

- Old changing-frame samples: 1685.5, 1584.1, 1491.7 and 1549.9 ms.
- Direct preview: 352 completed samples in five seconds, approximately 70.3 samples/s; 95th percentile 11.1 ms.
- Zero raster requests during direct playback.
- Forward then backward seeking, return to Camera mode, current-time PNG capture, return to 2D and iframe disposal passed.

These are completed sampling rates in native Chromium, not physical display measurements. DOM/raster proof images were visually compared. Evidence lives in `.tilt/checks/source-preview/{report.json,dom.png,raster.png}`.

The actual Codex in-app browser at localhost also completed playback using DOM presentation, reporting 0.9 ms source sampling at 13.8733s, zero captures and zero image transfer/decode, with ready true and no error. The editor CSP explicitly permits the isolated loopback frame; the initial integration fixture did not include that CSP, so the browser check caught and fixed that omission.

Typecheck and build passed. The full unit suite had one unrelated managed-process test failure: its 200 ms process-exit expectation instead hit readiness timeout; a focused rerun also encountered `kill EPERM`. No source-host lifecycle behavior was changed for this playback fix.
