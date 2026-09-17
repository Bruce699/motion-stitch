# StatusIndicator — compact availability indicator

import { StatusIndicator } from '~/ui'
Props: status(active|caution|warning|inactive), label, plus span attributes

Use for: availability, presence, or compact attention states next to concise labels.
Do: add label when the status is not already described by nearby text.
Don't: use for broad record statuses — use Badge for states like draft, pending, failed, or success.

Active renders a glowing green indicator.
Caution renders a glowing yellow indicator.
Warning renders a glowing red indicator.
Inactive renders a neutral outlined indicator.
The root is an inline-flex span with icon and optional label.

Example:
<StatusIndicator status="active" label="Active" />
<StatusIndicator status="warning" label="Warning" />
<StatusIndicator status="inactive" />
