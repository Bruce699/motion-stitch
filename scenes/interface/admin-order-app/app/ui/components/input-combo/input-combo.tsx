import { useId, type ReactNode } from 'react';
import { Input, type InputProps } from '~/ui/components/input/input';
import { Select, type SelectProps } from '~/ui/components/select/select';
import { clsx } from 'clsx';

export function InputCombo({
  className,
  helper,
  input,
  label,
  select,
  selectPosition = 'prefix',
}: {
  helper?: string;
  label?: ReactNode;
  select: Omit<SelectProps, 'helper' | 'label' | 'variant'>;
  input?: Omit<InputProps, 'helper' | 'label' | 'variant'>;
  selectPosition?: 'prefix' | 'suffix';
  className?: string;
}) {
  const generatedId = useId();
  const inputId = input?.id ?? `${generatedId}-input`;
  const selectId = select.id ?? `${generatedId}-select`;
  const hasInput = Boolean(input);
  const labelTargetId = hasInput ? inputId : selectId;
  const selectClassName = clsx(
    hasInput ? 'w-max min-w-max rounded-none' : 'w-full',
    select.className,
  );

  const selectControl = (
    <Select
      {...select}
      id={selectId}
      variant="borderless"
      className={selectClassName}
    />
  );

  const inputControl =
    hasInput && input ? (
      <Input
        {...input}
        id={inputId}
        variant="borderless"
        className={clsx('rounded-none', input.className)}
      />
    ) : null;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={labelTargetId} className="text-base font-medium">
          {label}
        </label>
      ) : null}
      <div
        data-slot="input-combo"
        className={clsx(
          'group flex items-stretch overflow-hidden rounded-lg bg-background shadow-input hover:bg-gray-100',
          'has-focus-visible:bg-background has-focus-visible:shadow-input-focus has-focus-visible:ring-3 has-focus-visible:ring-blue-500/10 has-focus-visible:outline-hidden has-[input:focus]:bg-background has-[input:focus]:shadow-input-focus has-[input:focus]:ring-3 has-[input:focus]:ring-blue-500/10 dark:has-focus-visible:ring-blue-500/15 dark:has-[input:focus]:ring-blue-500/15',
          'dark:bg-white/5',
          'transition-[background-color,shadow] ease-out',
          className,
        )}
      >
        {!hasInput ? (
          selectControl
        ) : selectPosition === 'prefix' ? (
          <>
            <div className="shrink-0">{selectControl}</div>
            <Separator />
            <div className="flex-1">{inputControl}</div>
          </>
        ) : (
          <>
            <div className="flex-1">{inputControl}</div>
            <Separator />
            <div className="shrink-0">{selectControl}</div>
          </>
        )}
      </div>
      {helper ? <p className="mt-0.5 text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function Separator() {
  return (
    <div className="h-3 w-px self-center bg-gray-300 group-hover:bg-gray-400" />
  );
}
