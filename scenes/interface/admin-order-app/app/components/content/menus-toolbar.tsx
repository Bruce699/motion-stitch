import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { MenusIcon } from '~/icons/navigation/menus';

export function MenusToolbar() {
  useToolbar({
    title: 'Menus',
    icon: <MenusIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Menus',
        icon: <MenusIcon />,
        variant: 'title',
      },
    ],
    actions: [
      {
        type: 'secondary',
        icon: 'Link',
        label: 'URL redirects',
        onClick: () => {},
      },
      {
        type: 'primary',
        icon: 'Plus',
        label: 'Menu',
        onClick: () => {},
      },
    ],
  });

  return null;
}
