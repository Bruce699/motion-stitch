# Input — input with optional prefix/suffix addons

import { Input } from '~/ui'
Props: all HTML input attributes, plus label, prefix, and suffix

Use for: text entry, search fields, form inputs, and inputs with units, currency symbols, icons, or action buttons.
Do: always pair with a label or aria-label; use prefix for leading addons and suffix for trailing addons.
Don't: put complex interactive elements in addons.

The wrapper handles shared focus/invalid/disabled styling.
Addon clicks auto-focus the input.
The input fills remaining space (flex-1).

Example:
<Input label="Price" placeholder="0.00" prefix="$" suffix="USD" />
