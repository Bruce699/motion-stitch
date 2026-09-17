import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { RiskManagementToolbar } from '~/components/payments/risk-management-toolbar';

export default function RiskManagementPage() {
  return (
    <>
      <RiskManagementToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
