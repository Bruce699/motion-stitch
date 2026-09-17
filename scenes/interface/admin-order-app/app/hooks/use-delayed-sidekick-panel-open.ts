import React from 'react';
import { useLayoutStore } from '~/stores/use-layout-store';
import { motionDurations } from '~/ui/tokens/motion';

const sidekickPanelOpenDelayMs = motionDurations.slower * 1000;

export function useDelayedSidekickPanelOpen() {
  const isSidekickPanelOpen = useLayoutStore(
    (state) => state.isSidekickPanelOpen,
  );
  const [isDelayedSidekickPanelOpen, setIsDelayedSidekickPanelOpen] =
    React.useState(isSidekickPanelOpen);

  React.useEffect(() => {
    if (!isSidekickPanelOpen) {
      setIsDelayedSidekickPanelOpen(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsDelayedSidekickPanelOpen(true);
    }, sidekickPanelOpenDelayMs);

    return () => window.clearTimeout(timeout);
  }, [isSidekickPanelOpen]);

  return isDelayedSidekickPanelOpen;
}
