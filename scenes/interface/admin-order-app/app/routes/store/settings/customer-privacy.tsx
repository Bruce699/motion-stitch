import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { CustomerPrivacyToolbar } from '~/components/settings/customer-privacy/customer-privacy-toolbar';

export default function CustomerPrivacyPage() {
  return (
    <>
      <CustomerPrivacyToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
