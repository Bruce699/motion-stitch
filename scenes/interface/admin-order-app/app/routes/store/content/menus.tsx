import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { MenusToolbar } from '~/components/content/menus-toolbar';

export default function MenusPage() {
  return (
    <>
      <MenusToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
