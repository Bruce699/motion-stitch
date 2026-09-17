import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { AttributionToolbar } from '~/components/growth/attribution-toolbar';

export default function AttributionPage() {
  return (
    <>
      <AttributionToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
