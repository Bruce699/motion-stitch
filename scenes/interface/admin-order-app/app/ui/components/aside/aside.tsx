import type { ComponentProps, ReactNode } from 'react';
import {
  AsideTimeline,
  type AsideTimelineEvent,
} from '~/ui/components/aside/aside-timeline';
import {
  AsideOpportunities,
  type AsideOpportunity,
} from '~/ui/components/aside/aside-opportunities';
import {
  Combobox,
  type ComboboxProps,
} from '~/ui/components/combobox/combobox';
import { Menu } from '~/ui/components/menu/menu';
import { Select, type SelectProps } from '~/ui/components/select/select';
import { Icon, type IconName } from '~/ui/components/icon/icon';
import {
  AnimatedNumber,
  type AnimatedNumberTone,
} from '~/ui/components/animated-number/animated-number';
import { Sparkline } from '~/ui/components/sparkline/sparkline';
import {
  StatusIndicator,
  type StatusIndicatorStatus,
} from '~/ui/components/status-indicator/status-indicator';
import { Switch } from '~/ui/components/switch/switch';
import { clsx } from 'clsx';

function Root({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="aside-root"
      className={clsx('relative flex flex-col gap-4', className)}
      {...props}
    />
  );
}

function Group({
  children,
  className,
  heading,
  opportunities = false,
  ...props
}: ComponentProps<'section'> & {
  heading?: string;
  opportunities?: boolean;
}) {
  const groupHeading = opportunities ? undefined : heading;

  return (
    <section
      data-slot="aside-group"
      className={clsx(
        'group mx-1.5 flex flex-col border-border [&+[data-slot=aside-group]]:border-t [&+[data-slot=aside-group]]:border-border [&+[data-slot=aside-group]]:pt-4',
        className,
      )}
      {...props}
    >
      {groupHeading ? (
        <h2
          data-slot="aside-group-heading"
          className="mb-1 text-sm font-medium text-muted-foreground"
        >
          {groupHeading}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

type MetricItemProps = {
  type: 'metric';
  title: string;
  metric: number;
  prefix?: string;
  suffix?: string;
  tone?: AnimatedNumberTone;
  animated?: boolean;
  sparkline?: ComponentProps<typeof Sparkline>;
};

type SelectItemProps = {
  type: 'select';
  label: string;
  icon?: IconName;
} & Omit<SelectProps, 'className' | 'label' | 'trigger' | 'variant'>;

type ComboboxItemProps = {
  type: 'combobox';
  label: string;
  icon?: IconName;
} & Omit<
  ComboboxProps,
  'className' | 'containerClassName' | 'label' | 'trigger' | 'variant'
>;

type MenuItemOption = {
  value: string;
  label: ReactNode;
  heading?: ReactNode;
  disabled?: boolean;
};

type MenuItemProps = {
  type: 'menu';
  label: string;
  icon?: IconName;
  value: string[];
  options: MenuItemOption[];
  optionIndicator?: 'check' | 'switch';
  placeholder?: ReactNode;
  multipleSelectionLabel?: (count: number) => ReactNode;
  onValueChange: (value: string[]) => void;
};

type OpportunitiesItemProps = {
  type: 'opportunities';
  opportunities: readonly AsideOpportunity[];
};

type InfoItemProps = {
  type: 'info';
  icon?: IconName;
  spaceBetween?: boolean;
  children: ReactNode;
};

type StatusItemProps = {
  type: 'status';
  status: StatusIndicatorStatus;
  label?: string;
} & Omit<SelectProps, 'className' | 'label' | 'trigger' | 'variant'>;

type ItemProps =
  | MetricItemProps
  | SelectItemProps
  | ComboboxItemProps
  | MenuItemProps
  | StatusItemProps
  | OpportunitiesItemProps
  | InfoItemProps;

function Item(props: ItemProps) {
  const { type } = props;

  if (type === 'metric') {
    const { animated, metric, prefix, sparkline, suffix, title, tone } = props;

    return (
      <div
        data-slot="aside-item"
        data-type={type}
        className="flex justify-between py-0.75"
      >
        <dt>{title}</dt>
        <dd className="flex items-center gap-3 font-medium">
          <AnimatedNumber
            animated={animated}
            metric={metric}
            prefix={prefix}
            suffix={suffix}
            tone={tone}
          />
          {sparkline ? (
            <Sparkline width={16} height={8} {...sparkline} />
          ) : null}
        </dd>
      </div>
    );
  }

  if (type === 'select') {
    const { icon, label, type: itemType, ...selectProps } = props;
    void itemType;

    return (
      <Select
        {...selectProps}
        trigger={(value) => <Trigger icon={icon} label={label} value={value} />}
      />
    );
  }

  if (type === 'combobox') {
    const { icon, label, type: itemType, ...comboboxProps } = props;
    void itemType;

    return (
      <Combobox
        {...comboboxProps}
        trigger={(value) => <Trigger icon={icon} label={label} value={value} />}
      />
    );
  }

  if (type === 'menu') {
    const {
      icon,
      label,
      multipleSelectionLabel = (count) => `${count} selected`,
      onValueChange,
      optionIndicator = 'check',
      options,
      placeholder = 'Select options',
      value,
    } = props;
    const selectedValues = new Set(value);
    const menuOptions: ComponentProps<typeof Menu>['options'] = [];
    const getNextValue = (optionValue: string) =>
      selectedValues.has(optionValue)
        ? value.filter((selectedValue) => selectedValue !== optionValue)
        : [...value, optionValue];

    for (const [index, option] of options.entries()) {
      const previousOption = options[index - 1];

      if (option.heading && option.heading !== previousOption?.heading) {
        menuOptions.push({
          type: 'heading',
          id:
            typeof option.heading === 'string'
              ? option.heading
              : `${option.value}-heading`,
          label: option.heading,
        });
      }

      menuOptions.push({
        id: option.value,
        checked:
          optionIndicator === 'check'
            ? selectedValues.has(option.value)
            : undefined,
        closeOnClick: optionIndicator === 'switch' ? false : undefined,
        children: option.label,
        disabled: option.disabled,
        onSelect: () => onValueChange(getNextValue(option.value)),
        suffix:
          optionIndicator === 'switch' ? (
            <Switch
              ariaLabel={
                typeof option.label === 'string' ? option.label : option.value
              }
              checked={selectedValues.has(option.value)}
              onCheckedChange={() => onValueChange(getNextValue(option.value))}
            />
          ) : undefined,
      });
    }

    return (
      <div className="w-fit">
        <Menu
          trigger={(triggerValue) => (
            <Trigger icon={icon} label={label} value={triggerValue} />
          )}
          triggerLabel={getMenuValueLabel(
            value,
            options,
            placeholder,
            multipleSelectionLabel,
          )}
          options={menuOptions}
          popupClassName="w-[min(max(var(--anchor-width),14rem),24rem,var(--available-width))]"
        />
      </div>
    );
  }

  if (type === 'status') {
    const { label = 'Status', status, type: itemType, ...selectProps } = props;
    void itemType;

    return (
      <Select
        {...selectProps}
        trigger={(value) => (
          <Trigger label={label} status={status} value={value} />
        )}
      />
    );
  }

  if (type === 'info') {
    const { children, icon, spaceBetween } = props;

    return (
      <p
        data-slot="aside-item"
        data-type={type}
        className={clsx(
          'flex items-start gap-2 py-1',
          spaceBetween && 'justify-between gap-3',
        )}
      >
        {icon ? (
          <span className="mt-0.5 text-muted-foreground">
            <Icon name={icon} />
          </span>
        ) : null}
        {spaceBetween ? children : <span>{children}</span>}
      </p>
    );
  }

  const { opportunities } = props;

  return <AsideOpportunities opportunities={opportunities} />;
}

function Trigger({
  icon,
  label,
  status,
  value,
  ...props
}: Omit<ComponentProps<'button'>, 'className' | 'value'> & {
  icon?: IconName;
  label: string;
  status?: StatusIndicatorStatus;
  value?: ReactNode;
}) {
  return (
    <button
      type="button"
      className="-ml-1.5 justify-between rounded-full px-1.5 py-1 pr-3 transition-colors ease-out hover:bg-muted"
      {...props}
    >
      <span className="flex items-center gap-2">
        {status ? (
          <StatusIndicator status={status} />
        ) : icon ? (
          <span className="text-muted-foreground">
            <Icon name={icon} />
          </span>
        ) : null}
        <span className={clsx('truncate', !value && 'text-muted-foreground')}>
          {value || label}
        </span>
      </span>
    </button>
  );
}

function getMenuValueLabel(
  value: string[],
  options: MenuItemOption[],
  placeholder: ReactNode,
  multipleSelectionLabel: (count: number) => ReactNode,
) {
  if (value.length === 0) return placeholder;

  if (value.length === 1) {
    return (
      options.find((option) => option.value === value[0])?.label ?? value[0]
    );
  }

  return multipleSelectionLabel(value.length);
}

const Timeline = AsideTimeline;

export { Group, Item, Root, Timeline, type AsideTimelineEvent };
