# SettingsActionList — icon-led settings rows

import { SettingsActionList } from '~/ui'
Props: items

Use for: repeated settings rows with icons, titles, optional descriptions, current values, navigation affordances, or switches.
Do: use in settings sections when rows follow the standard icon/title/value/control pattern.
Do: provide concise titles and use descriptions only when the row needs extra context.
Do: use control="switch" for boolean settings that should render an inline switch.
Don't: hand-roll custom icon, divider, chevron, and switch markup when this shared row pattern fits.
Don't: use for materially different layouts, dense tables, or multi-control form groups.

Rows render an icon at the leading edge. Value rows show a value when provided and use ChevronExpandY for value selectors or ChevronRight for navigation-only rows. Switch rows render `Switch` with the row title shown beside the control. Dividers are inset under the row content.

Example:

<SettingsActionList
  items={[
    {
      title: 'Customer notifications',
      icon: 'Envelope',
      value: 'Enabled',
    },
    {
      title: 'Auto-capture payments',
      icon: 'CreditCard',
      description: 'Capture payment when orders are fulfilled.',
      control: 'switch',
      defaultChecked: true,
    },
  ]}
/>
