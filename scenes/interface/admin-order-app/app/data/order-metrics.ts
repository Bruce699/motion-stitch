import type { MetricsBarItem } from '~/ui';

export const orderMetrics = [
  {
    id: 'orders',
    label: 'Orders',
    value: { metric: 524 },
    change: { metric: 5, prefix: '+', suffix: '%', tone: 'positive' },
    sparkline: {
      data: [42, 42, 44, 43, 41, 45, 46, 45, 48, 47, 48, 47],
      variant: 'positive',
    },
  },
  {
    id: 'items-ordered',
    label: 'Items ordered',
    value: { metric: 1254 },
    change: { metric: 1.2, prefix: '+', suffix: '%', tone: 'positive' },
    sparkline: {
      data: [118, 120, 116, 121, 119, 123, 121, 124, 123, 126, 124, 129],
      variant: 'positive',
    },
  },
  {
    id: 'returns',
    label: 'Returns',
    value: { metric: 124 },
    change: { metric: -4, suffix: '%', tone: 'neutral' },
    sparkline: {
      data: [18, 19, 18, 17, 18, 17, 16, 17, 15, 16, 14, 15],
      variant: 'default',
    },
  },
  {
    id: 'return-rate',
    label: 'Return rate',
    value: { metric: 1.28, suffix: '%' },
    change: { metric: -0.2, suffix: '%', tone: 'positive' },
    sparkline: {
      data: [
        1.2, 1.23, 1.21, 1.25, 1.24, 1.27, 1.25, 1.3, 1.29, 1.32, 1.31, 1.35,
      ],
      variant: 'positive',
    },
  },
  {
    id: 'orders-fulfilled',
    label: 'Orders fulfilled',
    value: { metric: 343 },
    change: { metric: 4.2, prefix: '+', suffix: '%', tone: 'positive' },
    sparkline: {
      data: [31, 33, 32, 34, 32, 35, 36, 34, 37, 36, 38, 37],
      variant: 'positive',
    },
  },
] satisfies MetricsBarItem[];
