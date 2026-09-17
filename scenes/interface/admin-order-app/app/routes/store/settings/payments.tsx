import { MainContentLayout } from '~/components/main-content-layout';
import { ManualPaymentMethodsSection } from '~/components/settings/payments/manual-payment-methods-section';
import { MoreWaysToPaySection } from '~/components/settings/payments/more-ways-to-pay-section';
import { OtherPaymentSettingsSection } from '~/components/settings/payments/other-payment-settings-section';
import { ShopifyPaymentsSection } from '~/components/settings/payments/shopify-payments-section';
import { PaymentsToolbar } from '~/components/settings/payments/payments-toolbar';

export default function PaymentsPage() {
  return (
    <>
      <PaymentsToolbar />
      <MainContentLayout>
        <div className="flex flex-col gap-8 pb-16">
          <div data-breadcrumb-title-target className="grow">
            <p className="text-3xl font-medium">Payments</p>
          </div>
          <ShopifyPaymentsSection />
          <MoreWaysToPaySection />
          <ManualPaymentMethodsSection />
          <OtherPaymentSettingsSection />
        </div>
      </MainContentLayout>
    </>
  );
}
