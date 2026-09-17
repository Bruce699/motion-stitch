# Admin Next - Style Reference

> Dense command surface in soft daylight - compact type, superellipse corners, and layered micro-shadows make work feel calm, fast, and precise.

**Theme:** light and dark

Admin Next's design system is a compact operational interface, not a marketing page. Its center of gravity is a near-achromatic grayscale system: white and off-white surfaces, charcoal text, fine borders, and small state palettes for blue, green, red, and purple AI emphasis. The default UI density is tight: 30px controls, 13px base text, 12px labels, and narrow gaps that keep tables, forms, and settings screens scannable. Shape is the signature move: every element receives `corner-shape: superellipse(1.333)`, so an 8px or 10px radius reads softer than a standard rounded rectangle without becoming pill-like. Elevation is real but restrained: low-opacity stacked shadows, inset highlights, and 1px borders separate layers while preserving the feeling of a flat admin workspace.

The design system's canonical package tokens live in `app/ui/tokens/*.css`. The app shell imports them directly from `app/App.css` alongside global utilities and shared prose styles. Components are React 19 wrappers over native elements or Base UI primitives. App code should import components from direct modules such as `~/ui/components/button/button`; do not import from the root `~/ui` barrel.

## Tokens - Colors

### Core Palette

| Name         | Value                   | Token                         | Role                                                   |
| ------------ | ----------------------- | ----------------------------- | ------------------------------------------------------ |
| Gray 50      | `#f7f7f7`               | `--color-gray-50`             | Muted neutral surface tint                             |
| Gray 100     | `#f5f5f5`               | `--color-gray-100`            | Muted panels, flat button background, highlighted rows |
| Gray 200     | `#f2f2f2`               | `--color-gray-200`            | Secondary neutral fill                                 |
| Gray 300     | `#ebebeb`               | `--color-gray-300`            | Standard borders and soft dividers                     |
| Gray 400     | `#d1d1d1`               | `--color-gray-400`            | Focus ring and low-contrast borders                    |
| Gray 500     | `#868686`               | `--color-gray-500`            | Muted foreground, group labels, tertiary copy          |
| Gray 600     | `#606060`               | `--color-gray-600`            | Secondary text and icons on light surfaces             |
| Gray 700     | `#5d5d5d`               | `--color-gray-700`            | Strong secondary text                                  |
| Gray 800     | `#454545`               | `--color-gray-800`            | High-emphasis neutral fill or dark hover state         |
| Gray 900     | `#202020`               | `--color-gray-900`            | Primary button fill, dark emphasis surfaces            |
| Gray 950     | `#151515`               | `--color-gray-950`            | Inset shadow color for black buttons                   |
| Gray Base    | `#101010`               | `--color-gray-base`           | App-level primary text and maximum neutral ink         |
| Blue 50-950  | `#eff6ff` ... `#172554` | `--color-blue-*`              | Focus, informational state, and input emphasis         |
| Green 50-950 | `#f0fdf4` ... `#052e16` | `--color-green-*`             | Success and active state                               |
| Red 50-950   | `#fef2f2` ... `#450a0a` | `--color-red-*`               | Error, danger, and destructive state                   |
| Purple 500   | `#7D5AFF`               | `--color-purple-500` / `--ai` | AI-specific emphasis                                   |

### Semantic Colors

