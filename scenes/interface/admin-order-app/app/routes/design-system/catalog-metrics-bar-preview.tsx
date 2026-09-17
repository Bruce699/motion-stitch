import { MetricsBar } from '~/ui';

function MetricsBarPreview() {
  return (
    <MetricsBar
      ariaLabel="Store performance metrics"
      className="w-full max-w-2xl"
      metrics={[
        {
          id: 'sales',
          label: 'Net sales',
          value: { metric: 4280, prefix: '$' },
          change: { metric: 8.4, prefix: '+', suffix: '%', tone: 'positive' },
          sparkline: {
            data: [42, 44, 46, 43, 48, 52, 56],
            variant: 'positive',
          },
        },
        {
          id: 'orders',
          label: 'Orders',
          value: { metric: 128 },
          change: { metric: 3, prefix: '+', suffix: '%', tone: 'positive' },
        },
        {
          id: 'returns',
          label: 'Returns',
          value: { metric: 7 },
          change: { metric: 2, prefix: '-', suffix: '%', tone: 'negative' },
          sparkline: {
            data: [12, 10, 11, 9, 8, 7, 6],
            variant: 'negative',
          },
        },
      ]}
    />
  );
}

export { MetricsBarPreview };
