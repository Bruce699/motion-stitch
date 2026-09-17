import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { LanguagesToolbar } from '~/components/settings/languages/languages-toolbar';

export default function LanguagesPage() {
  return (
    <>
      <LanguagesToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
