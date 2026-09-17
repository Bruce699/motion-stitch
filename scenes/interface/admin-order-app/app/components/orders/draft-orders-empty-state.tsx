import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';

export function DraftOrdersEmptyState() {
  return (
    <MainContentLayout variant="bleed">
      <UnderConstruction />
    </MainContentLayout>
  );
}
