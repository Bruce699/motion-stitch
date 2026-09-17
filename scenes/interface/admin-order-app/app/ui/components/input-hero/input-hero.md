# InputHero — large borderless value input

import { InputHero } from '~/ui'
Props: all HTML input attributes except native size, plus required label

Use for: prominent editable values inside summary or configuration cards.
Do: use for primary page-level values that need an oversized editable text treatment.
Don't: use for normal form rows; use Input or InputCombo instead.

The component is borderless and uses an inset pseudo element for hover/focus emphasis.

Example:
<InputHero label="Product title" value={title} onChange={setTitle} />
