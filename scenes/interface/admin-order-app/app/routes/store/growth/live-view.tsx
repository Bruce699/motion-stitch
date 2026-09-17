import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { LiveViewToolbar } from '~/components/growth/live-view-toolbar';

export default function LiveViewPage() {
  return (
    <>
      <LiveViewToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
