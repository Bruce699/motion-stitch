# Checkbox — toggle boolean state

```tsx
import { Checkbox } from '~/ui';
```

Sub-components: `Root`, `Indicator`

Use for: boolean toggles, multi-select lists, terms acceptance.

Do:

- Pass `label` for visible text.
- Use `aria-label` for table-only or visually unlabeled controls.
- Use `indeterminate` for select-all controls with a mixed state.

Don't:

- Use Checkbox for mutually exclusive options; use `Radio`.
- Add custom check icons unless the default indicator cannot express the state.

Behavior:

- Base UI owns checked state, ARIA, focus, and keyboard behavior.
- `Checkbox` renders `Root` plus `Indicator` and can wrap itself in a label.
- `Indicator` animates check and indeterminate states with Base UI transition attributes.
- `Root` supports Base UI state attributes such as `data-checked`, `data-unchecked`, and `data-indeterminate`.

Example:

```tsx
<Checkbox label="Track quantity" />
```

Indeterminate example:

```tsx
<Checkbox aria-label="Select all products" checked indeterminate />
```

Low-level composition remains available:

```tsx
<Checkbox.Root>
  <Checkbox.Indicator />
</Checkbox.Root>
```
