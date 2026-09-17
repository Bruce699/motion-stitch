import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';

export function OrdersEmptyState() {
  return (
    <MainContentLayout variant="bleed">
      <UnderConstruction />
    </MainContentLayout>
  );
}
