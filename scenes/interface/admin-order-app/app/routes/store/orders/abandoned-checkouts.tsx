import { MainContentLayout } from '../../../components/main-content-layout';
import { AbandonedCheckoutsEmptyState } from '~/components/orders/abandoned-checkouts-empty-state';
import { AbandonedCheckoutsTable } from '~/components/orders/abandoned-checkouts-table';
import { AbandonedCheckoutsToolbar } from '~/components/orders/abandoned-checkouts-toolbar';
import { useAbandonedCheckoutsData } from '~/data/abandoned-checkouts';

export default function AbandonedCheckoutsPage() {
  const abandonedCheckoutsData = useAbandonedCheckoutsData();
  const hasAbandonedCheckouts = abandonedCheckoutsData.length > 0;

  return (
    <>
      <AbandonedCheckoutsToolbar hidden={!hasAbandonedCheckouts} />
      {hasAbandonedCheckouts ? (
        <MainContentLayout variant="fullWidth">
          <AbandonedCheckoutsTable />
        </MainContentLayout>
      ) : (
        <AbandonedCheckoutsEmptyState />
      )}
    </>
  );
}
