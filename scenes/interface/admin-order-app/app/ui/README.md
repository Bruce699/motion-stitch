# Admin Design System

React component resources for admin-next. The design system lives in `app/ui` and is consumed by the app's main theme and routes rather than acting as its own app or package.

## Stack

- **React 19** — component runtime for admin-next.
- **@base-ui/react 1.4.1** — headless primitives for interactive components.
- **Tailwind CSS v4** — utility styling and design tokens.
- **CSS transitions** — Base UI `data-starting-style` and `data-ending-style` attributes drive popup, portal, and panel enter/exit states.

## Imports

Use direct component imports in app code. Do not import from the root `~/ui` barrel:

```tsx
import { Button } from '~/ui/components/button/button';
import { DataTable } from '~/ui/components/data-table/data-table';
import { Dialog } from '~/ui/components/dialog/dialog';
```

For compound components, use namespace imports from the direct component module:

```tsx
import * as Table from '~/ui/components/table/table';
```

## Architecture

### Route-specific screen sections

When creating or expanding route pages, keep `app/routes/**` focused on routing concerns, data lookup, form state, header actions, and page composition. Extract substantive route-specific UI into a component folder that mirrors the route/domain structure, with toolbars and sections nested inside the matching feature folder. For example, use `app/components/settings/checkout/checkout-toolbar.tsx` and `app/components/settings/taxes-and-duties/tax-regions-section.tsx` rather than loose files under `app/components/settings/`; use the same nested pattern for other route domains such as `app/components/products/collections/collection-details.tsx`.

For settings screens, use `SettingsActionList` from `~/ui/components/settings-action-list/settings-action-list` for repeated icon-led setting rows with titles, descriptions, values, navigation affordances, or switches. Avoid custom row/divider/switch markup unless the setting needs a materially different layout or interaction.

Use `Section` from `~/ui/components/section/section` for titled content groups, rounded settings surfaces, wrapper panels, and section-level action headers. Pass `title`, `subtitle`, and `action` to `Section`; do not hand-roll `<section>` wrappers, `<h2>` headers, header flex rows, or action menus around a content surface when the shared component fits.

Do not use `Section bleed` and then add `p-5`, `px-5`, or equivalent default padding to the only child. Leave `bleed` off when the section should have normal padding; reserve `bleed` for flush tables, edge-to-edge media, or custom internal spacing that is intentionally different from the default.

### Modern components

Modern components live in `app/ui/components`. Interactive components wrap the matching Base UI primitive. Some expose Base UI-style compound parts when the interaction is naturally multi-part:

```tsx
<Dialog>
  <Dialog.Trigger>
    <Button>Open</Button>
  </Dialog.Trigger>
  <Dialog.Content type="dialog">
    <h2>Title</h2>
    <p>Dialog content</p>
  </Dialog.Content>
</Dialog>
```

Interactive components should let Base UI own controlled/uncontrolled state, focus management, ARIA, keyboard navigation, portal mounting, and transition lifecycle. Style transitions with Base UI data attributes instead of adding separate state wrappers.

Other interactive components expose a single app-facing component with a `trigger` prop when that matches local usage better, for example `Combobox`, `Menu`, `Popover`, and `ResourcePreview`.

Static visual and data-display components can use semantic native React/HTML structures when there is no relevant Base UI primitive. Examples include `Badge`, `DataTable`, `Sparkline`, and `Section`.

**Public exports:** Accordion, AnimatedNumber, Aside, Avatar, Badge, Button, Checkbox, Collapsible, Combobox, DataTable, Dialog, Icon, Image, Input, InputButton, InputCombo, InputHero, InputStepper, Intent, Link, Map, Menu, MetricsBar, Popover, ProgressiveBlur, Radio, ResourcePreview, RichTextEditor, SearchBar, Section, SegmentedControl, Select, SettingsActionList, SharedPopover, ShimmerText, SidekickIcon, ShopifyLogo, Sparkline, StatusIndicator, Switch, Table, Toast, Tooltip.

The design-system catalog should include a visual preview for each reusable public component export; utility exports such as `buttonClass` are the expected non-visual exception.

### Tokens and CSS

- `app/ui/tokens/*.css` contains the split design-system token files.
- `app/App.css` is the global CSS manifest: it imports Tailwind, imports the token files directly, excludes docs/agent source folders from Tailwind scanning, and owns app-specific shell tokens, base rules, custom utilities, plain Tailwind class augmentations, and shared prose styles.
- Use `clsx()` from `clsx` to compose conditional class names.

## Source Of Truth

- Component implementation: `app/ui/components/{name}/{name}.tsx` or the existing co-located feature folder such as `app/ui/metrics-bar/metrics-bar.tsx`
- Local component docs: `app/ui/components/{name}/{name}.md` or the matching co-located feature doc
- Public app-facing exports: `app/ui/index.ts`
- Design-system catalog previews: `app/routes/design-system/catalog.tsx`
- Generated agent component docs: `.agents/skills/design-system/components`
- Generated public docs: `docs/design-system/DESIGN.md`
- Generated agent style reference: `.agents/skills/design-system/references/design.md`

## Component Docs

Each component keeps a Markdown reference beside its implementation:

```text
app/ui/components/{name}/{name}.md
app/ui/metrics-bar/metrics-bar.md
```

Generated agent-facing copies live in `.agents/skills/design-system/components`. Markdown docs are picked up automatically by the design-system docs route; visual previews in the catalog are registered manually in `app/routes/design-system/catalog.tsx`. If a component is exported but has no Markdown doc yet, document it before treating it as a reusable app-facing primitive.

## Style Reference

`DESIGN.md` is the narrative style reference for the design system: tokens, surfaces, motion, component usage, and prompt guidance. Run `bun run docs:design-system` after changing component docs or the style reference so `docs/design-system/DESIGN.md` and `.agents/skills/design-system/references/design.md` stay in sync.

## Component Notes

When adding a component:

1. Use the matching Base UI primitive when one exists.
2. Keep the component in `app/ui/components/{name}/{name}.tsx`.
3. Add `app/ui/components/{name}/{name}.md`.
4. Export the component from `app/ui/index.ts`.
5. Add an entry in `app/routes/design-system/catalog.tsx` when the component should be discoverable in the visual catalog.
6. Export compound components from `app/ui/index.ts` in the app-facing shape their implementation exposes.
7. Prefer React `ComponentProps<typeof Primitive.Part>` typing for primitive wrappers.
8. Use module-level class constants or maps for reused style groups, variants, and sizes. Keep one-off structural classes inline.
9. Use `className`, not `class`.
10. Use Base UI transition data attributes for popup and portal animations.
11. Run `bun run docs:design-system` after changing component docs or `DESIGN.md`.
