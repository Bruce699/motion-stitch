# Parameter controls

Animation-specific parameters belong to their timeline action via `tracks[].parameterKeys`; selection reveals them. Use groups for coordinated motion and `durationLabel` for a creative name on the actual track duration. See [animation groups](animation-groups.md). This does not require effect-specific editor code.

The right panel is generated from `scene.json.parameters`. An agent edits a declaration and uses its value in scene code. It does not write React controls, register a plugin, change editor code or introduce a second persistence path. Definitions, groups and values live together in the scene file and participate in the same file history.

The Camera group also contains shared Perspective/Isometric controls backed by `scene.json.camera`. Reuse these for projection, exact angle stops and source alignment; see [the camera contract](camera.md). They share file history with parameters. A declared Camera group receives them above its custom parameters; otherwise Tilt adds the group automatically.

## Control vocabulary

| Type      | Value                          | Required metadata                                                  | Editor                                                        |
| --------- | ------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| `number`  | finite number                  | `min`, `max`; optional `step` (0.01) and `unit`                    | Slider and number field; `control: "number"` omits the slider |
| `color`   | `#rrggbb`                      | none                                                               | Color swatch and editable hex value                           |
| `boolean` | true/false                     | none                                                               | Toggle                                                        |
| `select`  | string                         | `options: [{label, value}]`                                        | Dropdown; `control: "segmented"` for up to five choices       |
| `pad`     | `{ "x": 0, "y": 0 }`           | `x` and `y`: `{min, max, step?, default?}`; optional axis `labels` | XY pad with numeric fields                                    |
| `text`    | string (up to 4000 characters) | optional `placeholder`                                             | Autosizing text field                                         |
| `vector3` | `[x, y, z]`                    | `min`, `max`; optional `step` and `unit`                           | XYZ number fields                                             |

Every definition has a short `label`. `group` is optional. Groups and controls follow first appearance in the JSON object. Omit groups for a handful of unrelated controls; use them to distinguish meaningful subjects, such as Camera or the name of an authored shader. `unit` describes the stored value; it never silently converts it. Existing numeric definitions without `type` remain valid.

Numbers and all vector components must be within the declared range. A choice's value must be one of its unique option values. Colors are six-digit hex; no alpha channel. Separate opacity into a number when needed. Definitions and command edits use the same validator, with no coercion from strings to booleans or numbers.

## Bespoke shader example

Add to `parameters`:

```json
{
  "rippleStrength": {
    "type": "number",
    "label": "Strength",
    "group": "Ripple",
    "value": 0.3,
    "min": 0,
    "max": 1,
    "step": 0.01
  },
  "rippleTint": {
    "type": "color",
    "label": "Tint",
    "group": "Ripple",
    "value": "#c8b9e8"
  },
  "rippleEnabled": {
    "type": "boolean",
    "label": "Enabled",
    "group": "Ripple",
    "value": true
  },
  "ripplePattern": {
    "type": "select",
    "control": "segmented",
    "label": "Pattern",
    "group": "Ripple",
    "value": "soft",
    "options": [
      { "label": "Soft", "value": "soft" },
      { "label": "Bands", "value": "bands" }
    ]
  },
  "rippleOrigin": {
    "type": "vector3",
    "label": "Origin",
    "group": "Ripple",
    "value": [0, 0, 0],
    "min": -10,
    "max": 10,
    "step": 0.1
  }
}
```

Allocate the shader/material/uniforms once in the scene factory, then bind values in its existing `sample` function:

```ts
sample({ time, controls }) {
  material.uniforms.time.value = time;
  material.uniforms.strength.value = controls.number("rippleStrength");
  material.uniforms.tint.value.set(controls.color("rippleTint")); // THREE.Color
  material.uniforms.enabled.value = controls.boolean("rippleEnabled");
  material.uniforms.pattern.value = controls.select("ripplePattern") === "bands" ? 1 : 0;
  material.uniforms.origin.value.fromArray(controls.vector3("rippleOrigin")); // THREE.Vector3
}
```

