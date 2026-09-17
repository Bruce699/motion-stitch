import React from 'react';
import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { OrdersIcon } from '~/icons/navigation/orders';

export function OrdersToolbar({ hidden }: { hidden?: boolean }) {
  const handleExport = React.useCallback(() => {}, []);
  const handleMore = React.useCallback(() => {}, []);
  const handleAddOrder = React.useCallback(() => {}, []);

  useToolbar({
    title: 'Orders',
    hidden,
    icon: <OrdersIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Orders',
        icon: <OrdersIcon />,
        variant: 'title',
      },
    ],
    actions: [
      {
        type: 'group',
        actions: [
          {
            type: 'secondary',
            icon: 'Export',
            label: 'Export',
            onClick: handleExport,
          },
          {
            type: 'secondary',
            icon: 'Dots',
            label: 'More',
            onClick: handleMore,
          },
        ],
      },
      {
        type: 'primary',
        icon: 'Plus',
        label: 'Order',
        onClick: handleAddOrder,
      },
    ],
  });

  return null;
}
