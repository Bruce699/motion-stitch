import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { LocationsIcon } from '~/icons/navigation/settings/locations';

export function LocationsToolbar() {
  useToolbar({
    title: 'Locations',
    icon: <LocationsIcon />,
  });

  return null;
}
