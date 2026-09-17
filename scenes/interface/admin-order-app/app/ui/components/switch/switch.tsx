import { Switch as BaseSwitch } from '@base-ui/react/switch';
import React from 'react';
import { clsx } from 'clsx';

export function Switch({
  ariaLabel,
  checked,
  defaultChecked,
  label,
  onCheckedChange,
  disabled,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange: NonNullable<
    React.ComponentProps<typeof BaseSwitch.Root>['onCheckedChange']
  >;
  disabled?: boolean;
} & (
  | {
      label: string;
      ariaLabel?: never;
    }
  | {
      label?: never;
      ariaLabel: string;
    }
)) {
  const generatedId = React.useId();
  const switchId = label ? `switch-${generatedId}` : undefined;

  return (
    <div className={clsx(label && 'flex items-center gap-2')}>
      <BaseSwitch.Root
        aria-label={label ?? ariaLabel}
        id={switchId}
        checked={checked}
        disabled={disabled}
        className={clsx(
          'group relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center rounded-full px-0.5',
          'bg-[rgba(0,0,0,0.1)] outline-none',
          'transition-[background,box-shadow] ease-out',
          'before:absolute before:rounded-full before:outline-offset-1 before:outline-blue-500 focus-visible:before:inset-0 focus-visible:before:outline-2',
          'data-checked:bg-primary',
          'data-disabled:cursor-not-allowed data-disabled:opacity-50',
        )}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
      >
        <BaseSwitch.Thumb
          className={clsx(
            'pointer-events-none block h-3 w-4 rounded-full bg-white',
            'shadow-[0_1px_1px_-0.5px_rgba(0,0,0,0.06),0_2px_2px_-1px_rgba(0,0,0,0.06),0_4px_4px_-2px_rgba(0,0,0,0.06),0_2px_8px_0_rgba(0,0,0,0.06)]',
            'transition-[background,box-shadow,translate] ease-out',
            'data-checked:translate-x-3',
          )}
        />
      </BaseSwitch.Root>
      {label ? (
        <label
          htmlFor={switchId}
          className={clsx(
            '-mx-3 max-w-60 px-3 font-medium select-none',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          {label}
        </label>
      ) : null}
    </div>
  );
}
