import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { MetaobjectsToolbar } from '~/components/content/metaobjects-toolbar';

export default function MetaobjectsPage() {
  return (
    <>
      <MetaobjectsToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
