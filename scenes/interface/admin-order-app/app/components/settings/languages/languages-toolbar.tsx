import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { LanguagesIcon } from '~/icons/navigation/settings/languages';

export function LanguagesToolbar() {
  useToolbar({
    title: 'Languages',
    icon: <LanguagesIcon />,
  });

  return null;
}
