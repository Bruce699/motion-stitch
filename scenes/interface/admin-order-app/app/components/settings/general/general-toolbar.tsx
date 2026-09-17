import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { GeneralIcon } from '~/icons/navigation/settings/general';

export function GeneralToolbar() {
  useToolbar({
    title: 'General',
    icon: <GeneralIcon />,
  });

  return null;
}
