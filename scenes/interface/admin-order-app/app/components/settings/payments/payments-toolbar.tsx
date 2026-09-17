import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { PaymentsIcon } from '~/icons/navigation/settings/payments';

export function PaymentsToolbar() {
  useToolbar({
    title: 'Payments',
    icon: <PaymentsIcon />,
  });

  return null;
}
