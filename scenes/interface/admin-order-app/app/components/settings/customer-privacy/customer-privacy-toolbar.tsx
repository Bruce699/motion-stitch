import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { CustomerPrivacyIcon } from '~/icons/navigation/settings/customer-privacy';

export function CustomerPrivacyToolbar() {
  useToolbar({
    title: 'Customer privacy',
    icon: <CustomerPrivacyIcon />,
  });

  return null;
}
