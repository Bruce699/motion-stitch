# Button — clickable action trigger

```tsx
import { Button, buttonClass } from '~/ui';
```

Use for: primary actions, form submits, navigation triggers, and compact toolbar actions.

Do:

- Use `variant="primary"` for the main action in a task.
- Use `variant="elevated"` for toolbar chrome and toolbar actions.
- Use `size="icon"` or `size="sm-icon"` for icon-only buttons with an `aria-label`.
- Use `href` when the action should navigate; Button renders a React Router `Link`.

Don't:

- Use `secondary` for important actions.
- Pass Motion layout props such as `layout`; `href` can render a non-Motion link, so layout animation is not part of the Button API.

Props:

- `variant`: `primary`, `elevated`, `secondary`, `plain`.
- `size`: `default`, `sm`, `icon`, `sm-icon`.
- `tone`: `default`, `destructive`.
- `href`, `prefix`, `suffix`, `className`, `children`.
- Extends Motion button attributes except `layout`, `children`, and the native `prefix` attribute.

`buttonClass(variant, size, tone)` returns the full class string for non-button elements.

Prefix, suffix, and label content animate when they change.

Example:

```tsx
<Button variant="primary">Save</Button>
<Button variant="elevated" size="sm">Cancel</Button>
<Button variant="plain" tone="destructive">Add value</Button>
<Button variant="secondary" size="icon" aria-label="Add">
  <Icon name="Plus" />
</Button>
```
