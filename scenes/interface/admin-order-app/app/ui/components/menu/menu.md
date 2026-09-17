# Menu — dropdown action menu

import { Menu } from '~/ui'
Props: trigger, options, popupClassName, side, sideOffset, align,
alignOffset, plus Base UI root props including open, defaultOpen,
onOpenChange. Item options support label or children, sublabel, prefix, suffix,
checked, onSelect, disabled.
Heading options render non-selectable group labels.

Use for: contextual actions, overflow menus, right-click menus.
Do: group related items; keep labels action-oriented (verbs).
Don't: use for navigation — use links or section navigation.

Keyboard: ArrowDown/Up navigate, Enter selects, Escape closes.
Items highlight on hover/focus via data-highlighted.
Rounded-lg popup with scale/opacity/translate animation on open.

Example:

  <Menu
    trigger={<Button variant="secondary">Actions</Button>}
    options={[
      { children: 'Edit', onSelect: handleEdit },
      { children: 'Duplicate', onSelect: handleDuplicate },
      { type: 'separator' },
      { children: 'Delete', prefix: <Icon name="Trash" />, onSelect: handleDelete },
    ]}
  />
