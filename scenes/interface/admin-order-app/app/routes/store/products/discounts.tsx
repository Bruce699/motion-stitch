import { DiscountsTable } from '~/components/discounts/discounts-table';
import { MainContentLayout } from '../../../components/main-content-layout';
import { DiscountsToolbar } from '~/components/discounts/discounts-toolbar';
import { DiscountsEmptyState } from '~/components/discounts/discounts-empty-state';
import { useDiscountsData } from '~/data/discounts';

export default function DiscountsPage() {
  const discountsData = useDiscountsData();
  const hasDiscounts = discountsData.length > 0;

  return (
    <>
      <DiscountsToolbar hidden={!hasDiscounts} />
      {hasDiscounts ? (
        <MainContentLayout variant="fullWidth">
          <DiscountsTable />
        </MainContentLayout>
      ) : (
        <DiscountsEmptyState />
      )}
    </>
  );
}
