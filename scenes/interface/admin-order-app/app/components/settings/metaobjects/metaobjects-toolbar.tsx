import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { MetaobjectsIcon } from '~/icons/navigation/settings/metaobjects';

export function SettingsMetaobjectsToolbar() {
  useToolbar({
    title: 'Metaobjects',
    icon: <MetaobjectsIcon />,
  });

  return null;
}
