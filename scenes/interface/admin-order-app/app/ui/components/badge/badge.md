# Badge — small inline label for status/categories

import { Badge } from '~/ui'
Props: variant(default|success|info|caution|warning|ai)
className children

Use for: status indicators, counts, tags, category labels.
Do: keep labels to 1-2 words. Don't: use as interactive buttons.
Content: sentence case, concise (e.g. "New", "3 items", "Draft").

Renders <span>. Default variant is neutral gray.

Example:
<Badge variant="success">Active</Badge>
<Badge variant="warning">Overdue</Badge>
<Badge>Draft</Badge>
