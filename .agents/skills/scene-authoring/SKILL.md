---
name: scene-authoring
description: Create or edit a Tilt scene, its parameters, timing and executable composition.
---

# Author a scene

1. Read `README.md`, `src/core/runtime.ts`, `src/core/schema.ts`, and the active scene's files. Read `.tilt/context.json` and use `npm run cli -- state` for the current document and revision. Understand the current choreography before changing it.
2. The primitive is a scene folder. Keep UI, fixture data, imported assets and custom shader modules inside it. Use relative paths. Treat app source and scene composition as separate concerns.
3. Export a factory from `scene.ts`, receiving `{THREE, world, camera, surfaces, createLayeredSource, document, motion}`. Return `{sample(frame), dispose?}`. Do allocation and timeline compilation in the factory; do only sampling and necessary property updates in `sample`. Use `createLayeredSource` for declared browser layers; follow the `ui-layers` skill instead of rebuilding capture/alignment per scene.
4. Derive every animated property from absolute `frame.time`. No accumulated deltas, independent timers, wall-clock time or unseeded random numbers. A frame at t=2 must be identical after t=7 or t=0.5. Async sample must resolve after all required work.
5. Declare useful numeric controls in `scene.json.parameters`. Use a stable key, label, sensible range and step. Controls can feed any authored behavior; do not add bespoke inspector widgets for each effect.
6. Cue tracks describe the choreography for the person scrubbing. Their `keys` are visual markers, not executable keyframes. Keep them aligned with the real code. If the user needs editable keyframe curves, implement a shared time-value contract rather than a parallel hidden clock.
7. Edit `scene.json`, code and assets directly. Use `npm run cli -- begin "Edit label" <revision>` before coordinated multi-file writes and `apply <id>` after validation. Preview holds its base during the group; one Apply is one undo step. For a guarded command write, include the revision/hash you read. Never use a stale replacement or cancel an unrelated open edit.
8. Capture at least an entry frame, a motion midpoint and a settled frame. Inspect the PNGs. Seek backward, replay, change a parameter, and verify the value is on disk. Check the actual exported result for delivery.

Keep the engine small. The agent may author arbitrary scene code and bring a library where appropriate. Persist that dependency in the project lockfile; avoid remote/CDN imports and network-dependent frames. Module compilation bundles imports for the browser, while source apps may use their own production build process. Use type-only imports for Tilt's runtime types so no app-internal runtime dependency leaks into scenes.
