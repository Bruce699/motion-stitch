import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { SalesTaxIcon } from '~/icons/navigation/sales-tax';

export function SalesTaxToolbar() {
  useToolbar({
    title: 'Sales tax',
    icon: <SalesTaxIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Sales tax',
        icon: <SalesTaxIcon />,
        variant: 'title',
      },
    ],
  });

  return null;
}
