# Link — router link wrapper

import { Link } from '~/ui'

Props: React Router Link props, plus `as?: 'link' | 'button'`
Types: LinkProps

Use for: internal navigation that should use React Router prefetching.
Do: use `to` for app routes and rely on the default `prefetch="intent"`.
Don't: use for external links — use a normal anchor for off-site destinations.

Wraps React Router's `Link` and defaults prefetching to intent so route assets are fetched when users show navigation intent.
Set `as="button"` when the control must render as a button while still navigating through React Router.

Example:

<Link to="/store/products">Products</Link>
<Link as="button" to="/login">Log out</Link>
