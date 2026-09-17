# Composition Reference

## Base UI Gate

Before writing an interactive component, verify a Base UI primitive exists:

```bash
ls node_modules/@base-ui/react/ | grep -i "<name>"
```

Base UI should handle focus management, ARIA attributes, keyboard navigation, screen reader behavior, and portal lifecycle. Do not reimplement those behaviors when a primitive exists.

## File Organization

```text
app/ui/components/{name}/{name}.tsx
```

## Compound Component Pattern

Use namespace exports when the component has distinct interactive parts.

```tsx
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { ComponentProps, ReactElement } from 'react';
import { clsx } from 'clsx';

function Trigger({
  children,
  ...props
}: Omit<ComponentProps<typeof BaseDialog.Trigger>, 'children'> & {
  children: ReactElement;
}) {
  return <BaseDialog.Trigger render={children} {...props} />;
}

function Root(props: ComponentProps<typeof BaseDialog.Root>) {
  return <BaseDialog.Root {...props} />;
}

function Content({
  children,
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Popup>) {
  return (
    <BaseDialog.Portal className="fixed inset-0">
      <BaseDialog.Backdrop className="absolute inset-0 bg-black/40 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <BaseDialog.Popup
        className={clsx(
          'transition-[opacity,transform] ease-out',
          'data-ending-style:opacity-0 data-starting-style:opacity-0',
          className,
        )}
        {...props}
      >
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export const Dialog = Object.assign(Root, {
  Trigger,
  Content,
});
```

## Simple Component Pattern

Use a single export for one-element components with visual variants.

```tsx
import type { ComponentProps } from 'react';
import { clsx } from 'clsx';

export function Badge({
  className,
  variant = 'default',
  ...props
}: ComponentProps<'span'> & {
  variant?: 'default' | 'success';
}) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-sm px-1.5 text-xs',
        variant === 'success' && 'bg-success text-success-foreground',
        className,
      )}
      {...props}
    />
  );
}
```

## Props Typing

- Compound sub-components: `ComponentProps<typeof BaseName.SubComponent>`
- Simple components: `ComponentProps<typeof BaseName>`
- HTML wrappers: `ComponentProps<'div'>`
- Custom props: intersect the primitive props with a custom object type.

## Trigger Render Delegation

When a trigger wraps a user-provided component such as `Button`, use the Base UI `render` prop.

```tsx
function Trigger({
  children,
  ...props
}: Omit<ComponentProps<typeof BaseDialog.Trigger>, 'children'> & {
  children: ReactElement;
}) {
  return <BaseDialog.Trigger render={children} {...props} />;
}
```

## Controlled and Uncontrolled State

For Base UI roots, pass through `open`, `defaultOpen`, `onOpenChange`, `value`, `defaultValue`, and related props. Do not add local controlled-state wrappers around Base UI roots unless the component is not backed by a Base UI primitive and the state is genuinely custom.

## Refs

Base UI components expose refs through their own primitive props and render delegation. Add `forwardRef` from React only for custom native-element wrappers that need a public ref.

```tsx
import { forwardRef, type ComponentProps } from 'react';

export const Button = forwardRef<HTMLButtonElement, ComponentProps<'button'>>(
  ({ className, ...props }, ref) => (
    <button ref={ref} className={clsx('rounded-md', className)} {...props} />
  ),
);
```

## Component Docs

Keep source files lean. Document props, usage guidance, and realistic examples in the co-located Markdown file instead of adding inline JSDoc.

## Export in `app/ui/index.ts`

```tsx
export { Dialog } from './components/dialog/dialog';
export { Button } from './components/button/button';
export { Badge, type BadgeVariant } from './components/badge/badge';
```
