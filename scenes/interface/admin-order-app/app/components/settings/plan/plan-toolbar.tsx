import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { PlanIcon } from '~/icons/navigation/settings/plan';

export function PlanToolbar() {
  useToolbar({
    title: 'Plan',
    icon: <PlanIcon />,
  });

  return null;
}
