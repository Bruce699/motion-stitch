# Collapsible — show and hide content

```tsx
import { Collapsible } from '~/ui';
```

Sub-components: `Root`, `Trigger`, `Panel`

Use for: controlled or uncontrolled content areas that expand and collapse.

Do:

- Use `Collapsible` for one standalone show/hide region.
- Use `Panel` for the height animation and content opacity/translate transition.
- Put content spacing on `contentClassName` when you want padding or layout inside the animated panel.
- Use `Accordion` instead when multiple related sections belong to the same disclosure group.

Don't:

- Add local open state when Base UI `open`, `defaultOpen`, and `onOpenChange` can model the interaction.
- Add `overflow-hidden` to outer containers that need to preserve shadows.

Behavior:

- Base UI owns state, ARIA, focus, and keyboard behavior.
- `Panel` animates height with `--collapsible-panel-height` plus `data-starting-style` and `data-ending-style`.
- `Panel` wraps children in a content element so the content can fade and translate independently from the height animation.

Example:

```tsx
<Collapsible.Root defaultOpen>
  <Collapsible.Trigger>Toggle details</Collapsible.Trigger>
  <Collapsible.Panel contentClassName="pt-2">Content here</Collapsible.Panel>
</Collapsible.Root>
```
