import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { useViewAsStore } from '~/stores/use-view-as-store';
import { ProductsIcon } from '~/icons/navigation/products';

export function ProductsToolbar({ hasProducts }: { hasProducts: boolean }) {
  const toggleViewAsMode = useViewAsStore((state) => state.toggleViewAsMode);

  useToolbar({
    title: 'Products',
    hidden: !hasProducts,
    icon: <ProductsIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Products',
        icon: <ProductsIcon />,
        variant: 'title',
      },
    ],
    actions: hasProducts
      ? [
          {
            type: 'group',
            actions: [
              {
                type: 'secondary',
                icon: 'Export',
                label: 'Export',
                onClick: () => {},
              },
              {
                type: 'secondary',
                icon: 'Import',
                label: 'Import',
                onClick: () => {},
              },
              {
                type: 'secondary',
                icon: 'Dots',
                label: 'More',
                onClick: () => {},
              },
            ],
          },
          {
            type: 'secondary',
            icon: 'Eye',
            label: 'View as',
            onClick: toggleViewAsMode,
          },
          {
            type: 'primary',
            icon: 'Plus',
            label: 'Product',
            onClick: () => {},
          },
        ]
      : undefined,
  });

  return null;
}
