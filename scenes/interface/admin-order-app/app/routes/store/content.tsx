import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { ContentToolbar } from '~/components/content/content-toolbar';

export default function ContentPage() {
  return (
    <>
      <ContentToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
