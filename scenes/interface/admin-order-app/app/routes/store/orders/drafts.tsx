import { MainContentLayout } from '../../../components/main-content-layout';
import { DraftOrdersEmptyState } from '~/components/orders/draft-orders-empty-state';
import { DraftOrdersTable } from '~/components/orders/draft-orders-table';
import { DraftsToolbar } from '~/components/orders/drafts-toolbar';
import { useOrdersData } from '~/data/orders';

export default function DraftsPage() {
  const ordersData = useOrdersData();
  const hasDraftOrders = ordersData.length > 0;

  return (
    <>
      <DraftsToolbar hidden={!hasDraftOrders} />
      {hasDraftOrders ? (
        <MainContentLayout variant="fullWidth">
          <DraftOrdersTable />
        </MainContentLayout>
      ) : (
        <DraftOrdersEmptyState />
      )}
    </>
  );
}
