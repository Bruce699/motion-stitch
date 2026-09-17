import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { PurchaseOrdersIcon } from '~/icons/navigation/purchase-orders';

export function PurchaseOrdersToolbar() {
  useToolbar({
    title: 'Purchase orders',
    icon: <PurchaseOrdersIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Purchase orders',
        icon: <PurchaseOrdersIcon />,
        variant: 'title',
      },
    ],
  });

  return null;
}
