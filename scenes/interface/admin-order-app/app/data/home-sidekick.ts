import type { IconName } from '~/ui';

export type HomeSidekickItem = {
  label: string;
  status: string;
  tone: 'pending';
};

export type HomeSidekickAction = {
  label: string;
  value: string;
} & (
  | {
      iconName: IconName;
      navigationIcon?: never;
    }
  | {
      iconName?: never;
      navigationIcon: 'orders';
    }
);

export const homeSidekickItems: HomeSidekickItem[] = [
  {
    label: 'Loyalty rewards app',
    status: 'Configuring point-per-dollar rules',
    tone: 'pending',
  },
  {
    label: 'Daily store brief',
    status: "Aggregating yesterday's sales by channel",
    tone: 'pending',
  },
];

export const homeSidekickActions: HomeSidekickAction[] = [
  { label: 'Fulfill', navigationIcon: 'orders', value: '12' },
  {
    label: 'Capture',
    iconName: 'HandHoldingCoin',
    value: '3',
  },
  { label: 'Returns', iconName: 'CircleWarning', value: '2' },
  {
    label: 'In 3 days',
    iconName: 'InstantMoney',
    value: '$1,250',
  },
];
