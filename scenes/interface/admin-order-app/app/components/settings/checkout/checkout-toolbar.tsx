import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { CheckoutIcon } from '~/icons/navigation/settings/checkout';

export function CheckoutToolbar() {
  useToolbar({
    title: 'Checkout',
    icon: <CheckoutIcon />,
  });

  return null;
}
