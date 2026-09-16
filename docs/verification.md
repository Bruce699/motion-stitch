# Verification — 16 September 2026

Tested locally on macOS with Electron 41.10.7. These results apply to the included vanilla browser fixture and current scene settings, not arbitrary production apps.

| Check                          | Result                                                                                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript                     | Pass                                                                                                                                                                                              |
| Behavioral tests               | 7 pass: schema limits, ready/play intent, latest seek, filesystem/undo, external conflict + invalid JSON, traversal/symlink/hash guards, combined source/document watcher changes                 |
| Production build               | Pass; desktop renderer bundle is approximately 1.06 MB before gzip, including Three.js                                                                                                            |
| Native UI                      | Opened and inspected: actual browser UI on a 3D surface, parameters, timeline, saved values restored after restart                                                                                |
| Live files                     | MCP/command file write advanced the source generation, recompiled and returned to Ready; restoring the file also reloaded without losing the displayed time                                       |
| Playback                       | Play advanced to the scene end and returned to paused; scrub/seek and separate scene capture paths exercised                                                                                      |
| Reverse sampling               | Captured 1.6s → 6.5s → 1.6s; repeat frames visually identical, with very small GPU raster differences (mean channel error below 0.00002 on a 0–255 scale), so byte-identical PNGs are not claimed |
| Agent integration              | MCP initialized, exposed 14 tools, read scene files, inspected 9 DOM subjects, and controlled render jobs                                                                                         |
| Idempotency                    | Two simultaneous submissions with one request ID returned one job                                                                                                                                 |
| First export                   | 1440 × 900, 30 fps, 240 frames, 8 seconds; worker capture/encode/verification: 16.9 seconds                                                                                                       |
| Render button + editor closure | Submitted through the visible Render button, quit the editor during capture, checked progress through the offline CLI; completed in 13.7 seconds                                                  |
| Interruption + resume          | Killed only the test job's worker at frame 8; coordinator reported Interrupted; resumed, cancelled at frame 18, confirmed no published output, resumed again to 240 frames                        |
| Checkpoint integrity           | First saved PNG's hash remained unchanged across worker crash, cancellation and both resumes                                                                                                      |
| MP4 verification               | FFprobe checked frame count and dimensions; FFmpeg fully decoded each successful export before publication                                                                                        |

Run `node scripts/verify-live.mjs` with Tilt open to repeat the agent/recovery check. It creates a new render job and deliberately stops only that job's identified worker. It does not alter authored scene files. `npm test` does not launch the app or render jobs.

The output timing above is measured for this small scene, not a performance target or a promise for heavier apps. Native video/audio sampling, React/Svelte-specific adapters, arbitrary external media, resource exhaustion, OS reboot recovery, large scenes and packaged distribution have not been acceptance-tested. This prototype does not include a login service or a separately installed browser runtime; resume requires the recorded Electron version and FFmpeg still being installed.

The inspector's scene-generated numeric controls are live. Cue track labels and diamonds visualize authored timing; they are not draggable keyframes. Current browser transfer uses PNG readback, with unchanged source revisions cached. There is no shared GPU texture path yet.
