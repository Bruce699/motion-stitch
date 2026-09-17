import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { MarketsToolbar } from '~/components/markets/markets-toolbar';

export default function MarketsPage() {
  return (
    <>
      <MarketsToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
