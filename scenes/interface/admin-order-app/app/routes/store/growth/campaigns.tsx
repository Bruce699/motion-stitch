import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { CampaignsToolbar } from '~/components/growth/campaigns-toolbar';

export default function CampaignsPage() {
  return (
    <>
      <CampaignsToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
