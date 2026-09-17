import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { BillingIcon } from '~/icons/navigation/settings/billing';

export function BillingToolbar() {
  useToolbar({
    title: 'Billing',
    icon: <BillingIcon />,
  });

  return null;
}
