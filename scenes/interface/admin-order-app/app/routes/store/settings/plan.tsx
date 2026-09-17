import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { PlanToolbar } from '~/components/settings/plan/plan-toolbar';

export default function PlanPage() {
  return (
    <>
      <PlanToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
