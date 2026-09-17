# InputButton — button-shaped editable controls

import { InputButton } from '~/ui/components/input-button/input-button'
import { Icon } from '~/ui/components/icon/icon'
Exports: InputButton.Text, Picker, Switch, Checkbox

Use for: compact filter chips, inline editable values, and button-shaped form controls.
Do: wrap related controls in an explicit flex container; pair Picker with Select when choices come from a dropdown.
Don't: use for standard form fields or primary actions.

Text edits inline, commits on blur or Enter, and cancels with Escape. Pass `showPill={false}` when the value should replace the label instead of rendering in the value pill.
Picker displays a label/value and delegates behavior to the parent control. Pass `swatch` to render a color swatch before the label.
Switch and Checkbox expose value and onValueChange while rendering embedded controls.
Pass `squared` to any InputButton primitive when it should use the squared chip shape.

Example:
<div className="flex flex-wrap gap-2">
  <InputButton.Text
    label="Code"
    value={code}
    onValueChange={setCode}
    icon={<Icon name="Pen" />}
  />
  <InputButton.Switch
    label="Once per customer"
    value={oncePerCustomer}
    onValueChange={setOncePerCustomer}
  />
</div>

List example:
<div className="flex flex-wrap gap-1">
  <InputButton.Text
    squared
    showPill={false}
    label="Size"
    value="XS"
    onValueChange={renameSize}
  />
  <InputButton.Picker
    squared
    label="Color"
    value="Green"
    swatch="#10b981"
  />
  <InputButton.Picker
    aria-label="Add size"
    squared
    label=""
    value=""
    icon={<Icon name="Plus" size={14} />}
    onClick={addSize}
  />
</div>
