import React from 'react';
import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { DiscountsIcon } from '~/icons/navigation/discounts';

export function DiscountToolbar({
  discountId,
  title,
  hasChanges,
  onSave,
  onDiscard,
}: {
  discountId: string;
  title: string;
  hasChanges: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const handleDuplicate = React.useCallback(() => {}, []);
  const handleDelete = React.useCallback(() => {}, []);
  const handleMore = React.useCallback(() => {}, []);
  const handlePromote = React.useCallback(() => {}, []);

  useToolbar({
    title,
    breadcrumbs: [
      {
        variant: 'button',
        url: '/store/products/discounts',
        label: 'Discounts',
        icon: <DiscountsIcon />,
      },
    ],
    actions: [
      {
        type: 'group',
        actions: [
          {
            type: 'secondary',
            icon: 'Duplicate',
            label: 'Duplicate',
            onClick: handleDuplicate,
          },
          {
            type: 'secondary',
            icon: 'Trash',
            label: 'Delete',
            onClick: handleDelete,
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
        type: 'secondary',
        icon: 'Megaphone',
        label: 'Promote',
        onClick: handlePromote,
      },
    ],
    resource: {
      type: 'discount',
      id: discountId,
      hasChanges,
      onSave,
      onDiscard,
    },
  });

  return null;
}
