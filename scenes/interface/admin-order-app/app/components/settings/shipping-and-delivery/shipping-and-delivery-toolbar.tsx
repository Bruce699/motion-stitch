import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { ShippingAndDeliveryIcon } from '~/icons/navigation/settings/shipping-and-delivery';

export function ShippingAndDeliveryToolbar() {
  useToolbar({
    title: 'Shipping and delivery',
    icon: <ShippingAndDeliveryIcon />,
  });

  return null;
}
