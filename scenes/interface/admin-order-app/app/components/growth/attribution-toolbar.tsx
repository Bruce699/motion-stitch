import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { AttributionIcon } from '~/icons/navigation/attribution';

export function AttributionToolbar() {
  useToolbar({
    title: 'Attribution',
    icon: <AttributionIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Attribution',
        icon: <AttributionIcon />,
        variant: 'title',
      },
    ],
    actions: [
      {
        type: 'secondary',
        icon: 'Calendar',
        label: 'Last 30 days',
      },
      {
        type: 'secondary',
        label: 'Daily',
      },
      {
        type: 'group',
        actions: [
          {
            type: 'secondary',
            icon: 'Export',
            label: 'Export',
            onClick: () => {},
          },
          {
            type: 'secondary',
            icon: 'Print',
            label: 'Print',
            onClick: () => {},
          },
          {
            type: 'secondary',
            icon: 'Dots',
            label: 'More',
            onClick: () => {},
          },
        ],
      },
    ],
  });

  return null;
}
