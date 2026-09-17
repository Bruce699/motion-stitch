# ShimmerText — animated text highlight

import { ShimmerText } from '~/ui'

Props: children, className
Extends span attrs except children.

Use for: subtle loading, AI, or attention moments in short text.
Do: keep the content brief so the shimmer remains decorative.
Don't: use for long paragraphs, primary body copy, or critical status text.

Applies a clipped gradient animation to text while preserving the inline span structure.

Example:
<ShimmerText>Generating recommendation</ShimmerText>
