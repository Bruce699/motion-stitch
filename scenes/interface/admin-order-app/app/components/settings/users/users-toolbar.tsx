import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { UsersIcon } from '~/icons/navigation/settings/users';

export function UsersToolbar() {
  useToolbar({
    title: 'Users',
    icon: <UsersIcon />,
    actions: [
      {
        type: 'group',
        actions: [
          {
            type: 'secondary',
            icon: 'Import',
            label: 'Import',
          },
          {
            type: 'secondary',
            icon: 'Export',
            label: 'Export',
          },
        ],
      },
      {
        type: 'primary',
        icon: 'Plus',
        label: 'User',
      },
    ],
  });

  return null;
}
