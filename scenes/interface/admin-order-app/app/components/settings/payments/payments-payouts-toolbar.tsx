import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { SettingsIcon } from '~/icons/navigation/settings';

export function PaymentsPayoutsToolbar() {
  useToolbar({
    title: 'Payouts',
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        url: '/store/settings',
        label: 'Settings',
        icon: <SettingsIcon />,
        hideLabel: true,
      },
      {
        url: '/store/settings/payments',
        label: 'Payments',
      },
    ],
    actions: [
      {
        type: 'secondary',
        label: 'View payouts',
        onClick: () => {},
      },
    ],
  });

  return null;
}
