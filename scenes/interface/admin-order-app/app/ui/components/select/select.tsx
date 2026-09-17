import { Select as BaseSelect } from '@base-ui/react/select';
import { useId } from 'react';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { Icon } from '~/ui/components/icon/icon';
import { clsx } from 'clsx';

type SelectVariant = 'default' | 'borderless';

type SelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

type SelectSharedProps = {
  helper?: string;
  id?: string;
  label?: ReactNode;
  placeholder?: string;
  prefix?: ReactNode;
  options: SelectOption[];
  className?: string;
  trigger?: (value: string | undefined) => ReactElement;
  variant?: SelectVariant;
};

export type SelectProps = Omit<
  ComponentProps<typeof BaseSelect.Root>,
  'children'
> &
  SelectSharedProps;

const selectTriggerBaseClasses =
  'ease-out text-foreground flex h-control items-center justify-between gap-1.5 rounded-lg px-3 pe-2 text-base select-none focus:outline-hidden transition-[background-color,shadow] disabled:border-foreground/20 disabled:bg-gray-100 disabled:opacity-50 disabled:shadow-none dark:disabled:border-white/15 dark:disabled:bg-white/2.5';

const selectTriggerVariants: Record<SelectVariant, string> = {
  default:
    'min-w-40 bg-white shadow-input hover:bg-gray-50 focus-visible:shadow-input-focus active:bg-background dark:bg-white/5 dark:shadow-black/60',
  borderless:
    'bg-transparent shadow-none rounded-none hover:bg-transparent focus-visible:shadow-none active:bg-transparent dark:bg-transparent dark:shadow-none',
};

const selectPopupMaxHeight = 'min(var(--available-height),21rem)';

function selectTriggerClass(variant: SelectVariant = 'default') {
  return `${selectTriggerBaseClasses} ${selectTriggerVariants[variant]}`;
}

export function Select({
  className,
  helper,
  id,
  label,
  options,
  placeholder,
  prefix,
  trigger,
  variant = 'default',
  ...props
}: SelectProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const valueLabel = getSelectValueLabel(props.value, options);
  const customTrigger = trigger?.(valueLabel);

  return (
    <div
      className={clsx(
        'flex flex-col gap-1.5',
        customTrigger ? 'w-fit' : 'w-full',
      )}
    >
      {label && (
        <label htmlFor={triggerId} className="text-base font-medium">
          {label}
        </label>
      )}
      <BaseSelect.Root modal={false} {...props}>
        <Trigger
          id={triggerId}
          className={
            customTrigger
              ? className
              : clsx(selectTriggerClass(variant), className)
          }
          render={customTrigger}
        >
          {customTrigger ? null : (
            <>
              {prefix ? (
                <span className="-ml-0.5 flex shrink-0 text-muted-foreground">
                  {prefix}
                </span>
              ) : null}
              <Value placeholder={placeholder}>{valueLabel}</Value>
              <BaseSelect.Icon className="flex">
                <span className="text-muted-foreground">
                  <Icon name="ChevronExpandY" size={14} />
                </span>
              </BaseSelect.Icon>
            </>
          )}
        </Trigger>
        <BaseSelect.Portal>
          <Positioner>
            <Popup>
              <List>
                {options.map((option) => (
                  <Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    <ItemText>{option.label}</ItemText>
                  </Item>
                ))}
              </List>
            </Popup>
          </Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
      {helper ? <p className="mt-0.5 text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function Trigger(props: ComponentProps<typeof BaseSelect.Trigger>) {
  return <BaseSelect.Trigger {...props} />;
}

function Value({
  className,
  ...props
}: ComponentProps<typeof BaseSelect.Value>) {
  return (
    <BaseSelect.Value
      className={clsx(
        'flex-1 truncate text-left data-placeholder:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

function Positioner({
  className,
  ...props
}: ComponentProps<typeof BaseSelect.Positioner>) {
  return (
    <BaseSelect.Positioner
      align="start"
      className={clsx('z-10 outline-none select-none', className)}
      alignItemWithTrigger={false}
      sideOffset={4}
      {...props}
    />
  );
}

function Popup({
  className,
  style,
  ...props
}: ComponentProps<typeof BaseSelect.Popup>) {
  return (
    <BaseSelect.Popup
      style={
        typeof style === 'function'
          ? (state) => ({ ...style(state), maxHeight: selectPopupMaxHeight })
          : { ...style, maxHeight: selectPopupMaxHeight }
      }
      className={clsx(
        'group flex min-w-[max(var(--anchor-width),120px)] origin-(--transform-origin) flex-col overflow-hidden rounded-lg bg-background shadow-lg transition-[opacity,scale,translate,filter] ease-out outline-none',
        'data-ending-style:scale-97 data-ending-style:opacity-0 data-starting-style:scale-97 data-starting-style:opacity-0',
        'data-[side=bottom]:data-ending-style:-translate-y-2 data-[side=bottom]:data-starting-style:-translate-y-2',
        'data-[side=top]:data-ending-style:translate-y-2 data-[side=top]:data-starting-style:translate-y-2',
        className,
      )}
      {...props}
    />
  );
}

function List({ className, ...props }: ComponentProps<typeof BaseSelect.List>) {
  return (
    <BaseSelect.List
      className={clsx(
        'relative flex-1 scroll-py-6 overflow-y-auto py-1',
        className,
      )}
      {...props}
    />
  );
}

function Item({ className, ...props }: ComponentProps<typeof BaseSelect.Item>) {
  return (
    <BaseSelect.Item
      className={clsx(
        'flex h-control cursor-default items-center gap-2 pr-4 pl-2.5 text-base font-book outline-none select-none',
        'data-highlighted:relative data-highlighted:z-0 data-highlighted:before:absolute data-highlighted:before:inset-x-1 data-highlighted:before:inset-y-0 data-highlighted:before:z-[-1] data-highlighted:before:rounded-sm data-highlighted:before:bg-gray-100',
        className,
      )}
      {...props}
    />
  );
}

function ItemText(props: ComponentProps<typeof BaseSelect.ItemText>) {
  return <BaseSelect.ItemText {...props} />;
}

function getSelectValueLabel(value: unknown, options: SelectOption[]) {
  if (typeof value !== 'string') return undefined;

  const label = options.find((option) => option.value === value)?.label;

  return typeof label === 'string' ? label : value;
}
