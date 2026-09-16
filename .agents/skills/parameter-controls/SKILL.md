---
name: parameter-controls
description: Add consistent controls for transforms, cameras, materials and bespoke effects without changing Tilt's editor.
---

# Expose a creative parameter

Read `docs/parameters.md` and `src/core/parameters.ts`. Parameters are scene data. The right panel is a fixed vocabulary of reusable controls; the creative behavior remains in the scene.

The Camera group also includes Tilt's shared projection controls, stored in `scene.json.camera`. Reuse those for Perspective/Isometric, exact angle stops and source alignment (`docs/camera.md`). Do not duplicate them as scene parameters. Custom camera distance, framing or other creative inputs can still use ordinary parameters in the Camera group.

1. Inspect the current scene and context. Reuse existing keys and groups where the requested behavior already has a control. Do not replace current values with a template's defaults.
2. Choose `number`, `color`, `boolean`, `select`, `vector3`, `pad` or `text`. Every declaration needs `label` and `value`; numeric/vector controls also need useful bounds. Prefer a slider for continuous creative strength, `control: "number"` for a count, `select` for a small set of modes, `control: "segmented"` on a select for 2–5 short options, `pad` for a two-axis input, text for editable copy, and XYZ for a spatial vector. Keep labels short. Add `group` only when it identifies a meaningful subject.
3. Follow the standard conventions in the parameter guide: scene units for position/depth, explicit degrees for rotation controls (convert to radians in code), scale one as neutral, opacity/strength 0–1, hex colors through `THREE.Color`. Existing controls may use other documented units; preserve their meaning.
4. Begin one file edit group when adding definitions and behavior together. Add entries to `scene.json.parameters`, then connect them in the existing scene's `sample({time, controls})`. Use `controls.number/color/boolean/select/vector3/pad/text(key)`. Allocate materials/uniforms in the factory; only update values during sampling. Avoid hidden bindings based on labels or arbitrary JavaScript in a control declaration.
5. For a bespoke shader, expose only the creative inputs the person needs. The guide includes a complete declaration example and bindings for numeric strength, color, enabled state, mode and origin. Reuse that pattern rather than creating a shader-specific sidebar component or effects catalogue.
6. Let Tilt handle rendering widgets, validating edits, atomic persistence and history. Do not store values only in React, localStorage, a CLI flag or a second JSON document. Adding a control should require no editor/runtime changes.
7. Verify in the actual panel: change a value, inspect `scene.json` and rendered pixels, undo, redo and reload. Slider, pad and color gestures, and a focused text editing session, should each be one undo step. Reuse the local Dial Kit primitives through declarations; do not import Dial Kit's store or create a second clock. Test backward sampling and a video export for rendered behavior. Remove temporary verification controls before delivering.

Scene name is edited by double-clicking the header (Enter/F2 also works). Canvas resolution, UI density, duration, frame rate and background are in the header settings popover. Reuse `scene.size` and `scene.capture.density` rather than adding resolution or density parameters. Sources/files/scene lists are not shown in the editor; use the filesystem, CLI and context for that information. Do not recreate those panels to add an effect control.
