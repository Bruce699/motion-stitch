# Radio — single selection from a group

import { Radio } from '~/ui'
Sub-components: Group, Root

Use for: mutually exclusive choices (2-5 options).
Do: always wrap in a Group; pass label to each Root.
Don't: use for many options — use Select for 5+.

Visual: 4x4 circle, filled dot when checked.
data-checked/data-unchecked for styling.
Focus outline on keyboard navigation.
Group: direction defaults to col and can be set to row. Layout is always flex with gap-4.

Example:
<Radio.Group direction="row">
<Radio.Root value="a" label="Option A" />
<Radio.Root value="b" label="Option B" />
</Radio.Group>
