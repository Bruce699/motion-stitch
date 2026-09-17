import { orderMetrics } from '~/data/order-metrics';
import { MetricsBar } from '~/ui';

export function OrdersMetrics() {
  return (
    <MetricsBar
      ariaLabel="Order metrics"
      metrics={orderMetrics}
      className="px-3"
    />
  );
}
