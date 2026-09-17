import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { SegmentsIcon } from '~/icons/navigation/segments';

export function CustomerSegmentsToolbar({ hidden }: { hidden?: boolean }) {
  useToolbar({
    title: 'Segments',
    hidden: hidden,
    icon: <SegmentsIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Segments',
        icon: <SegmentsIcon />,
        variant: 'title',
      },
    ],
    actions: [
      {
        type: 'primary',
        icon: 'Plus',
        label: 'Segment',
        onClick: () => {},
      },
    ],
  });

  return null;
}
