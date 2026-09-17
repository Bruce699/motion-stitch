import { MainContentLayout } from '~/components/main-content-layout';
import { GeneralToolbar } from '~/components/settings/general/general-toolbar';
import {
  OrderIdSection,
  OrganizationsSection,
  ResourcesSection,
  StoreSummaryCardsSection,
  StoreDefaultsSection,
} from '~/components/settings/general';

export default function GeneralPage() {
  return (
    <>
      <GeneralToolbar />
      <MainContentLayout>
        <div className="flex flex-col gap-8 pb-16">
          <div data-breadcrumb-title-target className="grow">
            <p className="text-3xl font-medium">General</p>
          </div>
          <StoreSummaryCardsSection />
          <StoreDefaultsSection />
          <OrderIdSection />
          <ResourcesSection />
          <OrganizationsSection />
        </div>
      </MainContentLayout>
    </>
  );
}
