# Tooltip — hover/focus hint label

import { Tooltip } from '~/ui'
Sub-components: Provider, Root, Trigger, Portal, Positioner, Popup, Arrow

Use for: icon-only buttons, truncated text, supplementary info.
Do: keep text to one short sentence; use Provider to wrap groups.
Don't: put interactive content inside — use Popover.

Scale/opacity animation (0.1s). Arrow rotates based on data-side.
Trigger: 8x8 button. Positioner defaults to sideOffset 8. Popup: px-2 py-1, text-sm, outlined.
Provider wraps multiple tooltips for shared delay behavior.

Example:
<Tooltip.Provider>
<Tooltip.Root>
<Tooltip.Trigger>Hover me</Tooltip.Trigger>
<Tooltip.Portal>
<Tooltip.Positioner>
<Tooltip.Popup>Helpful hint</Tooltip.Popup>
</Tooltip.Positioner>
</Tooltip.Portal>
</Tooltip.Root>
</Tooltip.Provider>
