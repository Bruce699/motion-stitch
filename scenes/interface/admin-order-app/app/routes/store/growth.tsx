import { MainContentLayout } from '~/components/main-content-layout';
import { GrowthToolbar } from '~/components/growth/growth-toolbar';
import { UnderConstruction } from '~/components/under-construction';

export default function GrowthPage() {
  return (
    <>
      <GrowthToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