| Name                 | Light Value               | Dark Value                  | Token                                                     | Role                                             |
| -------------------- | ------------------------- | --------------------------- | --------------------------------------------------------- | ------------------------------------------------ |
| Background           | `var(--color-white)`      | `oklch(0.145 0 0)`          | `--background` / `--color-background`                     | Page canvas and default body background          |
| Foreground           | `var(--color-gray-base)`  | `oklch(0.985 0 0)`          | `--foreground` / `--color-foreground`                     | Primary text and icon color                      |
| Primary Text         | `var(--color-gray-base)`  | `var(--color-gray-50)`      | `--text-primary` / `--color-primary`                      | High-emphasis text and selected neutral emphasis |
| Primary Foreground   | `var(--color-white)`      | `oklch(0.205 0 0)`          | `--primary-foreground` / `--color-primary-foreground`     | Text on dark primary actions                     |
| Secondary Text       | `var(--color-gray-600)`   | `var(--color-gray-200)`     | `--text-secondary` / `--color-secondary`                  | Secondary labels and descriptions                |
| Secondary Foreground | `var(--color-gray-600)`   | `oklch(0.985 0 0)`          | `--secondary-foreground` / `--color-secondary-foreground` | Text on secondary fills                          |
| Muted                | `var(--color-gray-50)`    | `oklch(0.269 0 0)`          | `--muted` / `--color-muted`                               | Subtle backgrounds and disabled regions          |
| Muted Foreground     | `var(--color-gray-500)`   | `oklch(0.708 0 0)`          | `--muted-foreground` / `--color-muted-foreground`         | Secondary labels, descriptions, placeholders     |
| Destructive          | `var(--color-red-100)`    | `oklch(0.704 0.191 22.216)` | `--destructive` / `--color-destructive`                   | Destructive surfaces and error emphasis          |
| Border               | `var(--color-gray-200)`   | `oklch(1 0 0 / 10%)`        | `--border` / `--color-border`                             | Standard borders and dividers                    |
| Ring                 | `var(--color-gray-400)`   | `oklch(0.556 0 0)`          | `--ring` / `--color-ring`                                 | Focus rings and high-attention outlines          |
| AI                   | `var(--color-purple-500)` | `var(--color-purple-500)`   | `--ai` / `--color-ai`                                     | AI-specific emphasis                             |

### Theme Layering

`app/App.css` is the global CSS manifest: it excludes docs/agent source directories from Tailwind scanning, imports Tailwind, imports the split token files, and owns app-wide base rules plus small utility adjustments. The base layer applies `corner-shape: superellipse(1.333)`, thin scrollbars, `min-width: 0`, `min-height: 0`, pretty paragraph wrapping, pointer cursors for buttons, and block, non-shrinking SVG defaults. Because every element is already protected by the global `min-width: 0` and `min-height: 0` reset, do not add Tailwind reset classes for those same values in component markup. Custom utilities such as `focus-outline`, `rounded-inherit`, `flex-center`, and `corner-shape-unset` are written with direct CSS declarations. Existing Tailwind classes that need design-system behavior, such as `rounded-full` and `bg-clip-text`, are augmented with plain class rules instead of `@utility`. New component color should be added to the DS token files instead of creating route-local theme variables.

## Tokens - Typography

### Inter - UI text, forms, tables, navigation, body copy. The DS package uses Inter as its default sans stack with OpenType alternates enabled through `font-feature-settings: 'calt', 'cv01', 'cv02', 'cv03', 'cv04', 'cv09'`. The personality is compact and highly legible: 13px body text, 12px metadata, and 15px prominent labels keep dense admin pages readable without inflating the layout. Book weight is `400`; use medium `500` for labels and semibold `600` only for clear hierarchy.

- **Substitute:** `-apple-system`, `system-ui`, `Segoe UI`, sans-serif
- **Weights:** 400, 500, 600
- **Sizes:** 11px, 12px, 13px, 15px, 17px, 22px, 26px, 29px
- **Line height:** 14px-36px
- **Letter spacing:** app shell uses `-0.5%` at 12px and `-1%` at 13px
- **OpenType features:** `'calt'`, `'ss03'`, `'cv09'`, `'cv02'`, `'cv03'`, `'cv04'`
- **Role:** Default UI type, form controls, buttons, table cells, menus, nav, descriptions

### Display text - Page titles and prominent display moments use the same Inter variable family as the rest of the app. Keep display-scale styling reserved for page-level hierarchy, not routine labels.

- **Substitute:** `ui-sans-serif`, system-ui, sans-serif
- **Weights:** 500, 600
- **Sizes:** 22px, 26px, 29px
- **Line height:** 26px-36px
- **Letter spacing:** keep at the token default; do not add wide tracking
- **Role:** Page headers, major section headers, compact hero/title moments in app chrome

### Type Scale

