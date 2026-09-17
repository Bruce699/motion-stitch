# Image — product and collection media

import { Image } from '~/ui'

Props: src alt size borderRadius shadow withBorder objectFit pillIcon pillLabel loading decoding onLoad className
Types: ImageProps, ImageBorderRadius, ImageShadow

Use for: product thumbnails, collection cards, and media previews.
Do: provide meaningful `alt` text for content images and `alt=""` for decorative table thumbnails.
Don't: use raw img tags for admin product media when loading, empty, border, or pill affordances are needed.

Supports fixed numeric/string sizing or `size="full"`, rounded token radii, lazy loading props, placeholder fade-in, an empty image state, and optional pill metadata.

Example:
<Image src="/products/deck.jpg" alt="Skateboard deck" size={40} borderRadius="lg" loading="lazy" />
