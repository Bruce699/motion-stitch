import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { Radio as BaseRadioNs } from '@base-ui/react/radio';
import type { ComponentProps, ReactNode } from 'react';
import { clsx } from 'clsx';

function Group({
  direction = 'col',
  ...props
}: Omit<ComponentProps<typeof BaseRadioGroup>, 'className'> & {
  direction?: 'row' | 'col';
}) {
  return (
    <BaseRadioGroup
      className={clsx(
        'flex items-start gap-3 text-primary',
        direction === 'row' ? 'flex-row' : 'flex-col',
      )}
      {...props}
    />
  );
}

function Root({
  className,
  label,
  labelClassName,
  ...props
}: Omit<ComponentProps<typeof BaseRadioNs.Root>, 'children'> & {
  label?: ReactNode;
  labelClassName?: string;
}) {
  const radio = (
    <BaseRadioNs.Root
      className={clsx(
        'relative isolate flex size-4 flex-center rounded-full',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
        'before:absolute before:inset-px before:-z-1 before:rounded-full before:bg-white before:shadow-input before:transition-shadow before:ease-out',
        'data-checked:before:bg-primary data-checked:before:shadow-input-checked',
        className,
      )}
      {...props}
    >
      <Indicator />
    </BaseRadioNs.Root>
  );

  if (label === undefined || label === null) {
    return radio;
  }

  return (
    <label className={clsx('flex items-center gap-2', labelClassName)}>
      {radio}
      {label}
    </label>
  );
}

function Indicator({
  className,
  ...props
}: ComponentProps<typeof BaseRadioNs.Indicator>) {
  return (
    <BaseRadioNs.Indicator
      className={clsx(
        'flex transition-[opacity,scale,filter] ease-out before:size-2 before:rounded-full before:bg-white',
        'data-ending-style:scale-75 data-ending-style:opacity-0 data-ending-style:blur-xs data-starting-style:scale-75 data-starting-style:opacity-0 data-starting-style:blur-xs data-unchecked:hidden',
        className,
      )}
      {...props}
    />
  );
}

export { Group, Root };
