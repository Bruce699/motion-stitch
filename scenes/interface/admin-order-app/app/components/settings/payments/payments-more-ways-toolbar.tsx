import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { SettingsIcon } from '~/icons/navigation/settings';

export function PaymentsMoreWaysToolbar() {
  useToolbar({
    title: 'More ways to pay',
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
  });

  return null;
}