| Role           | Size | Line Height | Letter Spacing | Token                     |
| -------------- | ---- | ----------- | -------------- | ------------------------- |
| fine-label     | 11px | 14px        | 0              | `--text-xs` in app shell  |
| badge-label    | 12px | 18px        | -0.5%          | `--text-sm`               |
| body           | 13px | 20px        | -1%            | `--text-base`             |
| prominent-body | 15px | 22px        | 0              | `--text-lg`               |
| compact-title  | 17px | 24px        | 0              | `--text-xl` in app shell  |
| section-title  | 22px | 26px        | 0              | `--text-2xl` in app shell |
| page-title     | 26px | 32px        | 0              | `--text-3xl` in app shell |
| display-title  | 29px | 36px        | 0              | `--text-4xl` in app shell |

## Tokens - Spacing & Shapes

**Base unit:** 4px

**Density:** compact

### Spacing Scale

| Name | Value | Token                                    |
| ---- | ----- | ---------------------------------------- |
| 1    | 4px   | `p-1`, `gap-1`, `--spacing(1)`           |
| 1.5  | 6px   | `p-1.5`, `gap-1.5`, `--spacing(1.5)`     |
| 2    | 8px   | `p-2`, `gap-2`, `--spacing(2)`           |
| 2.5  | 10px  | `p-2.5`, `gap-2.5`, `--spacing(2.5)`     |
| 3    | 12px  | `p-3`, `gap-3`, `--spacing(3)`           |
| 4    | 16px  | `p-4`, `gap-4`, `--spacing(4)`           |
| 5    | 20px  | `p-5`, `gap-5`, `--spacing(5)`           |
| 6    | 24px  | `p-6`, `gap-6`, `--spacing(6)`           |
| 6.5  | 26px  | `h-6.5`, `size-6.5`                      |
| 7.5  | 30px  | `h-7.5`, `size-7.5`, `--spacing-control` |
| 8    | 32px  | `p-8`, `gap-8`, `h-8`                    |
| 12   | 48px  | `p-12`, `gap-12`                         |

### Border Radius

The DS package sets `--radius: 8px`; the app shell sets `--radius: 10px`. Components inside `app/ui` should follow the DS package math.

| Element                  | Value                                                    |
| ------------------------ | -------------------------------------------------------- |
| root radius              | 8px in DS package, 10px in app shell                     |
| small controls           | `rounded-sm` = `calc(var(--radius) - 2px)` = 6px in DS   |
| standard controls        | `rounded-lg` = `calc(var(--radius) + 4px)` = 12px in DS  |
| compact inline items     | `rounded-sm` = `calc(var(--radius) - 2px)` = 6px in DS   |
| popovers/dialogs         | `rounded-lg` to `rounded-xl` = 12px-14px in DS           |
| cards / large containers | `rounded-2xl` = `calc(var(--radius) + 8px)` = 16px in DS |
| pill buttons             | `rounded-full` with `corner-shape: unset`                |

### Layout

- **Control height:** 30px (`h-control`, `--spacing-control: 1.875rem`)
- **Input/select height:** 32px (`h-8`)
- **Small button height:** 26px (`h-6.5`)
- **Default button height:** 30px (`h-7.5`)
- **Dialog size:** `w-100`, `h-80`, and `rounded-[22px]` for the shared dialog popup
- **Floating offset:** 4px from trigger for select, menu, and popover positioners
- **Element gap:** 4px-8px for dense groups, 16px-24px for sections

## Components

### Primary Button

**Role:** Main action in forms, headers, and modal footers

Dark neutral fill (`bg-gray-900`) with radial white highlights, white text, `rounded-full`, `h-7.5`, `px-3`, `text-base`, medium weight, `shadow-md`, and inset highlights. This is the system's highest-emphasis action. The visual emphasis comes from black, depth, and shine, not from a bright color.

### Elevated Button

**Role:** Header and toolbar actions with quiet chrome

White surface, `rounded-full`, `h-7.5`, `px-3`, `text-base`, `shadow-button-elevated`, and a slight text shadow. Use for preview, header actions, and commands that should remain available without becoming the page's focal point.

### Secondary Button

**Role:** Tertiary action or low-emphasis inline command

