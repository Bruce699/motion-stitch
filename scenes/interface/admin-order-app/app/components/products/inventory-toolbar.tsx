import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { InventoryIcon } from '~/icons/navigation/inventory';

export function InventoryToolbar({ hidden }: { hidden?: boolean }) {
  useToolbar({
    title: 'Inventory',
    hidden: hidden,
    icon: <InventoryIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Inventory',
        icon: <InventoryIcon />,
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
            onClick: () => {},
          },
          { type: 'secondary', icon: 'Dots', label: 'More', onClick: () => {} },
        ],
      },
    ],
  });

  return null;
}
