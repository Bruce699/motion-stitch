# ShopifyLogo — Shopify brand mark

import { ShopifyLogo } from '~/ui'

Props: variant(mark|full), className, aria-label
Extends svg attrs.

Use for: Shopify brand marks in app chrome, onboarding, and branded empty states.
Do: use `variant="mark"` for compact chrome and `variant="full"` when the wordmark is needed.
Don't: recreate the logo with external image assets.

Renders inline SVG with an accessible image role and a default label based on the selected variant.

Example:
<ShopifyLogo variant="mark" />
