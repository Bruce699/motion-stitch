import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { ReportsToolbar } from '~/components/growth/reports-toolbar';

export default function ReportsPage() {
  return (
    <>
      <ReportsToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
