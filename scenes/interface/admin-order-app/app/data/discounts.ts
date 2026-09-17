import type { IconName } from '~/ui';

type DiscountStatus = 'Active' | 'Expired';
export type DiscountCombinationType = 'products' | 'orders' | 'shipping';

type DiscountCombination = {
  type: DiscountCombinationType;
  active: boolean;
};

export type Discount = {
  id: string;
  title: string;
  description: string;
  status: DiscountStatus;
  method: string;
  eligibility: string;
  type: string;
  typeIcon: IconName;
  collectionIds: string[];
  combinations: DiscountCombination[];
  used: number;
};

export type DiscountAsideMetric = {
  title: string;
  metric: number;
  prefix?: string;
  sparkline?: {
    data: number[];
    label: number;
    prefix?: string;
    suffix?: string;
    variant?: 'default' | 'positive' | 'negative';
  };
};

export type DiscountOpportunity = {
  icon: IconName;
  title: string;
  description: string;
};

export const discountPurchaseTypeOptions = [
  { value: 'One-time purchase', label: 'One-time purchase' },
  { value: 'Subscription', label: 'Subscription' },
  {
    value: 'One-time and subscription',
    label: 'One-time and subscription',
  },
];

export const discountCustomerSegmentOptions = [
  { value: 'top-customers', label: 'Top customers' },
  { value: 'new-customers', label: 'New customers' },
  { value: 'returning-customers', label: 'Returning customers' },
  { value: 'vip-customers', label: 'VIP customers' },
  { value: 'at-risk-customers', label: 'At-risk customers' },
];

export const discountAsideMetrics: DiscountAsideMetric[] = [
  {
    title: 'Sales',
    metric: 63,
    sparkline: {
      data: [42, 64, 39, 34, 24],
      label: -4,
      suffix: '%',
      variant: 'negative',
    },
  },
  {
    title: 'Total uses',
    metric: 225,
    sparkline: {
      data: [12, 16, 64, 64, 82],
      label: 5,
      prefix: '+',
      suffix: '%',
      variant: 'positive',
    },
  },
  {
    title: 'Avg. order value',
    prefix: '$',
    metric: 62.5,
  },
];

export const discountOpportunities: DiscountOpportunity[] = [
  {
    icon: 'Megaphone',
    title: 'Share with Top Customers',
    description:
      'Promote this discount with Top Customers right away with a targeted email campaign.',
  },
  {
    icon: 'ConnectedDots3',
    title: 'Add More Sales Channels',
    description:
      'Publish this offer across your active channels to reach more shoppers while demand is high.',
  },
  {
    icon: 'Tag',
    title: 'Bundle with Best Sellers',
    description:
      'Pair this discount with top products to raise order value and move more inventory.',
  },
];

export const discounts: Discount[] = [
  {
    id: 'PUSHOFF10',
    title: 'PUSHOFF10',
    description: '10% off first deck order',
    status: 'Active',
    method: 'Code',
    eligibility: 'All customers',
    type: 'Amount off order',
    typeIcon: 'DiscountCode',
    collectionIds: [
      'skateboards',
      'shirts',
      'beanies',
      'hoodies',
      'sneakers',
      'overshirts',
    ],
    combinations: [
      { type: 'products', active: true },
      { type: 'orders', active: true },
      { type: 'shipping', active: false },
    ],
    used: 184,
  },
  {
    id: 'DECKDROP10',
    title: 'DECKDROP10',
    description: '€10.00 off team decks (3 variants) • Applies once per order',
    status: 'Active',
    method: 'Code',
    eligibility: 'All customers',
    type: 'Amount off product',
    typeIcon: 'Tag',
    collectionIds: [
      'skateboards',
      'sneakers',
      'shirts',
      'beanies',
      'hoodies',
      'sweatshirts',
    ],
    combinations: [
      { type: 'products', active: true },
      { type: 'orders', active: false },
      { type: 'shipping', active: true },
    ],
    used: 42,
  },
  {
    id: 'GRIPTAPEDEAL',
    title: 'GRIPTAPEDEAL',
    description: '€10.00 off grip tape bundles • Applies once per order',
    status: 'Active',
    method: 'Code',
    eligibility: 'All customers',
    type: 'Amount off product',
    typeIcon: 'Tag',
    collectionIds: [
      'skateboards',
      'overshirts',
      'shirts',
      'beanies',
      'sneakers',
      'hoodies',
    ],
    combinations: [
      { type: 'products', active: true },
      { type: 'orders', active: false },
      { type: 'shipping', active: false },
    ],
    used: 18,
  },
  {
    id: 'SKATESALE',
    title: 'SKATESALE',
    description: '10% off park-ready gear',
    status: 'Expired',
    method: 'Code',
    eligibility: 'All customers',
    type: 'Amount off order',
    typeIcon: 'DiscountCode',
    collectionIds: [
      'skateboards',
      'shirts',
      'hoodies',
      'sweatshirts',
      'sneakers',
      'beanies',
      'overshirts',
    ],
    combinations: [
      { type: 'products', active: false },
      { type: 'orders', active: true },
      { type: 'shipping', active: true },
    ],
    used: 312,
  },
  {
    id: 'SESSIONBOGO',
    title: 'SESSIONBOGO',
    description: 'Buy 1 tee, get 1 beanie free',
    status: 'Active',
    method: 'Code',
    eligibility: 'All customers',
    type: 'Buy X get Y',
    typeIcon: 'DiscountTag',
    collectionIds: [
      'shirts',
      'beanies',
      'hoodies',
      'sweatshirts',
      'skateboards',
      'sneakers',
    ],
    combinations: [
      { type: 'products', active: true },
      { type: 'orders', active: true },
      { type: 'shipping', active: true },
    ],
    used: 96,
  },
];

export function useDiscountsData() {
  return discounts;
}
