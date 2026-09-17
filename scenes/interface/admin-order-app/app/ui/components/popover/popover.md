# Popover — floating content panel anchored to a trigger

import { Popover } from '~/ui'
Sub-components: Title, Description
Props: Base UI root props, plus trigger, side, align, sideOffset, alignOffset, className, popupClassName

Use for: contextual info, inline forms, preview cards.
Do: keep content focused; dismiss on outside click.
Don't: use for simple tooltips — use Tooltip.

Positioned via sideOffset={4}. Uses the same short scale/opacity animation pattern as Tooltip.
transform-origin set automatically via CSS variable.

Example:
<Popover trigger={<Button>Info</Button>}>
<Popover.Title>Details</Popover.Title>
<Popover.Description>Additional info here.</Popover.Description>
</Popover>
