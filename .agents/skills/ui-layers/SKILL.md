---
name: ui-layers
description: Separate real web UI regions into independently animated 3D layers in Tilt.
---

# Lift real UI into depth

Read `docs/layers.md` and the active source before editing. Use a file edit group when changing source markup, the scene document and composition together. There is one general layer path for vanilla, React, Svelte and other DOM-producing frameworks; do not recreate the UI as Three text or substitute rectangles.

1. Find stable DOM boundaries. Give regions `data-tilt-id` attributes when possible. Declare each in `sources[].layers` with a stable `id` and `selector`. Each selector must resolve to one element after the source adapter finishes sampling. Set `optional: true` for regions that legitimately unmount. Missing required or ambiguous targets are errors.
2. Start with a few meaningful groups: navigation, content, a card, a modal. List them back to front, and ancestors before their descendants. Nested declared regions become nested scene nodes automatically. Every overlapping foreground region that must stay above another extracted region also needs a layer; the remainder is one base behind all layers.
3. Keep the source UI in normal layout. Do not clone/remount it to capture each layer, hide it with `display:none`, or add source-side Z offsets. Tilt captures the full source, a base with extracted paint removed, and transparent crops of the declared regions. The source returns to its ordinary paint state after each capture, including failures.
4. In the scene factory, call `createLayeredSource('ui', {width: 5.8})` once, then add its `group` to the world or an authored rig. `get('navigation').object` is a normal Three group. Animate its `position`, `rotation` or `scale` from absolute time in `sample`. `get(id).mesh.material` can be customized. Set properties from time every sample so reverse seeking works.
5. Browser layout is maintained by a separate internal anchor. The authored object's neutral position/rotation is zero, scale one. Moving a parent carries its children. A child's transform is relative to its parent; do not add the parent's depth again. `get(id).layout` contains sampled CSS-pixel bounds and the captured crop. Do not mutate it or the internal anchor.
6. Allocate materials, meshes and reusable values once. Tilt updates textures and layout before calling scene `sample`. Cached source revisions skip all capture passes. The adapter's revision must change whenever any pixels, layer bounds, visibility or membership change; a stable revision is a promise, not a performance hint.
7. Captures preserve browser-painted borders, fonts, transparency, existing clipping and local effects. Increase `padding` for shadows or paint outside the selected bounds, up to the source viewport. Pixels clipped by an ancestor or viewport remain clipped. To reveal them while lifting, adapt the fixture's clipping boundary deliberately; Tilt cannot recover hidden pixels.
8. Treat backdrop blur, blend modes and ancestor opacity/filter as shared paint dependencies. Group them with their required backdrop or use a dedicated precomposed source. Review `layerWarnings`; never call these exact independent layers merely because a texture exists. Open Shadow DOM requires a source adapter/precomposed surface; closed shadow internals and selectors inside iframes are outside this automatic path. An iframe/canvas/WebGL element can be captured as a whole region, not decomposed internally.
9. The default planes face +Z. With a front camera, positive Z lifts toward the camera. Camera navigation remains inspection; author camera changes in the scene only for the requested shot.
10. Verify the flat start, maximum separation, settled frame, and a backward seek. At rest there must be no duplicate extracted region in the base. Check crop edges, rounded corners, shadows and masks at full resolution. Read fresh context for `layers` (hierarchy, bounds and local transforms), and inspect a video export before delivery. Also check the source in 2D; it remains the original complete UI for comparison.

Layer bounds and padding always use CSS pixels; density changes only raster resolution. Use the shared settings in `docs/resolution.md`, and verify live density changes retain alignment. Do not multiply layer positions, geometry or crop padding by density.

The canonical example is `scenes/interface`: order sections lift at different depths, then settle as a coordinated animation group. `parameters.depth` is scene-authored; it is not a built-in effect. Use the helper for any new scene rather than reproducing capture or alignment code.

For authored layer motion, also read `docs/animation-groups.md`. Declare meaningful animation groups and target references, bind useful controls to those groups, and let expandable child intervals drive individual timing. Layer hierarchy describes spatial containment; animation hierarchy describes coordinated behavior. They need not match.
