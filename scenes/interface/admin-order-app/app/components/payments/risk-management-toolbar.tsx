import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { RiskManagementIcon } from '~/icons/navigation/risk-management';

export function RiskManagementToolbar() {
  useToolbar({
    title: 'Risk management',
    icon: <RiskManagementIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Risk management',
        icon: <RiskManagementIcon />,
        variant: 'title',
      },
    ],
  });

  return null;
}
