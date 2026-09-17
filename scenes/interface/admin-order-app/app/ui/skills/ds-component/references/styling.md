# Styling Reference

## Core Principles

- **Use the repo's Tailwind CSS version** - Do not introduce utilities unsupported by admin-next
- **Do not use deprecated or removed utilities** - ALWAYS use the replacement
- **Never use `@apply`** - Use CSS variables, the `--spacing()` function, or framework components instead
- **Check for redundant classes** - Remove any classes that aren't necessary
- **Group elements logically** to simplify responsive tweaks later

## clsx() Utility

Import `clsx` directly from `clsx` for combining conditional class names.

```tsx
import { clsx } from 'clsx';

// Merge base classes with user override
<Base.Popup className={clsx('base-classes here', className)} {...props} />;
```

## className Prop Convention

Use React `className` consistently. When the component renders a native HTML element directly:

```tsx
<button className={clsx(buttonClass(variant, size), cls)} {...props}>
```

When wrapping a Base UI primitive, use `className` (Base UI expects React convention):

```tsx
<BaseTooltip.Trigger className={clsx('...', className)} {...props} />
```

## Variant Pattern

Use module-level class constants or maps when a style group is reused or represents a component API such as a variant or size. Keep one-off structural classes inline:

```tsx
const badgeBase = 'inline-flex items-center rounded px-1.5 text-sm';

<span className={clsx(badgeBase, variantStyles[variant], className)} />;
<BaseAccordion.Panel
  className={clsx('h-(--accordion-panel-height) overflow-hidden', className)}
/>;
```

Define variants as `Record<string, string>` maps:

```tsx
const variants: Record<string, string> = {
  primary: 'bg-gray-900 text-white shadow-md ...',
  elevated: 'bg-white shadow-button-elevated ...',
  secondary: 'bg-gray-200 ...',
}

// Apply via clsx()
<element className={clsx(baseClasses, variants[variant], className)} />
```

Size variants follow the same pattern:

```tsx
const sizes: Record<string, string> = {
  default: 'gap-2 h-7.5 px-3 text-base',
  sm: 'gap-1.5 h-6.5 px-2.5 text-sm',
  icon: 'size-7.5',
};
```

## Semantic Tokens And Palette

Do not introduce raw color values when an existing token fits. Use semantic token classes for common surfaces and text, and use curated palette tokens when a component needs a precise neutral or state step:

| Token                                          | Use                                |
| ---------------------------------------------- | ---------------------------------- |
| `bg-primary` / `text-primary-foreground`       | Primary neutral emphasis           |
| `text-secondary` / `text-secondary-foreground` | Secondary text and fills           |
| `bg-muted` / `text-muted-foreground`           | Subtle backgrounds, secondary text |
| `bg-destructive`                               | Errors, delete actions             |
| `bg-background` / `text-foreground`            | Page background, default text      |
| `border`                                       | Borders                            |
| `ring-ring`                                    | Focus rings                        |
| `text-ai` / `bg-ai`                            | AI-specific emphasis               |

Curated palette tokens currently include gray, blue, green, red, and purple. `gray-*` is explicitly allowed for neutral structure, fills, dividers, hover states, and text hierarchy because Admin Next redefines it in `app/ui/tokens/color.css`. `Badge` also uses semantic state colors; add missing palette tokens before introducing a new color family.

## Shadow Tokens

| Token                                 | Use                        |
| ------------------------------------- | -------------------------- |
| `shadow-xs`                           | Subtle elevation (buttons) |
| `shadow-sm`                           | Low elevation (cards)      |
| `shadow-md`                           | Medium elevation           |
| `shadow-lg`                           | Menus and popovers         |
| `shadow-xl` / `shadow-2xl`            | Dialog overlays            |
| `shadow-input` / `shadow-input-focus` | Input and select states    |
| `shadow-button-primary`               | Primary buttons            |
| `shadow-button-elevated`              | Header buttons             |

## Radius Tokens

| Token         | Size                               |
| ------------- | ---------------------------------- |
| `rounded-xs`  | `calc(var(--radius) - 4px)` = 4px  |
| `rounded-sm`  | `calc(var(--radius) - 2px)` = 6px  |
| `rounded-md`  | `calc(var(--radius) + 2px)` = 10px |
| `rounded-lg`  | `calc(var(--radius) + 4px)` = 12px |
| `rounded-xl`  | `calc(var(--radius) + 6px)` = 14px |
| `rounded-2xl` | `calc(var(--radius) + 8px)` = 16px |

