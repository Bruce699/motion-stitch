# Sparkline

Small inline SVG sparkline for showing trend data.

## Usage

```tsx
import { Sparkline } from "~/ui"

// Basic
<Sparkline data={[10, 14, 8, 12, 16, 11, 9]} />

// With tooltip
<Sparkline data={[10, 14, 8, 12, 16, 11, 9]} tooltip />

// Custom tooltip formatter
<Sparkline data={[10, 14, 8]} tooltip={(value, index) => `Point ${index}: ${value}`} />

// Variants
<Sparkline data={[...]} variant="positive" />
<Sparkline data={[...]} variant="negative" />

// With label
<Sparkline data={[...]} variant="positive" label="+12%" />

// Custom size
<Sparkline data={[...]} width={128} height={32} strokeWidth={2} />
```

## Props

| Prop          | Type                                                  | Default     | Description                            |
| ------------- | ----------------------------------------------------- | ----------- | -------------------------------------- |
| `data`        | `number[]`                                            | required    | Array of numeric values                |
| `variant`     | `"default" \| "positive" \| "negative"`               | `"default"` | Stroke color                           |
| `label`       | `string`                                              | —           | Optional label using the variant color |
| `tooltip`     | `boolean \| (value: number, index: number) => string` | `false`     | Cursor-following tooltip               |
| `width`       | `number`                                              | `64`        | SVG width in px                        |
| `height`      | `number`                                              | `20`        | SVG height in px                       |
| `strokeWidth` | `number`                                              | `1.5`       | Line thickness                         |
| `className`   | `string`                                              | —           | Additional classes                     |

Remaining props spread onto the root `<svg>`.