`bg-gray-200`, `hover:bg-gray-300`, `rounded-full`, compact height, and no visible border. Use inside dense control clusters where a full header button would add too much chrome.

### Plain Button

**Role:** Minimal action that should read like an affordance, not a control surface

Transparent by default with a soft black or white hover fill. Use for dismissive, icon-adjacent, or low-risk actions.

### AI Emphasis

**Role:** Special emphasis for AI-adjacent labels and actions

Purple AI emphasis is tokenized as `--ai` / `--color-ai` and appears in components such as `Badge variant="ai"`. Keep it rare; do not use purple as the default conversion color.

### Button Group

**Role:** Adjacent related actions

Groups buttons into a compact cluster. Internal spacing is tight and hover states can lift individual `.btn` children with `bg-background` and `shadow-sm`. Use for Save/Discard, mode switches, or toolbar clusters.

### Segmented Control

**Role:** Compact single-choice mode switch

Wraps Base UI ToggleGroup and Toggle for accessibility and keyboard behavior. Use for dense mutually exclusive choices such as grid/list view switches. The selected state uses a clipped active background and a separate moving shadow layer so the pill shadow remains visible while the active fill animates.

### Badge

**Role:** Status, category, and compact metadata labels

Compact inline labels with neutral default styling and semantic variants for `success`, `info`, `caution`, `warning`, and `ai`. Semantic color variants are allowed in badges because they communicate state, not decoration.

### Input

**Role:** Text entry field

`h-control`, `rounded`, `bg-background`, `px-2.5`, `text-base`, and `shadow-input`. The wrapper owns hover, focus, invalid, disabled, prefix, and suffix states. Focus uses `shadow-input-focus` plus a low-opacity blue ring; invalid state uses red border/ring treatment. Use `variant="borderless"` only inside composed controls such as `InputCombo`.

### Select

**Role:** Compact dropdown selection

Trigger mirrors the control system: `h-control`, `min-w-40`, `rounded-lg`, `bg-white`, `px-3`, `pe-2`, `text-base`, and `shadow-input`. Popup uses `bg-background`, `rounded-lg`, `shadow-lg`, and short `ease-out` scale/opacity/translate transitions. Items are `h-control`, `text-base`, and a gray highlighted background pseudo-element.

### Combobox

**Role:** Searchable single- or multi-select dropdown

Use for choosing one or more related resources such as collections, channels, tags, or creatable option values. The trigger follows `Select`; the popup adds a search row, optional checkbox indicators, creatable rows, and an optional single footer action while Base UI owns selection, filtering, keyboard navigation, and focus behavior. Use `selectionMode="single"` only when the value still benefits from search or creation; otherwise prefer `Select`.

### Menu

**Role:** Context menu and action dropdown

Popup uses `rounded-lg`, `bg-background`, `p-1`, `shadow-lg`, and short `ease-out` scale/opacity/translate transitions. Items are at least 30px tall with `font-book`, `text-base`, left padding, optional icons or shortcuts, and a subtle gray highlighted state.

### Popover

**Role:** Anchored supplemental content or lightweight controls

Popover is a single app-facing component with a `trigger` prop plus `Popover.Title` and `Popover.Description` helpers. Popup uses `rounded-2xl`, `bg-white`, `shadow-lg`, and the same `ease-out` opacity/scale transition pattern as Tooltip through Base UI data attributes. Add internal padding in the popover content when needed. Use for local details, filters, or short forms anchored to a trigger.

### Shared Popover

**Role:** Shared animated shell for hover and focus popovers

SharedPopover centralizes the shared popup animation used by hover/focus overlays. Use `SharedPopover.Popup` inside Base UI positioned content for element anchoring. Use cursor anchoring only through `SharedPopover.CursorTrigger` or `getCursorTriggerProps` when the content should follow the pointer, such as resource previews.

### Dialog

**Role:** Modal task, confirmation, or focused edit flow

Backdrop is `bg-black/40` and fades with Base UI transition attributes. Popup is centered, `h-80`, `w-100`, `rounded-[22px]`, `bg-white`, `p-4`, `shadow-xl shadow-black/10`, and animates opacity, blur, translate, and scale with `ease-out`. Dialog titles use `text-lg font-medium`; descriptions use `text-base text-muted-foreground`.

