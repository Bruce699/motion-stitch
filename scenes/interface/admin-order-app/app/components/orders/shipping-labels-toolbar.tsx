import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { ShippingLabelsIcon } from '~/icons/navigation/shipping-labels';

export function ShippingLabelsToolbar({ hidden }: { hidden?: boolean }) {
  useToolbar({
    title: 'Shipping labels',
    hidden: hidden,
    icon: <ShippingLabelsIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Shipping labels',
        icon: <ShippingLabelsIcon />,
        variant: 'title',
      },
    ],
  });

  return null;
}
