import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { ContentIcon } from '~/icons/navigation/content';

export function ContentToolbar() {
  useToolbar({
    title: 'Content',
    icon: <ContentIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Content',
        icon: <ContentIcon />,
        variant: 'title',
      },
    ],
  });

  return null;
}
