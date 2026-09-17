import { ProgressiveBlur } from '~/ui/components/progressive-blur/progressive-blur';
import { ToolbarButton } from '../toolbar/toolbar-button';
import { ToolbarGroup } from '../toolbar/toolbar-group';
import { ChatsIcon } from '~/icons/navigation/chats';
import { BottomBar } from '~/icons/sidekick/bottom-bar';
import { SidebarIcon } from '~/icons/sidekick/sidebar';
import type { ToolbarButtonAction } from '../toolbar/toolbar.types';

export function SidekickToolbar({
  title,
  onCompose,
  onOpenFullpage,
  onOpenSidebar,
  onOpenFloatingInput,
  showFullpageButton = false,
  onClose,
}: {
  title: string;
  onCompose: () => void;
  onOpenFullpage?: () => void;
  onOpenSidebar?: () => void;
  onOpenFloatingInput?: () => void;
  showFullpageButton?: boolean;
  onClose: () => void;
}) {
  let destinationAction: ToolbarButtonAction | undefined;

  if (showFullpageButton && onOpenFullpage) {
    destinationAction = {
      id: 'destination',
      type: 'secondary',
      icon: 'Expand',
      iconOnly: true,
      label: 'Fullscreen',
      onClick: onOpenFullpage,
    };
  } else if (onOpenSidebar) {
    destinationAction = {
      id: 'destination',
      type: 'secondary',
      iconNode: <SidebarIcon />,
      iconOnly: true,
      label: 'Open sidebar',
      onClick: onOpenSidebar,
    };
  } else if (onOpenFloatingInput) {
    destinationAction = {
      id: 'destination',
      type: 'secondary',
      iconNode: <BottomBar />,
      iconOnly: true,
      label: 'Open floating input',
      onClick: onOpenFloatingInput,
    };
  }

  const actions: ToolbarButtonAction[] = [
    ...(destinationAction ? [destinationAction] : []),
    {
      id: 'close',
      type: 'secondary',
      icon: 'Xmark',
      iconOnly: true,
      label: 'Close',
      onClick: onClose,
    },
  ];

  return (
    <header className="sticky top-0 isolate z-5 flex h-(--toolbar-height) shrink-0 items-center justify-between gap-3 py-3 pr-3 pl-4">
      <ProgressiveBlur side="top" className="h-full rounded-t-5xl" />
      <div
        className="absolute top-0 -bottom-3 left-0 w-full rounded-t-5xl"
        style={{
          background: `linear-gradient(
          to bottom,
          hsl(0, 0%, 100%) 0%,
          hsla(0, 0%, 100%, 0.987) 8.1%,
          hsla(0, 0%, 100%, 0.951) 15.5%,
          hsla(0, 0%, 100%, 0.896) 22.5%,
          hsla(0, 0%, 100%, 0.825) 29%,
          hsla(0, 0%, 100%, 0.741) 35.3%,
          hsla(0, 0%, 100%, 0.648) 41.2%,
          hsla(0, 0%, 100%, 0.55) 47.1%,
          hsla(0, 0%, 100%, 0.45) 52.9%,
          hsla(0, 0%, 100%, 0.352) 58.8%,
          hsla(0, 0%, 100%, 0.259) 64.7%,
          hsla(0, 0%, 100%, 0.175) 71%,
          hsla(0, 0%, 100%, 0.104) 77.5%,
          hsla(0, 0%, 100%, 0.049) 84.5%,
          hsla(0, 0%, 100%, 0.013) 91.9%,
          hsla(0, 0%, 100%, 0) 100%
        )`,
        }}
      />

      <span className="relative z-1 flex min-w-0 items-center gap-2 text-base font-medium text-primary">
        <ChatsIcon />
        <span className="truncate">{title}</span>
      </span>
      <div className="relative z-1 flex items-center gap-1.5">
        <ToolbarButton
          action={{
            type: 'secondary',
            icon: 'Compose',
            iconOnly: true,
            label: 'New thread',
            onClick: onCompose,
          }}
        />

        <ToolbarGroup actions={actions} />
      </div>
    </header>
  );
}
