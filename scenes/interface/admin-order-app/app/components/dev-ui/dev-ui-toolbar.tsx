import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { DevUiIcon } from '~/icons/navigation/dev-ui';

export function DevUiToolbar() {
  useToolbar({
    title: 'Dev UI',
    icon: <DevUiIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Dev UI',
        icon: <DevUiIcon />,
        variant: 'title',
      },
    ],
  });

  return null;
}
