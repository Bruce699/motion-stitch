import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { ReportsIcon } from '~/icons/navigation/reports';

export function ReportsToolbar() {
  useToolbar({
    title: 'Reports',
    icon: <ReportsIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Reports',
        icon: <ReportsIcon />,
        variant: 'title',
      },
    ],
    actions: [
      {
        type: 'primary',
        icon: 'Plus',
        label: 'Exploration',
        onClick: () => {},
      },
    ],
  });

  return null;
}