### Page Header

**Role:** Page title, breadcrumbs, leading icon/back affordance, and actions

Root is a vertical flex stack with `gap-2`. Heading row is `min-h-9`. Large title defaults to `text-2xl font-medium tracking-tight`; when a leading icon/link is present, it compresses to `text-base font-medium`. Leading icons and back links are 28px square, `rounded-lg`, muted by default, and use neutral hover backgrounds.

### Data Table

**Role:** Configured tabular data with column definitions

Use for dense admin records. Prefer component props and column configuration over handwritten table markup when rows, headers, and cell rendering follow standard patterns.

### Definition List

**Role:** Label/value summaries

Use for order summaries, settings metadata, and compact facts that should align without becoming a full table.

### Aside

**Role:** Right-rail summary and contextual controls

Use for dense secondary context beside a main editor or detail page. It composes grouped metric, select, combobox, status, and opportunity items; do not use it as a generic page layout column.

### InputButton

**Role:** Button-shaped filter and editable value control

Use for compact filter bars where a value can be selected, toggled, or edited inline. Prefer it over hand-built pill controls so icon, label, value, and editing behavior stay consistent.

### InputCombo

**Role:** Select and text input combo field

Use when a select qualifies a text entry, such as amount versus quantity. The wrapper owns the shared hover/focus shadow and nested controls use borderless variants.

### InputHero

**Role:** Large borderless value input

Use for prominent editable values inside summary or configuration cards. Do not use it for normal form rows.

### StatusIndicator

**Role:** Active or inactive availability signal

Use for binary presence/availability next to labels. Use `Badge` instead when the state has multiple semantic variants such as draft, warning, failed, or AI.

### MetricsBar

**Role:** Horizontal KPI summary

Use for compact groups of key metrics that share one scan line. Each metric can pair an `AnimatedNumber` value with an optional change value and `Sparkline`; do not build repeated metric blocks by hand when this component matches the layout.

### SidekickIcon

**Role:** Compact Sidekick identity mark

Use for Sidekick prompt fields, launchers, and assistant surfaces. The icon is decorative (`aria-hidden`) and supports `idle`, `active`, and `loading` states; pair it with a labelled surrounding control when the action needs an accessible name.

## Do's and Don'ts

### Do

- Use semantic tokens such as `bg-background`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `border`, and `ring-ring` for common surface, text, border, and focus roles.
- Use the curated `gray-*` palette for precise neutral structure, fills, dividers, hover states, and text hierarchy. Admin Next redefines `gray-*` in `app/ui/tokens/color.css`; it is not Tailwind's default gray palette.
- Reserve semantic color for state: success, danger, warning, info, AI, or destructive actions.
- Keep default controls compact: 30px buttons and menu items, 32px inputs and selects.
- Use `rounded-md` for inputs/selects, `rounded-lg` for icon affordances and popovers, `rounded-xl`/`rounded-2xl` for larger surfaces.
- Preserve `corner-shape: superellipse(1.333)` on non-pill UI; it is a defining geometric signature.
- Let Base UI manage state, focus, ARIA, keyboard behavior, portals, and transition lifecycle for interactive primitives.
- Use `data-starting-style` and `data-ending-style` for popup/dialog/menu transitions.
- Prefer `gap-*` for internal spacing in flex/grid layouts.
- Use `clsx()` from `clsx` when composing class names.

### Don't

- Do not hardcode raw color values inside component implementations when a semantic token or gray token exists.
- Do not make bright color the default action language. Primary action is dark neutral; green/red/blue are state colors and purple is special-case AI emphasis.
- Do not inflate admin controls to marketing scale. Large display type belongs to route-level headers, not dense panels or tables.
- Do not replace Base UI state with local wrappers for controlled/uncontrolled behavior.
- Do not use `bg-gradient-*` utilities; Tailwind v4 uses `bg-linear-*`, `bg-radial`, and `bg-conic`.
- Do not use `space-x-*` or `space-y-*` for flex/grid spacing; use gap.
- Do not use `min-h-screen`; use `min-h-dvh`.
- Do not remove focus rings, keyboard affordances, or `aria-invalid` styling from form controls.
- Do not put card shadows and borders on every nested element. One clear surface layer is usually enough.

