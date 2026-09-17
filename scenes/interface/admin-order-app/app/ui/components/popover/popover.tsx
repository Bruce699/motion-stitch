import { Popover as BasePopover } from '@base-ui/react/popover';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { clsx } from 'clsx';

type PopoverRootProps = Omit<
  ComponentProps<typeof BasePopover.Root>,
  'children'
>;

type PopoverPositionerProps = Pick<
  ComponentProps<typeof BasePopover.Positioner>,
  'align' | 'alignOffset' | 'side' | 'sideOffset'
>;

function PopoverRoot({
  align,
  alignOffset,
  children,
  className,
  popupClassName,
  side,
  sideOffset = 4,
  trigger,
  ...props
}: PopoverRootProps &
  PopoverPositionerProps & {
    children: ReactNode;
    className?: string;
    popupClassName?: string;
    trigger: ReactElement;
  }) {
  return (
    <BasePopover.Root {...props}>
      <BasePopover.Trigger
        nativeButton={isNativeButtonTrigger(trigger)}
        render={trigger as ReactElement<unknown>}
      />
      <BasePopover.Portal>
        <BasePopover.Positioner
          align={align}
          alignOffset={alignOffset}
          className={clsx('outline-none', className)}
          side={side}
          sideOffset={sideOffset}
        >
          <BasePopover.Popup
            className={clsx(
              'origin-(--transform-origin) rounded-2xl bg-white shadow-lg outline-none',
              'transition-[opacity,scale] ease-out data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90 data-starting-style:opacity-0',
              popupClassName,
            )}
          >
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

function isNativeButtonTrigger(trigger: ReactElement) {
  if (typeof trigger.type !== 'string') return true;

  return trigger.type === 'button';
}

function Title({
  className,
  ...props
}: ComponentProps<typeof BasePopover.Title>) {
  return (
    <BasePopover.Title
      className={clsx('text-base font-medium', className)}
      {...props}
    />
  );
}

function Description({
  className,
  ...props
}: ComponentProps<typeof BasePopover.Description>) {
  return (
    <BasePopover.Description
      className={clsx('text-base text-gray-600', className)}
      {...props}
    />
  );
}

const Popover = Object.assign(PopoverRoot, {
  Title,
  Description,
});

export { Popover, Title, Description };
