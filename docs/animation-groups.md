# Animation groups

The timeline exposes editable creative actions, not every object in the scene. When authoring motion, create a named animation track for each action the person will adjust independently. Use a `kind: "group"` track when several targets act together. Groups start collapsed; their children are available for individual timing. Static layers do not need tracks. Keep camera motion separate when it should be edited independently.

Animation behavior stays in scene code. There is no effect catalogue, private widget system or second clock. The shared contract gives arbitrary behavior consistent timing, selection, controls, persistence and undo.

## Declaration

```json
[
  { "id": "settle", "label": "Cards settle", "kind": "group", "color": "#00bca6",
    "start": 0, "end": 6, "durationLabel": "Settle time", "parameterKeys": ["lift"] },
  { "id": "settle-payment", "label": "Payment", "kind": "animation", "parentId": "settle",
    "color": "#00bca6", "start": 1, "end": 5,
    "targets": [{ "kind": "layer", "sourceId": "ui", "layerId": "payment" }] }
]
```

Store this array in `scene.json.tracks`; declare `lift` in `parameters` using the shared control vocabulary. Selecting the group shows its Start, Settle time and Lift. Bound parameters appear contextually, while unbound parameters stay global. `durationLabel` names the actual track duration; do not duplicate it as an unrelated parameter.

`parentId` references a group. IDs are unique across the scene, groups can nest, and cycles or children outside their parent's time interval fail validation. File order orders siblings. Existing flat tracks remain valid. `targets` identifies declared source layers, the camera (`{"kind":"camera"}`), or authored Three.js objects (`{"kind":"object","id":"hero"}`). Object IDs are scene-owned; scene code must resolve them. Targets are semantic references, not automatic transforms. The same target may participate in different animation tracks.

All times are absolute seconds. Moving a group shifts every descendant and cue; resizing scales their times proportionally. Child edits stay within their parent. This is one file-backed history operation. Root edits snap to frames; descendants preserve proportional timing, including subframe offsets. Cue `keys` remain visual markers, not executable keyframes.

## Track colors

Choose label colors from the shared palette in `src/core/track-colors.ts`: blue `#047efe`, orange `#ff6600`, teal `#00bca6`, red `#ff1c32`, pink `#ff2796`, purple `#8c51fe`, amber `#ff9800`, and brown `#976639`. These are the supplied reference swatches converted to sRGB with a small saturation lift. Store the chosen hex in each track or clip's `color`; the timeline displays that saved value, so reordering or renaming never changes it. Keep a coordinated group and its children the same color; use another color for an independent action. New composition clips default to teal. Custom hex colors remain supported.

Child bars inherit their root group's hue in the editor. Each nesting level mixes in 22% more black in dark mode or white in light mode, capped at 55% total tint. Siblings have the same tint; nested groups step down with their depth. This styling never rewrites saved colors or changes scene rendering.

## Executable timing

Read track timing from the current sample document, never a cached factory document or hard-coded duration:

```ts
// `motion` comes from the scene factory context; no external runtime imports.
sample({time, document, controls}) {
  const track = document.tracks.find(t => t.id === "settle-payment")!;
  const progress = motion.clamp((time - track.start) / (track.end - track.start));
  payment.object.position.z = controls.number("lift") * (1 - ease(progress));
}
```

This progress clamps to zero before Start and one after End. The scene chooses easing and whether to hold, hide or otherwise handle those endpoints. The timeline does not infer visibility. Child intervals encode stagger and remain editable; do not recompute them from array index each frame. Arbitrary shaders, choreography and composition remain free-form. Keep runtime dependencies inside the scene or use injected helpers so frozen previews and exports can resolve them.

## Agent completion checklist

- Name rows after editable actions (Cards settle, Camera drift), not only the whole imported page.
- Group coordinated motion; add child rows only for independently adjustable timing or controls. Do not create a row for every DOM node.
- Bind useful parameters to their owning animation with `parameterKeys`. Use `durationLabel` when a creative name makes duration clearer. Camera-only controls use the Camera parameter group so 2D stays contextual.
- Make timeline timing drive the executable behavior. Document any custom endpoint behavior.
- Verify collapsed selection, expansion, group move/resize, one child edit, contextual parameter changes, Undo/Redo and reload. Sample backward and inspect entry, midpoint and settled frames. A pretty lane with no effect on playback is unfinished.

See `scenes/interface/scene.json` and `scene.ts` for coordinated layered motion plus independent camera tracking.
