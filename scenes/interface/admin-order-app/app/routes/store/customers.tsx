import { MainContentLayout } from '../../components/main-content-layout';
import { CustomersTable } from '~/components/customers/customers-table';
import { CustomersToolbar } from '~/components/customers/customers-toolbar';
import { CustomersEmptyState } from '~/components/customers/customers-empty-state';
import { useCustomersData } from '~/data/customers';

export default function CustomersPage() {
  const customersData = useCustomersData();
  const hasCustomers = customersData.length > 0;

  return (
    <>
      <CustomersToolbar hidden={!hasCustomers} />
      {hasCustomers ? (
        <MainContentLayout variant="fullWidth">
          <CustomersTable />
        </MainContentLayout>
      ) : (
        <CustomersEmptyState />
      )}
    </>
  );
}
