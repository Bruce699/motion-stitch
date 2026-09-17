# Icon — Nucleo icon renderer

import { Icon } from '~/ui'
Props: name, size(10|12|14|16|18|20|24), strokeWidth(1.5|1.75|2|2.5), plus Nucleo icon props except className, size, strokeWidth

Use for: app-facing icons that exist in the icon manifest.
Do: choose icons by IconName from the manifest and keep decorative icons aria-hidden.
Don't: import raw Nucleo icons or iconify-icon in app-facing UI.

Default size is 16 and strokeWidth is 1.5.
The rendered SVG gets shrink-0 to avoid flex compression.

Example:
<Icon name="DiscountCode" />
<Icon name="ChevronRight" size={12} strokeWidth={1.75} aria-hidden />
