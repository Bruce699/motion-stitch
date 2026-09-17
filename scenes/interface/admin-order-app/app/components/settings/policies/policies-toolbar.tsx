import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { PoliciesIcon } from '~/icons/navigation/settings/policies';

export function PoliciesToolbar() {
  useToolbar({
    title: 'Policies',
    icon: <PoliciesIcon />,
  });

  return null;
}
