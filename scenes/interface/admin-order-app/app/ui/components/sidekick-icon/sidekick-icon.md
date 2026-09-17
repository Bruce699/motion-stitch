# SidekickIcon — animated Sidekick orb

import { SidekickIcon } from '~/ui'
Props: state(idle|active|loading)

Use for: compact Sidekick identity marks in AI prompts, launchers, and assistant surfaces.
Do: choose `active` while Sidekick is engaged and `loading` while a response or action is in progress.
Don't: use it as a decorative icon for non-Sidekick AI features or pair it with additional accessible text unless the surrounding control needs a label.

The icon is `aria-hidden` and renders a fixed-size animated orb. The face video loops the segment for the selected state; background orb motion respects reduced-motion styles.

Example:
<SidekickIcon />
<SidekickIcon state="active" />
<SidekickIcon state="loading" />
