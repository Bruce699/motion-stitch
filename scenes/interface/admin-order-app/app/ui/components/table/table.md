# Table — data table with rows and columns

import { Table } from '~/ui'
Sub-components: Root, Head, Body, Row, Header, Cell
Props (Root): bleed(bool) dense(bool) grid(bool) striped(bool) stickyHeader(bool)
Props (Row): href(str) target(str) title(str) — provides a destination for linked cells
Props (Cell): link(bool) — render the row href as a link overlay for this cell

Use for: structured data display with sortable/clickable cells.
Do: use stickyHeader for long lists; use dense for compact data.
Don't: use for layout — use CSS grid/flex.

Head sticks to top with z-10 when stickyHeader enabled.
Striped alternates row backgrounds. Grid adds cell borders.
Bleed applies page gutters while preserving horizontal scrolling.
Tables keep their intrinsic content width and scroll horizontally when needed.
Rows with href do not link every cell automatically. Mark only the primary cells
with link.

Example:
<Table.Root stickyHeader>
<Table.Head>
<Table.Row>
<Table.Header>Name</Table.Header>
<Table.Header>Status</Table.Header>
</Table.Row>
</Table.Head>
<Table.Body>
<Table.Row href="/item/1">
<Table.Cell link>Item 1</Table.Cell>
<Table.Cell>Active</Table.Cell>
</Table.Row>
</Table.Body>
</Table.Root>
