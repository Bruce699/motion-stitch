# Editor design system

Tilt uses a selective source fork of [Dial Kit](https://github.com/joshpuckett/dialkit). This follows the latest design direction and replaces the earlier Codex style kit. The source version, license and local adaptations are recorded in [UPSTREAM.md](../src/renderer/vendor/dialkit/UPSTREAM.md).

`vendor/dialkit/theme.css` supplies the original semantic tokens and selected control rules. `style.css` supplies Tilt's shell layout and compatibility overrides. Use the `--dial-*` tokens, 36px filled controls, compact 28px toolbar actions, restrained system type, Geist Mono values, and subtle tonal separation. Keep the canvas, timeline and parameter panel as the primary structure. Scene content has its own styling.

## Shared controls

The editor reuses Dial Kit's filled slider, segmented control, toggle, dropdown, XY pad, color picker and autosizing text field. XYZ vectors and number-only fields use Tilt's validated draft input within the same visual treatment. Add scene controls through `scene.json.parameters`; see [parameters.md](parameters.md). Do not create a private widget for every shader.

Keep keyboard navigation, visible focus, accessible names, Escape dismissal and popup collision handling. Use the existing shared icons; do not invent brand marks. Retain the MIT notice when adapting upstream code. Motion's springs are an implementation dependency; Dial Kit itself is not installed.

All creative values flow through Tilt's file journal. Control gestures share an ordered save queue and finish one edit group. No independent preset store, browser-only values, or hidden animation loop. Reduced motion disables decorative spring settling/transitions; it does not alter authored animation or direct inspection.

## Timeline and layout

The controlled timeline uses Dial Kit's overview, adaptive ticks, playhead, lanes and anchored zoom patterns. Drag to seek, Option/Alt-drag to zoom, Shift-drag to reset and seek, and Option/Alt-wheel to zoom under the pointer. The overview navigates the full scene; a horizontal scroll track appears when zoomed. Arrow keys step one frame, Shift-arrows ten frames, Home/End go to the bounds. Bars/diamonds display authored cues; editing their timing is not implemented.

The default theme is dark. `?theme=light` or `?theme=dark` changes only the viewer shell. Colors, shaders and exports do not inherit the editor theme. Desktop uses a 304px parameter panel (280px below 1000px) and a 250px timeline; below 640px, parameters move beneath the timeline with their own scroll region. Canvas fitting measures the actual available space. Do not reset a user's pan, zoom, orbit or time while restyling.

Geist Mono is bundled locally with its SIL license. There are no remote font requests. The original Codex archive remains a local reference, but its stylesheet is no longer imported or carried in the product.
