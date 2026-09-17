# Shortcut — compact keyboard shortcut hint

import { Shortcut } from '~/ui'

Props: keys

Use for: non-interactive keyboard shortcut hints in menus, footers, toolbars, and command surfaces.
Do: pass keys in the order the user should press them.
Don't: use as a button or attach click handlers.

`keys` is an ordered array of key descriptors. Supported descriptors:
`{ type: 'modifier', name: 'command'|'shift' }`
`{ type: 'action', name: 'enter' }`
`{ type: 'character', value: string }`

Modifier and action descriptors render manifest icons internally. Character descriptors render text.

Example:
<Shortcut keys={[{ type: 'modifier', name: 'command' }, { type: 'character', value: 'K' }]} />
<Shortcut keys={[{ type: 'modifier', name: 'command' }, { type: 'modifier', name: 'shift' }, { type: 'action', name: 'enter' }]} />
