import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { Icon } from '~/ui/components/icon/icon';
import type { ComponentProps, ReactNode } from 'react';
import { clsx } from 'clsx';

type CheckboxIndicatorVariant = 'check' | 'indeterminate';

function Root({
  className,
  ...props
}: ComponentProps<typeof BaseCheckbox.Root>) {
  return (
    <BaseCheckbox.Root
      className={clsx(
        'relative isolate flex size-4 flex-center rounded-[0.3125rem]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
        'before:absolute before:inset-px before:-z-1 before:rounded-inherit before:bg-white before:shadow-input before:transition-shadow before:ease-out',
        'data-checked:before:bg-primary data-checked:before:shadow-input-checked',
        className,
      )}
      {...props}
    />
  );
}

function Indicator({
  className,
  variant = 'check',
  ...props
}: ComponentProps<typeof BaseCheckbox.Indicator> & {
  variant?: CheckboxIndicatorVariant;
}) {
  return (
    <BaseCheckbox.Indicator
      render={
        <span className="text-white filter-[drop-shadow(0_2px_2px_rgba(0,0,0,0.12))_drop-shadow(0_1px_1px_rgba(0,0,0,0.12))_drop-shadow(0_0_0_rgba(0,0,0,0.06))]">
          {variant === 'indeterminate' ? (
            <span className="block h-0.5 w-2 rounded-full bg-current" />
          ) : (
            <Icon name="Check" size={10} strokeWidth={2.5} />
          )}
        </span>
      }
      className={clsx(
        'flex transition-[opacity,scale,filter] ease-out',
        'data-ending-style:scale-75 data-ending-style:opacity-0 data-ending-style:blur-xs data-starting-style:scale-75 data-starting-style:opacity-0 data-starting-style:blur-xs data-unchecked:hidden',
        className,
      )}
      {...props}
    />
  );
}

function CheckboxControl({
  children,
  indicatorClassName,
  indicatorVariant = 'check',
  indeterminate = false,
  label,
  labelClassName,
  'aria-checked': ariaChecked,
  ...props
}: ComponentProps<typeof Root> & {
  indicatorClassName?: string;
  indicatorVariant?: CheckboxIndicatorVariant;
  indeterminate?: boolean;
  label?: ReactNode;
  labelClassName?: string;
}) {
  const checkbox = (
    <Root aria-checked={indeterminate ? 'mixed' : ariaChecked} {...props}>
      <Indicator
        className={indicatorClassName}
        variant={indeterminate ? 'indeterminate' : indicatorVariant}
      />
      {children}
    </Root>
  );

  if (label === undefined || label === null) {
    return checkbox;
  }

  return (
    <label className={clsx('flex items-center gap-2', labelClassName)}>
      {checkbox}
      {label}
    </label>
  );
}

const Checkbox = Object.assign(CheckboxControl, { Root, Indicator });

export { Checkbox, Root, Indicator };
