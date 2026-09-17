import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { DomainsToolbar } from '~/components/settings/domains/domains-toolbar';

export default function DomainsPage() {
  return (
    <>
      <DomainsToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
