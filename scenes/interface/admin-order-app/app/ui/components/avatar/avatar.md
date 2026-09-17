# Avatar — compact identity marker

import { Avatar } from '~/ui'

Props: initials, name, rounded, size(sm|md|lg), src, className
Extends span attrs except children.

Use for: compact identity markers for people and entities.
Do: pass `name` so the avatar has an accessible label and title.
Don't: use for product or collection imagery — use `Image`.

Renders an entity-style rounded-square marker by default. Pass `rounded` for person/user avatars. Default size is `md` (24px); `sm` and `lg` map to 20px and 32px. If `src` is provided, the image fills the marker; otherwise initials are shown on a muted surface.

Example:
<Avatar initials="AK" name="Ari Kara" rounded />
<Avatar initials="MS" name="Mina Stone" size="lg" />
