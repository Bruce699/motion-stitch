import React from 'react';
import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { DiscountsIcon } from '~/icons/navigation/discounts';

export function DiscountsToolbar({ hidden }: { hidden?: boolean }) {
  const handleExport = React.useCallback(() => {}, []);
  const handleMore = React.useCallback(() => {}, []);
  const handleAddDiscount = React.useCallback(() => {}, []);

  useToolbar({
    title: 'Discounts',
    hidden: hidden,
    icon: <DiscountsIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Discounts',
        icon: <DiscountsIcon />,
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
        label: 'Discount',
        onClick: handleAddDiscount,
      },
    ],
  });

  return null;
}
