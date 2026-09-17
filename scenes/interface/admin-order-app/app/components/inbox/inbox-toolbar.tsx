import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { InboxIcon } from '~/icons/navigation/inbox';

export function InboxToolbar() {
  useToolbar({
    title: 'Inbox',
    icon: <InboxIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Inbox',
        icon: <InboxIcon />,
        variant: 'title',
      },
    ],
  });

  return null;
}
