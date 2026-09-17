# Dialog — modal dialog for focused tasks

import { Dialog } from '~/ui'
Sub-components: Trigger, Content, Close
Props (Dialog): Base UI Dialog.Root props, including open, defaultOpen, onOpenChange
Props (Dialog.Content): Base UI Dialog.Popup props plus type and placement

Use for: edit forms, detail views, multi-step flows.
Do: keep content focused on a single task; provide a clear title.
Don't: use for lightweight inline disclosure or non-modal content.

`Dialog` is a thin Base UI Dialog wrapper with the same composition shape as `Intent`.
`Dialog.Content` renders the portal, backdrop, and popup together. Set `type="dialog"` for page-level modal behavior.
`Dialog.Content` placement defaults to `top` for page-level dialogs and `middle` for intent dialogs. Use `placement="middle"` when a page-level dialog should be centered.

Exit animation uses Base UI transition state attributes.
Content animates translate/scale/opacity/blur.
Controlled and uncontrolled modes supported.

Example:

<Dialog>
<Dialog.Trigger>Edit</Dialog.Trigger>
<Dialog.Content type="dialog">
<h2>Edit profile</h2>
<p>Update your details.</p>

<form>...</form>
<Dialog.Close>Cancel</Dialog.Close>
</Dialog.Content>
</Dialog>
