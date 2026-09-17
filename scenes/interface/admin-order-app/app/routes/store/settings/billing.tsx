import { MainContentLayout } from '~/components/main-content-layout';
import { BillingProfileSection } from '~/components/settings/billing/billing-profile-section';
import { BillingToolbar } from '~/components/settings/billing/billing-toolbar';
import { PastBillsSection } from '~/components/settings/billing/past-bills-section';
import { UpcomingBillSection } from '~/components/settings/billing/upcoming-bill-section';

export default function BillingPage() {
  return (
    <>
      <BillingToolbar />
      <MainContentLayout>
        <div className="flex flex-col gap-8">
          <div data-breadcrumb-title-target>
            <p className="text-3xl font-medium">Billing</p>
          </div>
          <UpcomingBillSection />
          <PastBillsSection />
          <BillingProfileSection />
        </div>
      </MainContentLayout>
    </>
  );
}
