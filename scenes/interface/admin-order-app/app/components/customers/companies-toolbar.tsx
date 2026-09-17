import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { CompaniesIcon } from '~/icons/navigation/companies';

export function CompaniesToolbar({ hidden }: { hidden?: boolean }) {
  useToolbar({
    title: 'Companies',
    hidden: hidden,
    icon: <CompaniesIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Companies',
        icon: <CompaniesIcon />,
        variant: 'title',
      },
    ],
    actions: [
      {
        type: 'primary',
        icon: 'Plus',
        label: 'Company',
        onClick: () => {},
      },
    ],
  });

  return null;
}
