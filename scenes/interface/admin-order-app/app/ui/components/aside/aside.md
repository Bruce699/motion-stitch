# Aside — right-rail summary and controls

```tsx
import { Aside } from '~/ui';
```

Sub-components: `Root`, `Group`, `Item`, `Timeline`

Use for: right-rail summaries with status controls, metadata, metrics, opportunities, and compact timelines.

Do:

- Group related rows with `Aside.Group`.
- Use `heading` for standard group labels.
- Use `opportunities` on `Aside.Group` only for the dedicated opportunities carousel group.
- Use `className` on `Root` or `Group` for layout-level adjustments.

Don't:

- Use Aside for primary page content or wide layouts.
- Hand-roll select, combobox, menu, status, or metric rows inside the rail.
- Put unrelated page actions in the rail when they belong in the route header.

Props:

- `Aside.Root`: `div` props.
- `Aside.Group`: `section` props plus `heading` and `opportunities`.
- `Aside.Item`: typed item props.
- `Aside.Timeline`: `events` and `placeholder`.

Item types:

- `metric`: label/value row with optional `prefix`, `suffix`, `animated`, `tone`, and `sparkline`.
- `select`: compact trigger row backed by `Select`.
- `combobox`: compact trigger row backed by `Combobox`.
- `menu`: compact trigger row backed by `Menu`; uses check indicators by default and `optionIndicator="switch"` for switch indicators.
- `status`: compact status trigger row backed by `Select`.
- `info`: static metadata row with optional icon.
- `opportunities`: dedicated carousel content for an opportunities group.

Timeline events include `date`, `staffMember`, `body`, and `time`.

Example:

```tsx
<Aside.Root>
  <Aside.Group>
    <Aside.Item
      type="status"
      status="active"
      value="active"
      options={[
        { value: 'active', label: 'Active' },
        { value: 'draft', label: 'Draft' },
      ]}
    />
  </Aside.Group>
  <Aside.Group heading="Metrics">
    <Aside.Item type="metric" title="Sales" prefix="$" metric={1280} animated />
  </Aside.Group>
  <Aside.Group heading="Timeline">
    <Aside.Timeline events={events} />
  </Aside.Group>
</Aside.Root>
```