## Surfaces

| Level | Name    | Light Value              | Dark Value           | Purpose                                          |
| ----- | ------- | ------------------------ | -------------------- | ------------------------------------------------ |
| 0     | Canvas  | `var(--color-white)`     | `oklch(0.145 0 0)`   | Default page and body background                 |
| 1     | Surface | `var(--color-white)`     | `oklch(0.145 0 0)`   | Cards, forms, table containers                   |
| 2     | Muted   | `var(--color-gray-50)`   | `oklch(0.269 0 0)`   | Subtle panels, disabled fills, hoverable regions |
| 3     | Popover | `var(--color-white)`     | `oklch(0.269 0 0)`   | Floating menus, popovers, command surfaces       |
| 4     | Overlay | `rgb(0 0 0 / 60%)`       | `rgb(0 0 0 / 60%)`   | Dialog backdrop and modal focus layer            |
| 5     | Inverse | `var(--color-gray-base)` | `var(--color-white)` | High contrast moments                            |

## Elevation

Elevation is subtle and stacked. The system uses tiny y-offsets, low alpha shadows, 1px rings, and inset highlights to create depth without making the UI feel like floating cards. Buttons have the most crafted elevation: primary buttons combine radial gradients and `shadow-button-primary`; header buttons use `shadow-button-elevated`; inputs use `shadow-input` and `shadow-input-focus`. Floating surfaces use the standard `shadow-lg` through `shadow-2xl` scale depending on modal weight.

| Token                          | Value                                     | Purpose                         |
| ------------------------------ | ----------------------------------------- | ------------------------------- |
| `--shadow-xs`                  | low stacked shadow with 1px ring          | Subtle control elevation        |
| `--shadow-sm`                  | soft multi-layer ambient shadow           | Low cards and controls          |
| `--shadow-md`                  | stacked 2px-16px layers with 1px ring     | Medium emphasis                 |
| `--shadow-lg`                  | stacked 2px-16px layers                   | Menus and popovers              |
| `--shadow-xl` / `--shadow-2xl` | larger stacked elevation                  | Dialogs and high-focus overlays |
| `--shadow-input`               | low shadow plus 1px black/12 ring         | Default input/select surfaces   |
| `--shadow-input-focus`         | blue ring, inner glow, and focus shadow   | Focused input/select surfaces   |
| `--shadow-button-primary`      | inset shine plus compact drop shadows     | Primary buttons                 |
| `--shadow-button-elevated`     | light 1px ring and broad low-alpha shadow | Header buttons                  |

## Imagery

This design system is interface-first. It does not depend on photography, illustration, or decorative backgrounds. Visual meaning comes from data, typography, icons, state color, and structured surfaces. Icons should be compact, monochrome, and task-specific; use the `Icon` component backed by the Nucleo manifest for app-facing icons, with custom navigation icons under `app/icons/navigation` when needed. If a screen needs an image, it should be content, merchant context, or product data, not atmospheric decoration.

## Layout

Admin layouts should feel dense but not cramped. Keep page chrome steady, preserve a compact vertical rhythm, and prioritize repeated scanning. Use `gap` for layout spacing, `minmax(0, 1fr)` for grids, and component primitives for forms, tables, menus, and dialogs. Header actions sit at the right edge; leading icons/back links are 28px square; table and form content should align to predictable columns. Avoid landing-page composition inside the admin shell: no oversized heroes, no decorative card grids, and no marketing-style split panels unless the route genuinely requires onboarding.

## Agent Prompt Guide

QUICK COLOR REFERENCE:

- Page background: `oklch(1 0 0)` / `bg-background`
- Primary text: `oklch(0.145 0 0)` / `text-foreground`
- Muted text: `oklch(0.556 0 0)` / `text-muted-foreground`
- Primary action: `oklch(0.205 0 0)` / `bg-primary`
- Card or default surface: `var(--color-white)` / `bg-background`
- Border: `oklch(0.922 0 0)` / `border`
- AI purple: `#7D5AFF` / `--color-ai`

