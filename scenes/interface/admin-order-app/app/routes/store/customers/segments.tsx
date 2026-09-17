import { MainContentLayout } from '../../../components/main-content-layout';
import { CustomerSegmentsEmptyState } from '~/components/customers/customer-segments-empty-state';
import { CustomerSegmentsTable } from '~/components/customers/customer-segments-table';
import { CustomerSegmentsToolbar } from '~/components/customers/customer-segments-toolbar';
import { useCustomerSegmentsData } from '~/data/customer-segments';

export default function SegmentsPage() {
  const customerSegmentsData = useCustomerSegmentsData();
  const hasCustomerSegments = customerSegmentsData.length > 0;

  return (
    <>
      <CustomerSegmentsToolbar hidden={!hasCustomerSegments} />
      {hasCustomerSegments ? (
        <MainContentLayout variant="fullWidth">
          <CustomerSegmentsTable />
        </MainContentLayout>
      ) : (
        <CustomerSegmentsEmptyState />
      )}
    </>
  );
}
