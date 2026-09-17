# Combobox — searchable select dropdown

import { Combobox } from '~/ui'
Props: Base UI combobox root props including value, defaultValue, onValueChange, open, defaultOpen, onOpenChange; plus label, placeholder, searchPlaceholder, options, trigger, variant, selectionMode, multipleSelectionLabel, createOptionLabel, onCreateOption, footer

Use for: choosing one or more options from a searchable list, especially when filtering or creating values matters.
Do: provide concise option labels, a useful searchPlaceholder, and a multipleSelectionLabel for multi-select counts.
Don't: use for plain non-searchable single selection — use Select.

Defaults to a multiple-selection Base UI combobox. Set selectionMode="single" for searchable single-choice flows.
Options support value, label, heading, disabled, and internal action rows.
Use onCreateOption with createOptionLabel for creatable entries.
Use footer for a single medium-weight secondary action with an icon and label at the bottom of the popup.
Default trigger uses min-w-40, h-control, rounded-lg, ChevronExpandY, and a searchable popup. Use variant="borderless" or trigger for compact embedded controls.

Example:
<Combobox
value={collections}
onValueChange={setCollections}
label="Collections"
placeholder="Select collections"
searchPlaceholder="Search collections"
multipleSelectionLabel={(count) => `${count} collections`}
options={[
{ value: 'shirts', label: 'Overshirts' },
{ value: 'accessories', label: 'Accessories' },
]}
/>
