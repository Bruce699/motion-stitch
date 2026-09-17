import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { AbandonedCheckoutsIcon } from '~/icons/navigation/abandoned-checkouts';

export function AbandonedCheckoutsToolbar({ hidden }: { hidden?: boolean }) {
  useToolbar({
    title: 'Abandoned checkouts',
    hidden: hidden,
    icon: <AbandonedCheckoutsIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Abandoned checkouts',
        icon: <AbandonedCheckoutsIcon />,
        variant: 'title',
      },
    ],
  });

  return null;
}
