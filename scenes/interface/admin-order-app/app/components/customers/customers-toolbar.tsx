import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { CustomersIcon } from '~/icons/navigation/customers';

export function CustomersToolbar({ hidden }: { hidden?: boolean }) {
  useToolbar({
    title: 'Customers',
    hidden,
    icon: <CustomersIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Customers',
        icon: <CustomersIcon />,
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
        label: 'Customer',
        onClick: () => {},
      },
    ],
  });

  return null;
}
