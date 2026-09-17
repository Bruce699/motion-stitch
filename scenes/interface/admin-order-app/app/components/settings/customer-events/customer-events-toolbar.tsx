import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { CustomerEventsIcon } from '~/icons/navigation/settings/customer-events';

export function CustomerEventsToolbar() {
  useToolbar({
    title: 'Customer events',
    icon: <CustomerEventsIcon />,
  });

  return null;
}
