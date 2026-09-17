# SegmentedControl — compact single-choice toggle group

import { SegmentedControl } from '~/ui'

Props: segments, value, defaultValue, onValueChange, ariaLabel
Segment props: label, icon, value, disabled, ariaLabel
Types: SegmentedControlSegment

Use for: compact mode switches such as grid/list views or small mutually exclusive filters.
Do: provide `ariaLabel` for icon-only groups and `ariaLabel` on icon-only segments.
Don't: use for independent toggles or multi-select choices; use Checkbox, Switch, or Combobox instead.

Wraps Base UI ToggleGroup and Toggle for keyboard and ARIA behavior. The active indicator uses a moving shadow layer plus a clipped background layer for a smooth pill transition.

Example:
<SegmentedControl
ariaLabel="Product view"
defaultValue="list"
segments={[
{ value: 'grid', icon: 'Grid', ariaLabel: 'Grid view' },
{ value: 'list', icon: 'TableRows2', ariaLabel: 'List view' },
]}
/>
