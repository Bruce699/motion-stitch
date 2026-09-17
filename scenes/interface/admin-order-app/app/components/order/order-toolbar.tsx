import React from 'react';
import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { orders } from '~/data/orders';
import { OrdersIcon } from '~/icons/navigation/orders';

export function OrderToolbar({
  orderId,
  title,
}: {
  orderId: string;
  title: string;
}) {
  const currentOrderIndex = React.useMemo(
    () => orders.findIndex((item) => item.id === orderId),
    [orderId],
  );
  const previousOrder = orders[currentOrderIndex - 1];
  const nextOrder = orders[currentOrderIndex + 1];

  useToolbar({
    title,
    breadcrumbs: [
      {
        variant: 'button',
        url: '/store/orders',
        label: 'Orders',
        icon: <OrdersIcon />,
      },
    ],
    actions: [
      {
        type: 'group',
        actions: [
          {
            type: 'secondary',
            icon: 'Print',
            label: 'Print',
            onClick: () => {},
          },
          { type: 'secondary', icon: 'Pen', label: 'Edit', onClick: () => {} },
          { type: 'secondary', icon: 'Dots', label: 'More', onClick: () => {} },
        ],
      },
      {
        type: 'previousNext',
        previous: {
          label: 'Previous order',
          url: previousOrder ? `/store/orders/${previousOrder.id}` : undefined,
        },
        next: {
          label: 'Next order',
          url: nextOrder ? `/store/orders/${nextOrder.id}` : undefined,
        },
      },
    ],
  });

  return null;
}
