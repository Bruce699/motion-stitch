import { MainContentLayout } from '../../components/main-content-layout';
import { OrdersMetrics } from '~/components/orders/orders-metrics';
import { OrdersTable } from '~/components/orders/orders-table';
import { OrdersToolbar } from '~/components/orders/orders-toolbar';
import { OrdersEmptyState } from '~/components/orders/orders-empty-state';
import { useOrdersData } from '~/data/orders';

export default function OrdersPage() {
  const ordersData = useOrdersData();
  const hasOrders = ordersData.length > 0;

  return (
    <>
      <OrdersToolbar hidden={!hasOrders} />
      {hasOrders ? (
        <MainContentLayout variant="fullWidth">
          <OrdersMetrics />
          <OrdersTable />
        </MainContentLayout>
      ) : (
        <OrdersEmptyState />
      )}
    </>
  );
}
