# AnimatedNumber — formatted numeric value

import { AnimatedNumber } from '~/ui'
Props: metric, prefix, suffix, animated, plus span attributes except children

Use for: compact numeric KPIs, counts, amounts, percentages, and right-aligned summary values.
Do: use prefix/suffix for units and currency; enable animated only when revealing or changing important values.
Don't: pass preformatted strings — pass the numeric value and let AnimatedNumber format it.

Preserves the number's decimal precision when formatting.
Renders role="text" with an aria-label containing prefix, formatted metric, and suffix.
Animated numbers slot digits in with Motion while keeping the final width stable.

Example:
<AnimatedNumber metric={1280} prefix="$" />
<AnimatedNumber metric={4.8} suffix="%" animated />
