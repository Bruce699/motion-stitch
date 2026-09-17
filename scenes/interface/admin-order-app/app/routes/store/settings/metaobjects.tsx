import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { SettingsMetaobjectsToolbar } from '~/components/settings/metaobjects/metaobjects-toolbar';

export default function SettingsMetaobjectsPage() {
  return (
    <>
      <SettingsMetaobjectsToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