The shader's behavior belongs to scene code. Tilt supplies controls and typed values; it does not infer arbitrary uniform names or prescribe the effect. `controls.number/color/boolean/select/vector3/pad/text(key)` verifies the declared type and returns that value. `frame.parameters` remains a plain map for code that needs the full value set, and source adapters receive that same serializable map. Missing keys or wrong reader types fail with a specific error.

## Standard conventions

| Intent                          | Declaration and binding                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Layer depth                     | Number in scene units → `layer.object.position.z`; positive Z faces a front camera                            |
| Position                        | `vector3`, scene units → `object.position.fromArray(...)`; relative to the parent                             |
| Rotation                        | `vector3`, `unit: "°"` → convert each component with `THREE.MathUtils.degToRad` before setting Euler rotation |
| Scale                           | `vector3`, neutral `[1,1,1]`, positive range → `object.scale.fromArray(...)`                                  |
| Opacity / normalized strength   | Number, range 0–1 → material opacity or shader uniform; configure transparency in the factory                 |
| Camera distance / field of view | Number with a useful bounded range; degrees for FOV; update the projection matrix after changing FOV          |
| Shader tint                     | `color` → existing `THREE.Color.set(...)`; retain the renderer's color-space conversion                       |
| Visibility / optional effect    | `boolean` → visibility or a shader uniform                                                                    |
| A few distinct modes            | `select`, stable semantic values → scene-owned branch or uniform mapping                                      |

These are conventions, not preset effects. Use stable descriptive keys; group names and labels may change without renaming those keys. For multiple similar objects, prefix keys (for example `navDepth`, `cardDepth`). Expose useful creative decisions rather than every internal constant. Do not expose shader source text as an ordinary text input.

## XY pad and text

```json
{
  "lightOrigin": {
    "type": "pad",
    "label": "Light origin",
    "group": "Light",
    "value": { "x": 0, "y": 0 },
    "x": { "min": -1, "max": 1, "step": 0.01, "default": 0 },
    "y": { "min": -1, "max": 1, "step": 0.01, "default": 0 }
  },
  "caption": { "type": "text", "label": "Caption", "value": "Hello" }
}
```

Read `const {x, y} = controls.pad("lightOrigin")` and set an existing Vector2/uniform with `.set(x, y)`. Use `controls.text("caption")` for authored copy. Pad Y increases upward; define the conversion explicitly if the target uses downward-positive pixels. Shift-drag locks one axis; double-click or Home resets to the declared defaults (otherwise zero clamped into each range). An axis default is a reset target, not a second saved value. Both coordinates and defaults must lie within their axis ranges.

The local Dial Kit fork supplies these widgets automatically. Do not create another persistence store or expose raw shader code through the text widget.

## Editing and verification

Number/hex fields commit on Enter or blur; Escape cancels the draft. Invalid drafts restore the saved value. Sliders preview while dragging or holding arrow keys and close one history group on release, cancellation or blur. Toggles, choices and color-picker changes write through the same validated command. The color plane/hue controls, XY pad and slider each group a gesture into one undo step. Text saves while typing and closes its group on blur. Control writes share a queue so moving between controls or immediately pressing Undo preserves order. Text fields retain native draft undo while focused.

CLI examples: `set rippleStrength 0.4`, `set rippleEnabled false`, `set rippleTint '#112233'`, `set ripplePattern bands`, `set rippleOrigin '[1,0,2]'`, `set lightOrigin '{"x":0.2,"y":-0.4}'`, `set caption '"Hello world"'`. JSON-quote text that looks like a number or boolean to retain its string type. Ordinary file writes remain the primary agent workflow. Coordinate definition and shader changes in an edit group so neither becomes visible without the other.

Verify the control appears without modifying the editor, changes the intended rendered property, saves the correct JSON type, and survives reload and Undo/Redo. Check backward seeking and an export through the same `sample` path. Grouping labels are not executable bindings, and parameter edits are not automatically keyframes.
