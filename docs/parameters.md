# Parameter controls

The right panel is generated from `scene.json.parameters`. An agent edits a declaration and uses its value in scene code. It does not write React controls, register a plugin, change editor code or introduce a second persistence path. Definitions, groups and values live together in the scene file and participate in the same file history.

## Control vocabulary

| Type      | Value         | Required metadata                               | Editor                                                        |
| --------- | ------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| `number`  | finite number | `min`, `max`; optional `step` (0.01) and `unit` | Slider and number field; `control: "number"` omits the slider |
| `color`   | `#rrggbb`     | none                                            | Color swatch and editable hex value                           |
| `boolean` | true/false    | none                                            | Toggle                                                        |
| `select`  | string        | `options: [{label, value}]`                     | Dropdown                                                      |
| `vector3` | `[x, y, z]`   | `min`, `max`; optional `step` and `unit`        | XYZ number fields                                             |

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

The shader's behavior belongs to scene code. Tilt supplies controls and typed values; it does not infer arbitrary uniform names or prescribe the effect. `controls.number/color/boolean/select/vector3(key)` verifies the declared type and returns that value. `frame.parameters` remains a plain map for code that needs the full value set, and source adapters receive that same serializable map. Missing keys or wrong reader types fail with a specific error.

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

## Editing and verification

Number/hex fields commit on Enter or blur; Escape cancels the draft. Invalid drafts restore the saved value. Sliders preview while dragging or holding arrow keys and close one history group on release, cancellation or blur. Toggles, choices and color-picker changes write through the same validated command. A native color picker may emit several changes; each is currently a normal history edit rather than one grouped color session.

CLI examples: `set rippleStrength 0.4`, `set rippleEnabled false`, `set rippleTint '#112233'`, `set ripplePattern bands`, `set rippleOrigin '[1,0,2]'`. Ordinary file writes remain the primary agent workflow. Coordinate definition and shader changes in an edit group so neither becomes visible without the other.

Verify the control appears without modifying the editor, changes the intended rendered property, saves the correct JSON type, and survives reload and Undo/Redo. Check backward seeking and an export through the same `sample` path. Grouping labels are not executable bindings, and parameter edits are not automatically keyframes.
