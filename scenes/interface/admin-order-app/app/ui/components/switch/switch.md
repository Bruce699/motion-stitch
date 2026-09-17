# Switch — toggle on/off control

import { Switch } from '~/ui'
Exports: Switch
Props: checked, defaultChecked, onCheckedChange, plus either label or ariaLabel

Use for: on/off settings, feature toggles, boolean preferences.
Do: pass label when the switch should render a clickable text label. Pass ariaLabel when the visible label is rendered elsewhere.
Do: when building static UI without real handlers, pass `onCheckedChange={() => {}}` to satisfy the component unless an existing function should handle the change.
Don't: use for actions with side effects — use a Button.

h-4 w-8 pill shape. Thumb animates x position via CSS transitions.
Checked: bg-primary. Unchecked: rgba black/10.
Disabled: opacity-50, not-allowed cursor.

Example:
<Switch checked={enabled} onCheckedChange={setEnabled} label="Enabled" />
<Switch checked={enabled} onCheckedChange={setEnabled} ariaLabel="Enabled" />
