import React from 'react';
import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { DraftOrdersIcon } from '~/icons/navigation/draft-orders';

export function DraftsToolbar({ hidden }: { hidden?: boolean }) {
  const handleExport = React.useCallback(() => {}, []);
  const handleMore = React.useCallback(() => {}, []);
  const handleAddOrder = React.useCallback(() => {}, []);

  useToolbar({
    title: 'Drafts',
    hidden,
    icon: <DraftOrdersIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Drafts',
        icon: <DraftOrdersIcon />,
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
