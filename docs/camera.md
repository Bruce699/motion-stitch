# Camera projection

The Camera parameter group has a shared Perspective / Isometric switch. Its settings live in `scene.json.camera`, use ordinary file history and affect both the Camera preview and exported frames. Files without this field retain their existing perspective camera. The 2D source view is independent.

```json
{
  "camera": {
    "projection": "orthographic",
    "preset": "isometric",
    "side": "right",
    "sourceId": "ui"
  }
}
```

`projection` is `perspective` or `orthographic`; `side` is `left` or `right`. The default is perspective, with the 30° stop and right orientation remembered for switching to isometric. A partial API edit uses `set_camera` with a `patch`; ordinary JSON edits are the primary agent workflow. Unknown presets and source IDs fail validation.

## Exact stops

The degree labels describe the UI's **projected edges on screen**, not Euler rotation values. Both sets of parallel edges have equal and opposite slopes. The shared renderer uses named stops with exact formulas:

| Preset       | Label | Camera elevation from the UI plane | Heading |
| ------------ | ----- | ---------------------------------- | ------- |
| `front`      | Front | 90°                                | 0°      |
| `diagonal15` | 15°   | `asin(tan(15°))` ≈ 15.542°         | ±45°    |
| `isometric`  | 30°   | `atan(1 / sqrt(2))` ≈ 35.264°      | ±45°    |
| `diagonal45` | 45°   | 90°, with 45° roll                 | ±45°    |

Only the 30° stop is true isometric: equal lengths along X, Y and Z have equal foreshortening. The 15° and 45° stops are other orthographic views. Perspective uses the scene's existing `context.camera`, including its authored position, orientation, field of view and animation.

The formulas come from the original motion-study prototype's `camera-shot.ts` and `apply-camera-shot.ts` (Admin Next commit `d59df618`), adapted from its horizontal XZ plane to Tilt's upright XY source plane. Do not round the stored elevation or independently invent another camera preset system.

## Align to the actual UI

`createLayeredSource(id, {width})` automatically registers its group as that source's camera frame. Local X and Y define the UI plane; local positive Z is depth. Each frame, the camera follows that group's world position and orientation. Parent translation and rotation therefore do not disturb the exact projected edge angles. Layer Z separation still renders normally. Independently rotated child layers have their own orientation and are not forced into alignment.

For a custom whole-surface mesh or another composition, register an equivalent frame once in the scene factory:

```ts
const plane = new THREE.Mesh(geometry, material); // local XY geometry
world.add(plane);
registerCameraFrame("ui", plane);
```

`sourceId` selects the reference frame. With multiple sources the editor shows an **Align to** dropdown. If omitted, Tilt uses the first declared source's registered frame, or world XY when that source has no registered frame. An explicitly selected source must have a registered frame. Frames must have nonzero scale and perpendicular axes; nonuniform orthogonal scale works, but sheared frames are rejected. Multiple differently oriented sources cannot all have exact isometric slopes in one camera; choose the reference intentionally.

Orthographic framing derives from the authored perspective camera's field of view, zoom and distance to the frame origin. Front matches its plane-height framing; angled views can occupy different screen bounds. Continue using meaningful authored distance/framing controls. The supplied camera is unparented. The saved orthographic setting owns viewing orientation, so authoring rotation on the perspective camera does not tilt an isometric shot.

## Inspection and export

In Perspective, drag to orbit and Shift/right/middle-drag to pan. In Isometric, any drag pans: arbitrary orbit would break the chosen alignment. Scroll/pinch zoom and Fit still work. Existing perspective inspection orbit is retained but ignored while isometric is active, then restored when returning to perspective.

Pan, zoom and orbit remain temporary viewer inspection; they never change the exported composition. `scene.json.camera` is authored state and is included in frozen exports. Preview, paused captures and export use the same projection function. Agent context reports both the saved `camera` settings and the viewer's `inspection`; do not confuse them or write observation files to control the scene.
