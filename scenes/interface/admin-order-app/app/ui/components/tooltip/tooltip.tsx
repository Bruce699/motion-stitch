import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { ComponentProps } from 'react';
import { clsx } from 'clsx';
import { useFeatureFlags } from '../../../feature-flags';

function Root(props: ComponentProps<typeof BaseTooltip.Root>) {
  return <BaseTooltip.Root {...props} />;
}

function Trigger({
  className,
  render,
  ...props
}: ComponentProps<typeof BaseTooltip.Trigger>) {
  return (
    <BaseTooltip.Trigger
      className={
        render
          ? className
          : clsx(
              'flex size-8 items-center justify-center rounded-sm border-0 bg-transparent text-gray-900 select-none',
              'hover:bg-gray-100 active:bg-gray-200',
              'focus-visible:bg-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800',
              'data-popup-open:bg-gray-100',
              className,
            )
      }
      render={render}
      {...props}
    />
  );
}

function Portal({
  children,
  ...props
}: ComponentProps<typeof BaseTooltip.Portal>) {
  return <BaseTooltip.Portal {...props}>{children}</BaseTooltip.Portal>;
}

function Positioner({
  className,
  sideOffset = 8,
  ...props
}: ComponentProps<typeof BaseTooltip.Positioner>) {
  return (
    <BaseTooltip.Positioner
      className={clsx('outline-none', className)}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

function Popup({
  className,
  render,
  ...props
}: ComponentProps<typeof BaseTooltip.Popup>) {
  const darkTooltipsEnabled = useFeatureFlags(
    (state) => state.flags.darkTooltips,
  );

  return (
    <BaseTooltip.Popup
      render={render}
      className={clsx(
        'flex origin-(--transform-origin) flex-col rounded-md bg-background px-2 py-1 text-sm font-medium text-primary shadow-lg dark:bg-gray-950 dark:shadow-black/10',
        'transition-[opacity,scale] ease-out data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90 data-starting-style:opacity-0',
        darkTooltipsEnabled && 'dark',
        className,
      )}
      {...props}
    />
  );
}

function Provider(props: ComponentProps<typeof BaseTooltip.Provider>) {
  return <BaseTooltip.Provider {...props} />;
}

export { Provider, Root, Trigger, Portal, Positioner, Popup };
