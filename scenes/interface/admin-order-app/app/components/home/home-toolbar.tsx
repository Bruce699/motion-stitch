import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';

export function HomeToolbar() {
  useToolbar({ title: 'Home', hidden: true });

  return null;
}
