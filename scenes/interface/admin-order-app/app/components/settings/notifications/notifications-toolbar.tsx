import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { NotificationsIcon } from '~/icons/navigation/settings/notifications';

export function NotificationsToolbar() {
  useToolbar({
    title: 'Notifications',
    icon: <NotificationsIcon />,
  });

  return null;
}
