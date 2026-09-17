# SearchBar — search input with filter action

import { SearchBar } from '~/ui'

Props: Input props except prefix and variant, plus bleed, onFilterClick

Use for: list and table search toolbars.
Do: pass `onFilterClick` when the adjacent filter action opens a filter surface.
Don't: override the search prefix; the component owns the search icon and borderless input composition.

Composes `Input`, `Button`, and manifest icons into a compact search row. Use `bleed` when the surrounding surface already provides padding and background.

Example:
<SearchBar placeholder="Search products" onFilterClick={openFilters} />
