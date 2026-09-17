---
name: ds-component
description: 'Build a new React component for the admin-next design system. Triggers on: build/add/create a DS component, or work inside app/ui/components.'
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
argument-hint: "[component name, e.g. 'tooltip', 'stat card', 'color picker']"
---

# DS Component Builder

You are building a new React component for the admin-next design system in `app/ui`.

## Step 0: Classify Behavior

First decide whether the component is interactive or static/data-display.

- Interactive examples: dialog, intent, menu, select, combobox, checkbox, switch, tooltip, accordion.
- Static/data examples: badge, section, sparkline, status indicator, data table.

For interactive components, check whether `@base-ui/react` exports a headless primitive:

```bash
rg --files node_modules/@base-ui/react | rg -i "/<component-name>"
```

- If an interactive primitive exists, wrap it.
- If no interactive primitive exists, stop and ask whether the user wants a custom accessibility implementation.
- If the component is static or data-display, proceed with semantic React/HTML and design-system styling.

## Step 1: Determine Component Type

| Signal                                | Type         | Pattern                                               |
| ------------------------------------- | ------------ | ----------------------------------------------------- |
| Multiple interactive parts            | Compound     | Namespace exports and sub-components                  |
| Single element with variants          | Simple       | Single export with variant props                      |
| Popup, portal, or collapsible content | Transitioned | Base UI lifecycle plus CSS transition data attributes |
| Static visual element                 | Static       | React component with Tailwind classes                 |
| Data display                          | Static/Data  | Semantic table/list/SVG structure with DS tokens      |

## Step 2: Load References

Always read:

1. `app/ui/skills/ds-component/references/composition.md`
2. `app/ui/skills/ds-component/references/styling.md`

If the component has popup, portal, or collapsible transitions, also read:

3. `app/ui/skills/ds-component/references/animation.md`

## Step 3: Read Existing Examples

Read 1-2 existing components that match the target pattern:

- Compound + transitioned: `app/ui/components/dialog/dialog.tsx`, `app/ui/components/intent/index.tsx`, `app/ui/components/combobox/combobox.tsx`, or `app/ui/components/tooltip/tooltip.tsx`
- Compound + static: `app/ui/components/accordion/accordion.tsx`
- Simple: `app/ui/components/button/button.tsx` or `app/ui/components/badge/badge.tsx`
- App-specific composition helper: `app/ui/components/aside/aside.tsx`, `app/ui/components/input-combo/input-combo.tsx`, or `app/ui/components/input-button/input-button.tsx`

## Step 4: Build

1. Create `app/ui/components/{name}/{name}.tsx`.
2. Create `app/ui/components/{name}/{name}.md` with props, use/do/don't guidance, and an example.
3. Follow the composition reference for imports, typing, Markdown docs, and exports.
4. Follow the styling reference for `clsx()`, semantic tokens, variants, and `className`.
5. For transitions, use Base UI `data-starting-style` and `data-ending-style` attributes.
6. Add the export to `app/ui/index.ts`:
   - Compound: export the app-facing root component or namespace used by the implementation
   - Simple: `export { {Name} } from './components/{name}/{name}'`
7. Add a preview entry in `app/routes/design-system/catalog.tsx` when the component should be discoverable in the visual catalog.
8. Run `bun run docs:design-system` after changing component docs or `app/ui/DESIGN.md`.

## Checklist

Before finishing, verify:

- [ ] Component classified as interactive, static, or data-display before implementation.
- [ ] Base UI primitive wrapped when an interactive primitive exists.
- [ ] Base UI owns accessibility behavior, state, focus, keyboard navigation, and portal lifecycle for primitive-backed interactive components.
- [ ] React `ComponentProps` typing used.
- [ ] No inline JSDoc added; document usage in the co-located Markdown file.
- [ ] `className` prop used for customization.
- [ ] `clsx()` merges base classes with user `className`.
- [ ] Transitioned parts use Base UI data attributes instead of manual mount state.
- [ ] Component Markdown doc added beside the implementation.
- [ ] Export added to `app/ui/index.ts`.
- [ ] Catalog preview added for visual-catalog components.
- [ ] `bun run docs:design-system` run after doc/style-reference changes.
- [ ] Public export inventory stays aligned across `app/ui/index.ts`, `app/ui/README.md`, and `.agents/skills/design-system/SKILL.md`.
- [ ] Components intended for the visual catalog have both a Markdown doc and a `catalog.tsx` preview entry.
