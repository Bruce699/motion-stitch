import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { LiveViewIcon } from '~/icons/navigation/live-view';

export function LiveViewToolbar() {
  useToolbar({
    title: 'Live view',
    icon: <LiveViewIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Live view',
        icon: <LiveViewIcon />,
        variant: 'title',
      },
    ],
  });

  return null;
}
