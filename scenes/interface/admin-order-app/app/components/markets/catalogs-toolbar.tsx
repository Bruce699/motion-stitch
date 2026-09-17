import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { CatalogsIcon } from '~/icons/navigation/catalogs';

export function CatalogsToolbar() {
  useToolbar({
    title: 'Catalogs',
    icon: <CatalogsIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Catalogs',
        icon: <CatalogsIcon />,
        variant: 'title',
      },
    ],
    actions: [
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
            icon: 'Import',
            label: 'Import',
            onClick: () => {},
          },
        ],
      },
      {
        type: 'primary',
        icon: 'Plus',
        label: 'Catalog',
        onClick: () => {},
      },
    ],
  });

  return null;
}
