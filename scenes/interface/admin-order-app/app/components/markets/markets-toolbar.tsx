import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { MarketsIcon } from '~/icons/navigation/markets';

export function MarketsToolbar() {
  useToolbar({
    title: 'Markets',
    icon: <MarketsIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Markets',
        icon: <MarketsIcon />,
        variant: 'title',
      },
    ],
    actions: [
      {
        type: 'secondary',
        icon: 'DependencyLink',
        label: 'Graph view',
        onClick: () => {},
      },
      {
        type: 'primary',
        icon: 'Plus',
        label: 'Create market',
        onClick: () => {},
      },
    ],
  });

  return null;
}
