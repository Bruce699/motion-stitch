import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { CatalogsToolbar } from '~/components/markets/catalogs-toolbar';

export default function CatalogsPage() {
  return (
    <>
      <CatalogsToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
