# ResourcePreview — compact hover preview for Admin resources

import { ResourcePreview } from '~/ui'

Use for: quick previews of customers, orders, products, collections, and discounts.
Do: pass a typed resource from `app/data` and a compact text or image trigger.
Don't: use for long-form detail views or interactive popover content.

Opens on hover or keyboard focus after the tooltip-matched delay. Every preview uses the same structure: header with avatar/icon/image, title, subtitle, then up to 5 icon/text rows.

Example:
<ResourcePreview
type="customer"
resource={customer}
trigger={<span>{customer.name}</span>}
/>
