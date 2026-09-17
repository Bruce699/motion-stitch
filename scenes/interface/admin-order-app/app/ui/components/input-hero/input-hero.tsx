import { Input as BaseInput } from '@base-ui/react/input';
import React from 'react';
import { clsx } from 'clsx';

const inputHeroRootBaseClasses =
  'group/input-hero flex flex-1 flex-col gap-0.5 font-medium';

const inputHeroControlBaseClasses =
  'relative isolate flex items-center rounded-md before:pointer-events-none before:absolute focus-within:hover:before:bg-background before:-inset-x-2 before:-inset-y-1.5 before:z-[-1] before:rounded-xl before:bg-transparent before:transition-[background-color,shadow] before:ease-out hover:before:bg-gray-50 group-hover/input-hero:before:bg-gray-50 focus:before:bg-white focus-within:before:shadow-input-focus dark:hover:before:bg-white/5 dark:group-hover/input-hero:before:bg-white/5 dark:focus-within:before:bg-white/5';

const inputHeroInputBaseClasses =
  'text-foreground placeholder:text-muted-foreground flex-1 border-0 bg-transparent p-0 text-3xl leading-none shadow-none ring-0 focus:outline-hidden focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50';

type InputHeroProps = Omit<React.ComponentProps<typeof BaseInput>, 'size'> & {
  label: string;
};

export function InputHero({ className, id, label, ...props }: InputHeroProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  return (
    <div className={clsx(inputHeroRootBaseClasses, className)}>
      <label htmlFor={inputId} className="mb-1 text-muted-foreground">
        {label}
      </label>
      <div className={inputHeroControlBaseClasses}>
        <BaseInput
          id={inputId}
          className={inputHeroInputBaseClasses}
          data-slot="input-hero"
          {...props}
        />
      </div>
    </div>
  );
}
