import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { TransfersIcon } from '~/icons/navigation/transfers';

export function TransfersToolbar() {
  useToolbar({
    title: 'Transfers',
    icon: <TransfersIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Transfers',
        icon: <TransfersIcon />,
        variant: 'title',
      },
    ],
    actions: [
      {
        type: 'primary',
        icon: 'Plus',
        label: 'Transfer',
        onClick: () => {},
      },
    ],
  });

  return null;
}
