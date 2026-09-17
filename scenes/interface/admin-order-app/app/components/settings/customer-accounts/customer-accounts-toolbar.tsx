import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { CustomerAccountsIcon } from '~/icons/navigation/settings/customer-accounts';

export function CustomerAccountsToolbar() {
  useToolbar({
    title: 'Customer accounts',
    icon: <CustomerAccountsIcon />,
  });

  return null;
}
