import { MainContentLayout } from '~/components/main-content-layout';
import { OnlineStoreToolbar } from '~/components/online-store/online-store-toolbar';
import { UnderConstruction } from '~/components/under-construction';

export default function OnlineStorePage() {
  return (
    <>
      <OnlineStoreToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
