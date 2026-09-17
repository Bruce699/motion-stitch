import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { PoliciesToolbar } from '~/components/settings/policies/policies-toolbar';

export default function PoliciesPage() {
  return (
    <>
      <PoliciesToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
