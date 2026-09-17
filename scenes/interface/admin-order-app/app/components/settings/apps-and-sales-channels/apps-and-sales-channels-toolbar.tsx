import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { AppsAndSalesChannelsIcon } from '~/icons/navigation/settings/apps-and-sales-channels';

export function AppsAndSalesChannelsToolbar() {
  useToolbar({
    title: 'Apps and sales channels',
    icon: <AppsAndSalesChannelsIcon />,
  });

  return null;
}
