import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { GrowthIcon } from '~/icons/navigation/growth';

export function GrowthToolbar() {
  useToolbar({
    title: 'Growth',
    icon: <GrowthIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Growth',
        icon: <GrowthIcon />,
        variant: 'title',
      },
    ],
  });

  return null;
}
