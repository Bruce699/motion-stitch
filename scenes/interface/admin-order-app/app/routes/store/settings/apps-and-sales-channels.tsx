import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { AppsAndSalesChannelsToolbar } from '~/components/settings/apps-and-sales-channels/apps-and-sales-channels-toolbar';

export default function AppsAndSalesChannelsPage() {
  return (
    <>
      <AppsAndSalesChannelsToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
