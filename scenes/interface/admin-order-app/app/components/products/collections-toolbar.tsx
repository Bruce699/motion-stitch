import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { CollectionsIcon } from '~/icons/navigation/collections';

export function CollectionsToolbar({ hidden }: { hidden?: boolean }) {
  useToolbar({
    title: 'Collections',
    hidden: hidden,
    icon: <CollectionsIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Collections',
        icon: <CollectionsIcon />,
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
          { type: 'secondary', icon: 'Dots', label: 'More', onClick: () => {} },
        ],
      },
      {
        type: 'primary',
        icon: 'Plus',
        label: 'Collection',
        onClick: () => {},
      },
    ],
  });

  return null;
}
