# Select — dropdown for choosing one option

import { Select } from '~/ui'
Props: Base UI root props, including open, defaultOpen, onOpenChange, value, onValueChange; plus label, placeholder, prefix, and options

Use for: choosing one option from a list (5-15 items).
Do: provide label/placeholder text and an options array.
Don't: use for 2-3 options — use Radio for visibility.

Trigger: min-w-40, h-control, rounded-lg, ChevronExpandY icon.
Popup: rounded-lg; min-width matches trigger via --anchor-width.
Items highlight via data-highlighted.
Keyboard: ArrowDown/Up, Enter select, Escape close.

Example:
<Select
value={role}
onValueChange={setRole}
label="Role"
placeholder="Select role"
prefix={<Icon name="Users" />}
options={[
{ value: 'admin', label: 'Admin' },
{ value: 'user', label: 'User' },
]}
/>
