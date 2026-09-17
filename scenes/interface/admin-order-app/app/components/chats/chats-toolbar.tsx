import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { ChatsIcon } from '~/icons/navigation/chats';
import { useSidekickThreadStore } from '~/stores/use-sidekick-thread-store';

export function ChatsToolbar({ title }: { title?: string }) {
  const chatTitle = useSidekickThreadStore((state) => state.chatTitle);

  useToolbar({
    title: title ?? chatTitle,
    icon: <ChatsIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: title ?? chatTitle,
        icon: <ChatsIcon />,
        variant: 'title',
      },
    ],
  });

  return null;
}
