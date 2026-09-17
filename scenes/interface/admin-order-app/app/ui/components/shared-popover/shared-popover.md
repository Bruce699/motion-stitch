# SharedPopover — animated shell for shared popovers

import { SharedPopover } from '~/ui'
Sub-components: Provider, Root, Trigger, Popup, Content, CursorTrigger
Helpers: createHandle, getCursorTriggerProps

Use for: shared hover/focus popovers that need the same shell animation.
Do: use Root and Trigger for element-anchored shared popovers; use CursorTrigger only for pointer-follow previews.
Don't: put resource-specific UI or navigation-specific state in this component.

Element anchoring is the default pattern: render SharedPopover.Root with a shared handle created by createHandle, then attach payloads with SharedPopover.Trigger. Cursor anchoring is opt-in and handles hover/focus delay, pointer tracking, viewport bounds, and global dismissal.

Example:
<SharedPopover.Root handle={handle} popupClassName="dark">
<SharedPopover.Content>
Content
</SharedPopover.Content>
</SharedPopover.Root>
