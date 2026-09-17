# Toast — transient notification stack

import { Toast } from '~/ui'
Sub-components: Trigger, Content
Utilities: Toast.createToastManager, Toast.useToastManager
Props (Toast): Base UI Toast.Provider props, including timeout, limit, and toastManager
Props (Toast.Trigger): children
Props (Toast.Content): label, actionLabel, onActionClick

Use for: transient success, error, loading, and informational notifications.
Do: compose local toasts as `Toast`, `Toast.Trigger`, and `Toast.Content`, mirroring Intent.
Do: use Toast.Trigger around an existing Button or button-like control.
Do: put the toast label, actionLabel, and onActionClick on Toast.Content.
Do: use Toast.createToastManager or Toast.useToastManager for app-level notification entry points.
Do: keep titles and descriptions concise.
Don't: use toasts for blocking confirmation, destructive decisions, or persistent page notices.
Don't: put forms or multi-step flows inside a toast.

`Toast` is a Base UI Toast wrapper. Base UI owns timers, announcements, focus navigation, swipe dismissal, and portal behavior.
`Toast` renders its viewport automatically.
`Toast.Trigger` adds the toast configured by the sibling `Toast.Content` after preserving the child element's own click handler.
`Toast.Content` is declarative configuration for the toast that will be queued by `Toast.Trigger`; it does not render visible DOM.
The internal viewport portals into the same main-content container as Intent by using `IntentPortalContainer`.
It uses the same absolute inset portal positioning model as `Intent.Content`, anchored to the top center.
Stacking, swipe dismissal, expanded offsets, and exit/entry animations follow Base UI's stacked toast pattern and transition state attributes.
Provider manager modes supported.

Example:

```tsx
<Toast timeout={5000} limit={3}>
  <AppShell />
</Toast>;

<Toast>
  <Toast.Trigger>
    <Button>Save</Button>
  </Toast.Trigger>
  <Toast.Content
    label="Your product details are up to date."
    actionLabel="Undo"
    onActionClick={handleUndo}
  />
</Toast>;
```

Global manager:

```tsx
const toastManager = Toast.createToastManager();

<Toast toastManager={toastManager}>
  <Button
    onClick={() => {
      toastManager.add({
        description: 'Your product details are up to date.',
      });
    }}
  >
    Save
  </Button>
</Toast>;
```