## Icons

```tsx
import { Icon } from '~/ui/components/icon/icon';

<Icon name="ChevronExpandY" size={14} />;
```

## Layout and Spacing Rules

### Flexbox and Grid Spacing

#### Always use gap utilities for internal spacing

Gap provides consistent spacing without edge cases (no extra space on last items). It's cleaner and more maintainable than margins on children.

```html
<!-- ❌ Don't do this -->
<div className="flex">
  <div className="mr-4">Item 1</div>
  <div className="mr-4">Item 2</div>
  <div>Item 3</div>
  <!-- No margin on last -->
</div>

<!-- ✅ Do this instead -->
<div className="flex gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

#### Gap vs Space utilities

- **Never use `space-x-*` or `space-y-*` in flex/grid layouts** - always use gap
- Space utilities add margins to children and have issues with wrapped items
- Gap works correctly with flex-wrap and all flex directions

```html
<!-- ❌ Avoid space utilities in flex containers -->
<div className="flex flex-wrap space-x-4">
  <!-- Space utilities break with wrapped items -->
</div>

<!-- ✅ Use gap for consistent spacing -->
<div className="flex flex-wrap gap-4">
  <!-- Gap works perfectly with wrapping -->
</div>
```

### General Spacing Guidelines

- **Prefer top and left margins** over bottom and right margins (unless conditionally rendered)
- **Use padding on parent containers** instead of bottom margins on the last child
- **Always use `min-h-dvh` instead of `min-h-screen`** - `min-h-screen` is buggy on mobile Safari
- **Do not add `min-w-0` or `min-h-0` reset classes** - `app/App.css` already applies `min-width: 0` and `min-height: 0` globally
- **Prefer `size-*` utilities** over separate `w-*` and `h-*` when setting equal dimensions
- For max-widths, prefer the container scale (e.g., `max-w-2xs` over `max-w-72`)

## Typography Rules

### Line Heights

- **Never use `leading-*` classes** - Always use line height modifiers with text size
- **Always use fixed line heights from the spacing scale** - Don't use named values

```html
<!-- ❌ Don't do this -->
<p className="text-base leading-7">Text with separate line height</p>
<p className="text-lg leading-relaxed">Text with named line height</p>

<!-- ✅ Do this instead -->
<p className="text-base/7">Text with line height modifier</p>
<p className="text-lg/8">Text with specific line height</p>
```

### Font Size Reference

Be precise with font sizes - know the actual pixel values:

- `text-xs` = 11px
- `text-sm` = 12px
- `text-base` = 13px
- `text-lg` = 15px
- `text-xl` = 17px
- `text-2xl` = 22px
- `text-3xl` = 26px
- `text-4xl` = 29px

## Color and Opacity

### Opacity Modifiers

**Never use `bg-opacity-*`, `text-opacity-*`, etc.** - use the opacity modifier syntax:

```html
<!-- ❌ Don't do this -->
<div className="bg-opacity-60 bg-red-500">Old opacity syntax</div>

<!-- ✅ Do this instead -->
<div className="bg-red-500/60">Modern opacity syntax</div>
```

## Responsive Design

### Breakpoint Optimization

- **Check for redundant classes across breakpoints**
- **Only add breakpoint variants when values change**

```html
<!-- ❌ Redundant breakpoint classes -->
<div className="px-4 md:px-4 lg:px-4">
  <!-- md:px-4 and lg:px-4 are redundant -->
</div>

<!-- ✅ Efficient breakpoint usage -->
<div className="px-4 lg:px-8">
  <!-- Only specify when value changes -->
</div>
```

## Dark Mode

### Dark Mode Best Practices

- Use the plain `dark:` variant pattern
- Put light mode styles first, then dark mode styles
- Ensure `dark:` variant comes before other variants

```html
<!-- ✅ Correct dark mode pattern -->
<div className="bg-white text-black dark:bg-black dark:text-white">
  <button className="hover:bg-gray-100 dark:hover:bg-gray-800">Click me</button>
