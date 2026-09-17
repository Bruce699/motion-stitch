import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { ShippingAndDeliveryToolbar } from '~/components/settings/shipping-and-delivery/shipping-and-delivery-toolbar';

export default function ShippingAndDeliveryPage() {
  return (
    <>
      <ShippingAndDeliveryToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
