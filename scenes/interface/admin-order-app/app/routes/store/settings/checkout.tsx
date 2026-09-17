import { MainContentLayout } from '../../../components/main-content-layout';
import {
  AdvancedSection,
  ConfigurationsSection,
  CustomerContactSection,
  CustomerInformationSection,
  MarketingOptionsSection,
  ScriptsNotice,
  TippingSection,
} from '~/components/settings/checkout';
import { CheckoutToolbar } from '~/components/settings/checkout/checkout-toolbar';

export default function CheckoutPage() {
  return (
    <>
      <CheckoutToolbar />
      <MainContentLayout>
        <div className="flex flex-col gap-8 pb-16">
          <div data-breadcrumb-title-target className="grow">
            <p className="text-3xl font-medium">Checkout</p>
          </div>
          <ScriptsNotice />
          <ConfigurationsSection />
          <CustomerContactSection />
          <CustomerInformationSection />
          <MarketingOptionsSection />
          <TippingSection />
          <AdvancedSection />
        </div>
      </MainContentLayout>
    </>
  );
}
