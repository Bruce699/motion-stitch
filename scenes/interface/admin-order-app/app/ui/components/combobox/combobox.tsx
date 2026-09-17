import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import {
  Fragment,
  useMemo,
  useId,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import * as Checkbox from '~/ui/components/checkbox/checkbox';
import { Icon, type IconName } from '~/ui/components/icon/icon';
import { clsx } from 'clsx';

type ComboboxVariant = 'default' | 'borderless';

type ComboboxOption = {
  value: string;
  label: ReactNode;
  heading?: ReactNode;
  disabled?: boolean;
  action?: boolean;
};

type ComboboxSharedProps = {
  helper?: string;
  id?: string;
  label?: ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  footer?: {
    icon: IconName;
    label: string;
    onClick: () => void;
  };
  options: ComboboxOption[];
  className?: string;
  containerClassName?: string;
  createOptionLabel?: (value: string) => ReactNode;
  onCreateOption?: (value: string) => void;
  popupMaxWidth?: string;
  trigger?: (value: ReactNode) => ReactElement;
  variant?: ComboboxVariant;
  selectionMode?: 'single' | 'multiple';
  multipleSelectionLabel?: (count: number) => ReactNode;
};

export type ComboboxProps = Omit<
  ComponentProps<typeof BaseCombobox.Root<string, true>>,
  'children' | 'items' | 'itemToStringLabel' | 'multiple'
> &
  ComboboxSharedProps;

const comboboxTriggerBaseClasses =
  'ease-out text-foreground flex h-control items-center justify-between gap-1.5 rounded-lg px-3 pe-2 text-base select-none focus:outline-hidden transition-[background-color,shadow] disabled:border-foreground/20 disabled:bg-gray-100 disabled:opacity-50 disabled:shadow-none dark:disabled:border-white/15 dark:disabled:bg-white/2.5';

const comboboxTriggerVariants: Record<ComboboxVariant, string> = {
  default:
    'min-w-40 bg-white shadow-input hover:bg-gray-50 focus-visible:shadow-input-focus active:bg-background dark:bg-white/5 dark:shadow-black/60',
  borderless:
    'bg-transparent shadow-none rounded-none hover:bg-transparent focus-visible:shadow-none active:bg-transparent dark:bg-transparent dark:shadow-none',
};

const comboboxPopupMaxHeight = 'min(var(--available-height),21rem)';
const comboboxPopupMaxWidth = '24rem';
const comboboxPopupMinWidth = '14rem';

function comboboxTriggerClass(variant: ComboboxVariant = 'default') {
  return `${comboboxTriggerBaseClasses} ${comboboxTriggerVariants[variant]}`;
}

export function Combobox({
  className,
  containerClassName,
  footer,
  helper,
  id,
  label,
  multipleSelectionLabel = (count) => `${count} collections`,
  onCreateOption,
  onValueChange,
  options,
  placeholder = 'Select options',
  popupMaxWidth,
  searchPlaceholder = 'Search',
  selectionMode = 'multiple',
  trigger,
  variant = 'default',
  createOptionLabel,
  ...props
}: ComboboxProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const inputId = `${triggerId}-search`;
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();
  const createOptionValue = `__create__:${trimmedQuery}`;
  const canCreateOption =
    Boolean(onCreateOption) &&
    trimmedQuery.length > 0 &&
    !options.some(
      (option) => option.value.toLowerCase() === trimmedQuery.toLowerCase(),
    );
  const renderedOptions = useMemo<ComboboxOption[]>(
    () =>
      canCreateOption
        ? [
            ...options,
            {
              value: createOptionValue,
              action: true,
              label: createOptionLabel?.(trimmedQuery) ?? (
                <span>Create "{trimmedQuery}"</span>
              ),
            },
          ]
        : options,
    [
      canCreateOption,
      createOptionLabel,
      createOptionValue,
      options,
      trimmedQuery,
    ],
  );
  const optionValues = renderedOptions.map((option) => option.value);
  const value = (
    <BaseCombobox.Value>
      {(value: string[]) => (
        <span
          className={clsx(
            'flex-1 truncate text-left',
            value.length === 0 && 'text-muted-foreground',
          )}
        >
          {getValueLabel(value, options, placeholder, multipleSelectionLabel)}
        </span>
      )}
    </BaseCombobox.Value>
  );
  const customTrigger = trigger?.(value);
  const multiple = selectionMode === 'multiple';

  return (
    <div
      className={clsx(
        'flex flex-col gap-1.5',
        customTrigger ? 'w-fit' : 'w-full',
        containerClassName,
      )}
    >
      {label && (
        <label htmlFor={inputId} className="text-base font-medium">
          {label}
        </label>
      )}
      <BaseCombobox.Root
        modal={false}
        multiple={multiple}
        items={optionValues}
        itemToStringLabel={(value) => getOptionLabel(value, renderedOptions)}
        {...props}
        onValueChange={(nextValue, eventDetails) => {
          const selectedValues = Array.isArray(nextValue)
            ? nextValue
            : nextValue
              ? [nextValue]
              : [];
          const selectedCreateOption = selectedValues.find(
            (value) => value === createOptionValue,
          );

          if (selectedCreateOption && onCreateOption) {
            onCreateOption(trimmedQuery);
            setQuery('');
            return;
          }

          onValueChange?.(selectedValues, eventDetails);
        }}
      >
        <BaseCombobox.Trigger
          id={triggerId}
          className={
            customTrigger
              ? className
              : clsx(comboboxTriggerClass(variant), className)
          }
          render={customTrigger}
        >
          {customTrigger ? null : (
            <>
              {value}
              <BaseCombobox.Icon className="flex">
                <span className="text-muted-foreground">
                  <Icon name="ChevronExpandY" size={14} />
                </span>
              </BaseCombobox.Icon>
            </>
          )}
        </BaseCombobox.Trigger>
        <BaseCombobox.Portal>
          <Positioner>
            <Popup maxWidth={popupMaxWidth}>
              <div className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-border bg-background px-3 py-2.5">
                <span className="shrink-0 text-muted-foreground">
                  <Icon name="Search" />
                </span>
                <BaseCombobox.Input
                  id={inputId}
                  aria-label={searchPlaceholder}
                  placeholder=" "
                  value={query}
                  onChange={(event) => setQuery(event.currentTarget.value)}
                  className="peer relative z-10 block h-full flex-1 truncate border-0 bg-transparent text-base text-foreground outline-none"
                />
                <span className="pointer-events-none absolute right-3 left-10 truncate text-base text-muted-foreground peer-[:not(:placeholder-shown)]:hidden">
                  {searchPlaceholder}
                </span>
              </div>
              <List>
                <BaseCombobox.Empty className="contents">
                  <div className="flex min-h-24 items-center justify-center p-2 text-base text-muted-foreground">
                    No results found.
                  </div>
                </BaseCombobox.Empty>
                <BaseCombobox.Collection>
                  {(value: string, index: number) => {
                    const optionIndex = renderedOptions.findIndex(
                      (item) => item.value === value,
                    );
                    const option = renderedOptions[optionIndex];
                    const showHeading =
                      option?.heading &&
                      option.heading !==
                        renderedOptions[optionIndex - 1]?.heading;

                    if (!option) return null;

                    return (
                      <Fragment key={option.value}>
                        {showHeading ? (
                          <Heading>{option.heading}</Heading>
                        ) : null}
                        <Item
                          value={option.value}
                          index={index}
                          disabled={option.disabled}
                          className="pr-3"
                        >
                          {option.action || !multiple ? null : (
                            <ItemIndicator />
                          )}
                          <span className="truncate">{option.label}</span>
                        </Item>
                      </Fragment>
                    );
                  }}
                </BaseCombobox.Collection>
              </List>
              {footer ? (
                <div className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-background p-1">
                  <button
                    type="button"
                    className="flex h-control w-full items-center gap-2 rounded-sm px-2 text-left text-base font-medium text-secondary hover:bg-gray-50"
                    onClick={footer.onClick}
                  >
                    <span className="text-muted-foreground">
                      <Icon name={footer.icon} />
                    </span>
                    <span>{footer.label}</span>
                  </button>
                </div>
              ) : null}
            </Popup>
          </Positioner>
        </BaseCombobox.Portal>
      </BaseCombobox.Root>
      {helper ? <p className="mt-0.5 text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function Positioner({
  className,
  ...props
}: ComponentProps<typeof BaseCombobox.Positioner>) {
  return (
    <BaseCombobox.Positioner
      align="start"
      className={clsx('z-10 outline-none select-none', className)}
      sideOffset={4}
      {...props}
    />
  );
}

function Popup({
  className,
  maxWidth,
  style,
  ...props
}: ComponentProps<typeof BaseCombobox.Popup> & {
  maxWidth?: string;
}) {
  const popupMaxWidth = maxWidth ?? comboboxPopupMaxWidth;
  const popupStyle = {
    maxHeight: comboboxPopupMaxHeight,
    width: `min(max(var(--anchor-width), ${comboboxPopupMinWidth}), ${popupMaxWidth}, var(--available-width))`,
  };

  return (
    <BaseCombobox.Popup
      style={
        typeof style === 'function'
          ? (state) => ({
              ...style(state),
              ...popupStyle,
            })
          : { ...style, ...popupStyle }
      }
      className={clsx(
        'group flex origin-(--transform-origin) flex-col overflow-hidden rounded-lg bg-background shadow-lg transition-[opacity,scale,translate,filter] ease-out outline-none',
        'data-ending-style:scale-97 data-ending-style:opacity-0 data-starting-style:scale-97 data-starting-style:opacity-0',
        'data-[side=bottom]:data-ending-style:-translate-y-2 data-[side=bottom]:data-starting-style:-translate-y-2',
        'data-[side=top]:data-ending-style:translate-y-2 data-[side=top]:data-starting-style:translate-y-2',
        className,
      )}
      {...props}
    />
  );
}

function List({
  className,
  ...props
}: ComponentProps<typeof BaseCombobox.List>) {
  return (
    <BaseCombobox.List
      className={clsx(
        'relative flex-1 scroll-py-6 overflow-y-auto p-1',
        className,
      )}
      {...props}
    />
  );
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <div className="px-2 pt-2 pb-1 text-sm font-medium text-muted-foreground">
      {children}
    </div>
  );
}

function Item({
  className,
  ...props
}: ComponentProps<typeof BaseCombobox.Item>) {
  return (
    <BaseCombobox.Item
      className={clsx(
        'flex h-control cursor-pointer items-center gap-2 rounded-sm px-2 py-3 text-base font-book outline-none select-none hover:bg-gray-50',
        'data-highlighted:bg-gray-50',
        className,
      )}
      {...props}
    />
  );
}

function ItemIndicator(
  props: ComponentProps<typeof BaseCombobox.ItemIndicator>,
) {
  return (
    <BaseCombobox.ItemIndicator
      keepMounted
      render={(htmlProps, state) => (
        <span {...htmlProps}>
          <Checkbox.Root
            checked={state.selected}
            tabIndex={-1}
            aria-hidden
            className="pointer-events-none"
          >
            <Checkbox.Indicator />
          </Checkbox.Root>
        </span>
      )}
      {...props}
    />
  );
}

function getOptionLabel(value: string, options: ComboboxOption[]) {
  const label = options.find((option) => option.value === value)?.label;

  return typeof label === 'string' ? label : value;
}

function getValueLabel(
  value: string[] | null | undefined,
  options: ComboboxOption[],
  placeholder: ReactNode,
  multipleSelectionLabel: (count: number) => ReactNode,
) {
  if (!value || value.length === 0) return placeholder;

  if (value.length === 1) {
    return (
      options.find((option) => option.value === value[0])?.label ?? value[0]
    );
  }

  return multipleSelectionLabel(value.length);
}
