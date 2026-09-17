# ProgressiveBlur

Edge blur overlay for scrollable or clipped surfaces.

```tsx
import { ProgressiveBlur } from '~/ui';

<div className="relative overflow-hidden">
  <ProgressiveBlur side="bottom" className="h-12" />
</div>;
```

Use for: softening the edge of clipped content.
Do: position inside a relative container and provide the needed height or width.
Don't: use as a page background or decorative glow.
