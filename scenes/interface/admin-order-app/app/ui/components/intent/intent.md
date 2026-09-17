# Intent — scoped overlay

import { Intent } from '~/ui'
Sub-components: Trigger, Content, Close
Props (Intent): Base UI Dialog.Root props
Props (Intent.Content): Base UI Dialog.Popup props plus type

Use for: contextual task surfaces that should feel modal within a specific app region instead of the whole page.
Do: author intents with the same basic shape as Base UI Dialog: `Intent`, `Intent.Trigger`, `Intent.Content`, and `Intent.Close`.
Don't: use for page-level blocking dialogs — use Dialog.

`Intent` is a thin Base UI Dialog wrapper. `Intent.Content` renders the portal, backdrop, and popup together with scoped intent styling.
Use `type="dialog"` in design-system docs and previews so the example opens as a page-level modal.

Example:
<Intent>
<Intent.Trigger>
<Button>Edit</Button>
</Intent.Trigger>
<Intent.Content type="dialog">
<>

<p>Update details in this workspace.</p>
<Intent.Close>
<Button>Done</Button>
</Intent.Close>
</>
</Intent.Content>
</Intent>

Controlled:
const [open, setOpen] = useState(false)

<Intent open={open} onOpenChange={setOpen}>
...
</Intent>

Uncontrolled:
<Intent defaultOpen>
...
</Intent>
