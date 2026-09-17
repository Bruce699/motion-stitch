import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { PurchaseOrdersToolbar } from '~/components/products/purchase-orders-toolbar';

export default function PurchaseOrdersPage() {
  return (
    <>
      <PurchaseOrdersToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
