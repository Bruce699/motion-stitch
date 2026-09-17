import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { SalesTaxToolbar } from '~/components/payments/sales-tax-toolbar';

export default function SalesTaxPage() {
  return (
    <>
      <SalesTaxToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
