import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { GiftCardsToolbar } from '~/components/products/gift-cards-toolbar';

export default function GiftCardsPage() {
  return (
    <>
      <GiftCardsToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
