# MetricsBar — horizontal KPI summary

import { MetricsBar } from '~/ui'
Props: ariaLabel, metrics, animated, plus section attributes except children

Use for: horizontal groups of compact KPIs with optional change values and sparklines.
Do: pass structured metric items with numeric values for AnimatedNumber and Sparkline props.
Don't: build repeated metric rows by hand when the layout matches this pattern.

Example:
<MetricsBar
ariaLabel="Order metrics"
metrics={[
{
id: 'orders',
label: 'Orders',
value: { metric: 524 },
change: { metric: 5, prefix: '+', suffix: '%', tone: 'positive' },
sparkline: { data: [42, 44, 43], variant: 'positive' },
},
]}
/>
