import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { DomainsIcon } from '~/icons/navigation/settings/domains';

export function DomainsToolbar() {
  useToolbar({
    title: 'Domains',
    icon: <DomainsIcon />,
  });

  return null;
}
