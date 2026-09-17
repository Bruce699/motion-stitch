import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { TransfersToolbar } from '~/components/products/transfers-toolbar';

export default function TransfersPage() {
  return (
    <>
      <TransfersToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
