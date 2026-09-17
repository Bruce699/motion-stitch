import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { PaymentsToolbar } from '~/components/payments/payments-toolbar';

export default function PaymentsPage() {
  return (
    <>
      <PaymentsToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
