import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { MetaobjectsIcon } from '~/icons/navigation/metaobjects';

export function MetaobjectsToolbar() {
  useToolbar({
    title: 'Metaobjects',
    icon: <MetaobjectsIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Metaobjects',
        icon: <MetaobjectsIcon />,
        variant: 'title',
      },
    ],
    actions: [
      {
        type: 'secondary',
        icon: 'Pen',
        label: 'Manage',
        onClick: () => {},
      },
      {
        type: 'secondary',
        icon: 'Eye',
        label: 'View read only',
        onClick: () => {},
      },
      {
        type: 'primary',
        icon: 'Plus',
        label: 'Definition',
        onClick: () => {},
      },
    ],
  });

  return null;
}
