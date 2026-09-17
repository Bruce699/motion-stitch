import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { OrdersIcon } from '~/icons/navigation/orders';

export function CreateShippingLabelToolbar({
  orderId,
  title,
}: {
  orderId: string;
  title: string;
}) {
  useToolbar({
    title: 'Create shipping label',
    breadcrumbs: [
      {
        url: '/store/orders',
        label: 'Orders',
        hideLabel: true,
        icon: <OrdersIcon />,
      },
      {
        url: `/store/orders/${orderId}`,
        label: title,
      },
    ],
    actions: [
      {
        type: 'secondary',
        label: 'Print packing slip',
        onClick: () => {},
      },
    ],
  });

  return null;
}
