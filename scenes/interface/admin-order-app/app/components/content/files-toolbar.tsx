import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { FilesIcon } from '~/icons/navigation/files';

export function FilesToolbar() {
  useToolbar({
    title: 'Files',
    icon: <FilesIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Files',
        icon: <FilesIcon />,
        variant: 'title',
      },
    ],
    actions: [
      {
        type: 'primary',
        icon: 'Plus',
        label: 'File',
        onClick: () => {},
      },
    ],
  });

  return null;
}
