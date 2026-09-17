# DataTable — declarative table from column definitions

import { DataTable, type ColumnDef } from '~/ui'
Props: items(T[]) columns(ColumnDef<T>[]) emptyState(str|{title,description})
rowKey((item,index)=>key) stickyHeader(bool)
ColumnDef<T>: { header(str) render(item,index)=>node align?(left|right|center) }

Use for: data lists with consistent column structure.
Do: always type columns as ColumnDef<T>[] with your item type — never use an untyped array.
Do: provide rowKey for stable rendering; use align="right" for numbers.
Don't: use for free-form layouts — use Table directly.

Built on Table sub-components. Supports sticky header.
Empty state renders centered message when items is empty.

## Example — typed columns (required pattern)

type Order = { id: string; customer: string; status: string; total: number; date: string }

const columns: ColumnDef<Order>[] = [
{ header: 'Order', render: (o) => o.id },
{ header: 'Customer', render: (o) => o.customer },
{ header: 'Total', render: (o) => `$${o.total}`, align: 'right' },
]

<DataTable
items={orders}
columns={columns}
rowKey={(o) => o.id}
stickyHeader
/>
