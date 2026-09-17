# Accordion — collapsible section groups

```tsx
import { Accordion } from '~/ui';
```

Sub-components: `Root`, `Item`, `Header`, `Trigger`, `Panel`

Use for: groups of related disclosure sections such as settings groups, FAQs, and detail lists.

Do:

- Use `Accordion.Root` when multiple sections belong to the same group.
- Keep trigger labels short, descriptive, and unique.
- Put spacing for panel content inside the panel children so each use can match its surrounding layout.
- Use `Collapsible` instead when you only need one standalone show/hide region.

Don't:

- Add local open state when Base UI `value`, `defaultValue`, and `onValueChange` can model the interaction.
- Put buttons, menus, or other interactive controls inside `Accordion.Trigger`.
- Nest accordions inside accordions.

Behavior:

- Base UI owns state, ARIA, focus, and keyboard behavior.
- `Panel` animates height with `--accordion-panel-height` plus `data-starting-style` and `data-ending-style`.
- `Trigger` includes the system chevron icon and rotates it from Base UI's `data-panel-open` state.

Example:

```tsx
<Accordion.Root defaultValue={['details']}>
  <Accordion.Item value="details">
    <Accordion.Header>
      <Accordion.Trigger>Store details</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>
      <div className="p-3">Review profile, markets, and currency.</div>
    </Accordion.Panel>
  </Accordion.Item>
  <Accordion.Item value="billing">
    <Accordion.Header>
      <Accordion.Trigger>Billing</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>
      <div className="p-3">Plan, payment method, and invoice history.</div>
    </Accordion.Panel>
  </Accordion.Item>
</Accordion.Root>
```
