import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import { clsx } from 'clsx';
import { Icon } from '~/ui/components/icon/icon';
import type { ComponentProps } from 'react';

export type InputStepperProps = Omit<
  ComponentProps<typeof BaseNumberField.Root>,
  'children'
> & {
  decrementLabel?: string;
  helper?: string;
  incrementLabel?: string;
  inputLabel?: string;
};

const stepperButtonClasses =
  'ease-out text-muted-foreground flex h-control w-control items-center justify-center transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/8';

function getDigitCount(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 1;

  return Math.max(1, String(Math.trunc(Math.abs(value))).length);
}

export function InputStepper({
  className,
  decrementLabel = 'Decrease value',
  helper,
  incrementLabel = 'Increase value',
  inputLabel = 'Value',
  max,
  min = 0,
  ...props
}: InputStepperProps) {
  const inputDigitCount = getDigitCount(
    max ?? props.value ?? props.defaultValue,
  );

  const stepper = (
    <BaseNumberField.Root
      className={clsx('inline-flex', className)}
      max={max}
      min={min}
      {...props}
    >
      <BaseNumberField.Group className="inline-flex h-control items-center overflow-hidden rounded-lg bg-background shadow-input">
        <BaseNumberField.Decrement
          aria-label={decrementLabel}
          className={stepperButtonClasses}
        >
          <span className="h-px w-2 bg-current" />
        </BaseNumberField.Decrement>
        <span className="flex items-center px-1 text-muted-foreground tabular-nums">
          <BaseNumberField.Input
            aria-label={inputLabel}
            className="bg-transparent text-center text-primary outline-none"
            style={{ width: `${inputDigitCount}ch` }}
          />
          {typeof max === 'number' ? (
            <span className="pl-1">of {max}</span>
          ) : null}
        </span>
        <BaseNumberField.Increment
          aria-label={incrementLabel}
          className={stepperButtonClasses}
        >
          <Icon name="Plus" size={12} />
        </BaseNumberField.Increment>
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );

  if (!helper) return stepper;

  return (
    <div className="inline-flex flex-col gap-1.5">
      {stepper}
      {helper ? <p className="mt-0.5 text-muted-foreground">{helper}</p> : null}
    </div>
  );
}
