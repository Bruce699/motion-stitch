import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { OnlineStoreIcon } from '~/icons/navigation/online-store';

export function OnlineStoreToolbar() {
  useToolbar({
    title: 'Online Store',
    icon: <OnlineStoreIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Online Store',
        icon: <OnlineStoreIcon />,
        variant: 'title',
      },
    ],
  });

  return null;
}
