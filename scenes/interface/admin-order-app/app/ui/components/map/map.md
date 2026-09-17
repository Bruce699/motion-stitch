# Map — styled location map

import { Map } from '~/ui'

Props: center, mapStyle, zoom, className, mapLayerClassName, marker, markerClassName, markerPlacement, markerSizeClassName, plus div attrs except children.

Use for: static location previews in customer, order, and address context.
Do: pass `center` as `[latitude, longitude]` and provide an accessible label when the map carries meaning.
Don't: use for interactive routing, drawing, or map editing.

Uses MapLibre with a non-interactive default OpenFreeMap vector style. The map loads on the client and shows a muted fallback message if MapLibre fails to load. When coordinates change, the marker fades and scales out while the map zooms out, then the marker appears as the map eases to the next position. Use `markerPlacement="coordinate"` for a MapLibre marker anchored to the coordinates, or `markerPlacement="overlay"` for decorative cropped maps that need a fixed visual marker position. Overlay marker placement is measured and applied as a camera offset so the `center` coordinate stays underneath the visual marker.

Example:
<Map
center={[52.3676, 4.9041]}
zoom={12}
className="h-48 rounded-xl"
aria-label="Customer location"
/>
