# Web UI layers

Tilt separates declared DOM regions into transparent browser-rendered surfaces and places them back at their original coordinates. The source can be vanilla HTML, React/TSX, Svelte, Vue or another browser app. The layer contract targets the rendered DOM; each app still supplies its normal readiness and absolute-time adapter.

Add stable selectors to a source in `scene.json`:

```json
"layers": [
  {"id": "navigation", "selector": "[data-tilt-id='navigation']"},
  {"id": "active-item", "selector": "[data-tilt-id='active-item']", "padding": 12},
  {"id": "dialog", "selector": "[data-tilt-id='dialog']", "optional": true}
]
```

IDs are unique within a source; `base` is reserved. A selector must match exactly one element. A missing optional layer becomes invisible and can remount on a later sample. List regions back to front, with ancestors before their descendants. The DOM determines nesting. The undeclared remainder is a single base behind all declared regions; it cannot preserve an arbitrary foreground overlay above an extracted layer unless that foreground also becomes a layer.

In `scene.ts`:

```ts
export default function createScene({ world, createLayeredSource, motion }) {
  const ui = createLayeredSource("ui", { width: 5.8 });
  world.add(ui.group);
  const navigation = ui.get("navigation").object;
  const activeItem = ui.get("active-item").object;
  return {
    sample({ time, parameters }) {
      const lift =
        motion.segment(time, 1, 2) * (1 - motion.segment(time, 5, 6));
      navigation.position.z = lift * parameters.depth;
      activeItem.position.z = lift * 0.2;
    },
  };
}
```

All ordinary Three transforms are available. Neutral transforms are position/rotation zero and scale one. Browser layout lives in an internal anchor, so updating content and bounds never overwrites authored animation. Nested objects inherit their parent transform; the active item in this example gets the navigation's lift plus its own local 0.2. The group's width sets CSS pixels to world units. `get(id).mesh` exposes geometry/material for bespoke effects; `get(id).layout` exposes the current browser bounds/crop. `base` is the remaining page mesh, and `ids` lists the declared layers.

`surfaces.ui` remains the original complete page texture. `surfaces['ui/base']` and `surfaces['ui/navigation']` are also available for custom composition. Use the helper for alignment instead of reproducing crop/parent math. The 2D viewer deliberately shows the complete page; Camera shows the authored layered composition. Sources lists layers with local depth values. Selecting one records `sourceId:layerId` in agent context.

## Capture and sampling

Each source samples its app once per time, then captures a full page, the base, and each visible region. CSS changes paint visibility without removing layout or remounting the framework. The pass retains original visibility, ancestor geometry/clipping and native browser fonts, borders and local paint. The page's ordinary paint state is restored in `finally`. The isolated page has no Node or editor bridge.

A source revision covers pixels **and layer layout/membership**. An unchanged revision reuses the full set of images and metadata, so camera/layer-only animation does not recapture the browser. Browser capture is still bitmap readback. With N changing visible layers there are N+2 capture passes per changed source frame; complex live UI will preview more slowly. No shared GPU texture path or automatic per-layer invalidation is claimed.

The compositor updates layout/textures before scene sampling. Preview, paused captures and frozen export use the same layer frames and transforms. Per-view context includes source/layer IDs, parent IDs, CSS bounds, visibility and local position/rotation/scale of the presented frame. `layerWarnings` reports known paint dependencies.

## Fidelity boundaries

This is selective browser capture, not a universal DOM-to-3D conversion. Choose boundaries deliberately:

- Background blur, blend modes and ancestor group opacity/filter depend on other paint. Keep those dependencies together or supply a separately authored/precomposed source. The runtime warns about common cases.
- Clipping is baked at the sampled pose. Moving a layer in 3D does not reveal pixels that its source viewport or ancestor clipped. Adapt the fixture if that reveal is intentional.
- CSS shadows/pseudo-element overflow need sufficient `padding`; the crop cannot exceed the source viewport. CSS 2D/3D transforms already applied by the app are baked into the captured image; scene transforms are additional.
- Selectors query the source document. Open Shadow DOM is rejected by this capture path; closed shadow internals and cross-document selection require an adapter. Canvas, SVG and iframes can be captured as whole regions; their internal objects are not automatically separate layers.
- Capture temporarily adds private attributes. Apps that react to every DOM mutation or keep independent timers running need fixture/adapter work to remain stable across passes.

Run `npm run test:layers` for the Electron integration check: transparent capture, base removal, nested layers, clipping, hidden elements, reconstruction, cached frames/routes, optional remounts, selector diagnostics, reverse sampling, restoration after a failed pass, and a real React/TSX fixture. `npm test` also checks transform hierarchy and source-schema validation. See `.agents/skills/ui-layers/SKILL.md` for the authoring workflow.
