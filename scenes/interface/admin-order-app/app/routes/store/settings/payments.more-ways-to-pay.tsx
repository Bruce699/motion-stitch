import { MainContentLayout } from '~/components/main-content-layout';
import { MoreWaysToPayMethodsSection } from '~/components/settings/payments/more-ways-to-pay-methods-section';
import { PaymentsMoreWaysToolbar } from '~/components/settings/payments/payments-more-ways-toolbar';

export default function MoreWaysToPayPage() {
  return (
    <>
      <PaymentsMoreWaysToolbar />
      <MainContentLayout>
        <div className="flex flex-col gap-8 pb-16">
          <div data-breadcrumb-title-target className="grow">
            <p className="text-3xl font-medium">More ways to pay</p>
          </div>
          <MoreWaysToPayMethodsSection />
        </div>
      </MainContentLayout>
    </>
  );
}
