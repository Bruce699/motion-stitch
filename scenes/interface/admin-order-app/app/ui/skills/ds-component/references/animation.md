# Transition Reference

Use Base UI transition lifecycle for popups, portals, and collapsible panels.

## Preferred Pattern

Base UI keeps elements mounted long enough for exit transitions and applies data attributes during transition phases. Put the transition on the primitive that appears or disappears.

```tsx
function Popup({
  className,
  ...props
}: ComponentProps<typeof BasePopover.Popup>) {
  return (
    <BasePopover.Popup
      className={clsx(
        'origin-(--transform-origin) transition-[opacity,transform] ease-out',
        'data-starting-style:scale-[0.97] data-starting-style:opacity-0',
        'data-ending-style:scale-[0.97] data-ending-style:opacity-0',
        className,
      )}
      {...props}
    />
  );
}
```

## Portals

Portals should normally pass Base UI props through unchanged.

```tsx
function Portal(props: ComponentProps<typeof BaseDialog.Portal>) {
  return <BaseDialog.Portal {...props} />;
}
```

Use `keepMounted` only when the specific Base UI portal supports it and there is a product reason to keep content in the DOM while closed.

## Backdrops

Backdrops should use opacity transitions and Base UI state attributes.

```tsx
export const backdropClassName =
  'fixed inset-0 bg-black/40 transition-opacity ease-out data-starting-style:opacity-0 data-ending-style:opacity-0';
```

## Collapsible Panels

Use Base UI-provided CSS variables for measured height when available.

```tsx
<BaseAccordion.Panel
  className={clsx(
    'h-(--accordion-panel-height) overflow-hidden transition-[height] ease-out',
    'data-ending-style:h-0 data-starting-style:h-0',
    className,
  )}
  {...props}
/>
```

## Durations

Do not add duration classes to routine transitions. The `ease-out` utility sets the default transition duration.

Use explicit duration classes only for deliberate exceptions such as longer illustrated paths, image crossfades, or specialized navigation timing.