</div>
```

## Gradient Utilities

- **ALWAYS Use `bg-linear-*` instead of `bg-gradient-*` utilities** - The gradient utilities were renamed in v4
- Use the new `bg-radial` or `bg-radial-[<position>]` to create radial gradients
- Use the new `bg-conic` or `bg-conic-*` to create conic gradients

```html
<!-- ✅ Use the new gradient utilities -->
<div className="h-14 bg-linear-to-br from-violet-500 to-fuchsia-500"></div>
<div
  className="size-18 bg-radial-[at_50%_75%] from-sky-200 via-blue-400 to-indigo-900 to-90%"
></div>
<div
  className="size-24 bg-conic-180 from-indigo-600 via-indigo-50 to-indigo-600"
></div>

<!-- ❌ Do not use bg-gradient-* utilities -->
<div className="h-14 bg-linear-to-br from-violet-500 to-fuchsia-500"></div>
```

## Working with CSS Variables

### Accessing Theme Values

Tailwind CSS v4 exposes all theme values as CSS variables:

```css
/* Access colors, and other theme values */
.custom-element {
  background: var(--color-red-500);
  border-radius: var(--radius-lg);
}
```

### The `--spacing()` Function

Use the dedicated `--spacing()` function for spacing calculations:

```css
.custom-class {
  margin-top: calc(100vh - --spacing(16));
}
```

### Extending theme values

Use CSS to extend theme values:

```css
@import 'tailwindcss';

@theme {
  --color-mint-500: oklch(0.72 0.11 178);
}
```

```html
<div className="bg-mint-500">
  <!-- ... -->
</div>
```

## New v4 Features

### Container Queries

Use the `@container` class and size variants:

```html
<article className="@container">
  <div className="flex flex-col @md:flex-row @lg:gap-8">
    <img className="w-full @md:w-48" />
    <div className="mt-4 @md:mt-0">
      <!-- Content adapts to container size -->
    </div>
  </div>
</article>
```

### Container Query Units

Use container-based units like `cqw` for responsive sizing:

```html
<div className="@container">
  <h1 className="text-[50cqw]">Responsive to container width</h1>
</div>
```

### Text Shadows (v4.1)

Use text-shadow-\* utilities from text-shadow-2xs to text-shadow-lg:

```html
<!-- ✅ Text shadow examples -->
<h1 className="text-shadow-lg">Large shadow</h1>
<p className="text-shadow-sm/50">Small shadow with opacity</p>
```

### Masking (v4.1)

Use the new composable mask utilities for image and gradient masks:

```html
<!-- ✅ Linear gradient masks on specific sides -->
<div className="mask-t-from-50%">Top fade</div>
<div className="mask-b-from-20% mask-b-to-80%">Bottom gradient</div>
<div className="mask-linear-from-white mask-linear-to-black/60">
  Fade from white to black
</div>

<!-- ✅ Radial gradient masks -->
<div
  className="mask-radial-[100%_100%] mask-radial-from-75% mask-radial-at-left"
>
  Radial mask
</div>
```

## Component Patterns

### Avoiding Utility Inheritance

Don't add utilities to parents that you override in children:

```html
<!-- ❌ Avoid this pattern -->
<div className="text-center">
  <h1>Centered Heading</h1>
  <div className="text-left">Left-aligned content</div>
</div>

<!-- ✅ Better approach -->
<div>
  <h1 className="text-center">Centered Heading</h1>
  <div>Left-aligned content</div>
</div>
```

## Common Pitfalls to Avoid

1. **Using old opacity utilities** - Always use `/opacity` syntax like `bg-red-500/60`
2. **Redundant breakpoint classes** - Only specify changes
3. **Space utilities in flex/grid** - Always use gap
4. **Leading utilities** - Use line-height modifiers like `text-sm/6`
5. **Arbitrary values** - Use the design scale
6. **@apply directive** - Use components or CSS variables
7. **min-h-screen on mobile** - Use min-h-dvh
8. **min-width/min-height zero reset classes** - App.css already applies `min-width: 0` and `min-height: 0` globally, so do not add `min-w-0` or `min-h-0`
9. **Separate width/height** - Use size utilities when equal
10. **Arbitrary values** - Always use Tailwind's predefined scale whenever possible (e.g., use `ml-4` over `ml-[16px]`)
