import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { CustomerAccountsToolbar } from '~/components/settings/customer-accounts/customer-accounts-toolbar';

export default function CustomerAccountsPage() {
  return (
    <>
      <CustomerAccountsToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