EXAMPLE COMPONENT PROMPTS:

1. Section: Use `Section` for grouped content with an optional title and rounded surface. Keep titles short and use one section per related group.

2. Primary form action row: Use a flex row with `gap-2`. Primary `Button` is `variant="primary"` with `h-7.5`, `px-3`, `rounded-full`, dark neutral fill, white text, `shadow-button-primary`, and radial highlights. Header action uses `variant="elevated"` with a white surface and `shadow-button-elevated`.

3. Compact settings card: Use `bg-background`, `text-foreground`, `border`, `rounded-2xl`, `shadow-sm`, and `p-4` or `p-5`. Header text should be `text-base` or `text-lg` with medium/semibold weight; body text should be `text-base text-muted-foreground`.

4. Select menu: Trigger is 30px tall, `rounded-lg`, `bg-white`, `px-3`, `pe-2`, `text-base`, and `shadow-input`. Popup is `bg-background`, `rounded-lg`, `shadow-lg`, with an `ease-out` scale/opacity/translate transition. Items are `h-control font-book text-base`.

5. Dialog: Backdrop is `bg-black/40` with opacity transition. Popup is centered, `w-100`, `h-80`, `rounded-[22px]`, `bg-white`, `p-4`, `shadow-xl`; animate opacity, blur, translate, and scale with Base UI data attributes and `ease-out`.

## Motion System

Primary motion is short and functional. Transitions should prefer `ease-out` without adding a duration class, because the utility sets the correct base duration. Floating surfaces enter and exit with opacity plus a small scale shift; tooltips and popovers use `scale-90` starting/ending states, while menus and selects may use a subtler `scale-97` plus translate. Use explicit duration classes only for deliberate exceptions such as longer illustrated paths, image crossfades, or specialized navigation timing.

| Name              | Value                          | Token                 | Use                             |
| ----------------- | ------------------------------ | --------------------- | ------------------------------- |
| Ease out          | `cubic-bezier(0.2, 0.8, 0, 1)` | `--ease-out`          | Default transition easing       |
| Ease out duration | `400ms`                        | `--ease-out-duration` | Default duration for `ease-out` |

## Similar Products

- **Shopify Admin** - Dense operational surfaces, compact controls, neutral hierarchy, and restrained state color.
- **Stripe Dashboard** - Data-first cards, quiet grayscale surfaces, precise forms, and careful focus states.
- **Linear** - Compact command surfaces, dark/light semantic tokens, and fast low-amplitude motion.
- **Vercel Dashboard** - Minimal monochrome action hierarchy, table-first pages, and crisp popover/menu layers.

## Quick Start

The source of truth is the split token files imported directly by `app/App.css`:

```css
@import './tokens/border.css';
@import './tokens/color.css';
@import './tokens/motion.css';
@import './tokens/shadow.css';
@import './tokens/spacing.css';
@import './tokens/typography.css';
```

Key Tailwind theme values currently exposed by those files:

```css
@theme {
  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --font-weight-book: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 600;

  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 13px;
  --text-lg: 15px;
  --text-xl: 17px;
  --text-2xl: 22px;
  --text-3xl: 26px;
  --text-4xl: 29px;

  --color-gray-50: #f7f7f7;
  --color-gray-100: #f5f5f5;
  --color-gray-200: #f2f2f2;
  --color-gray-300: #ebebeb;
  --color-gray-400: #d1d1d1;
  --color-gray-500: #868686;
  --color-gray-600: #606060;
  --color-gray-700: #5d5d5d;
  --color-gray-800: #454545;
  --color-gray-900: #202020;
  --color-gray-950: #151515;
  --color-gray-base: #101010;
  --color-purple-500: #7d5aff;

  --color-ai: var(--ai);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--text-primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--text-secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-ring: var(--ring);

  --spacing-control: 30px;
  --toolbar-height: 54px;

  --radius: 8px;
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 14px;
  --radius-2xl: 16px;
}
```
