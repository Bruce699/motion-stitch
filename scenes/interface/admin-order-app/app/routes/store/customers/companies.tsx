import { MainContentLayout } from '../../../components/main-content-layout';
import { CompaniesEmptyState } from '~/components/customers/companies-empty-state';
import { CompaniesTable } from '~/components/customers/companies-table';
import { CompaniesToolbar } from '~/components/customers/companies-toolbar';
import { useCompaniesData } from '~/data/companies';

export default function CompaniesPage() {
  const companiesData = useCompaniesData();
  const hasCompanies = companiesData.length > 0;

  return (
    <>
      <CompaniesToolbar hidden={!hasCompanies} />
      {hasCompanies ? (
        <MainContentLayout variant="fullWidth">
          <CompaniesTable />
        </MainContentLayout>
      ) : (
        <CompaniesEmptyState />
      )}
    </>
  );
}
