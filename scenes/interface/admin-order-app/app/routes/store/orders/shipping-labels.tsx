import { MainContentLayout } from '../../../components/main-content-layout';
import { ShippingLabelsEmptyState } from '~/components/orders/shipping-labels-empty-state';
import { ShippingLabelsTable } from '~/components/orders/shipping-labels-table';
import { ShippingLabelsToolbar } from '~/components/orders/shipping-labels-toolbar';
import { useShippingLabelsData } from '~/data/shipping-labels';

export default function ShippingLabelsPage() {
  const shippingLabelsData = useShippingLabelsData();
  const hasShippingLabels = shippingLabelsData.length > 0;

  return (
    <>
      <ShippingLabelsToolbar hidden={!hasShippingLabels} />
      {hasShippingLabels ? (
        <MainContentLayout variant="fullWidth">
          <ShippingLabelsTable />
        </MainContentLayout>
      ) : (
        <ShippingLabelsEmptyState />
      )}
    </>
  );
}
