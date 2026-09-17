import { create } from 'zustand';

let routeSyncStarted = false;

function isSettingsPath(pathname: string) {
  return (
    pathname === '/store/settings' || pathname.startsWith('/store/settings/')
  );
}

function getCurrentSettingsPathActive() {
  if (typeof window === 'undefined') return false;
  return isSettingsPath(window.location.pathname);
}

export const useLayoutStore = create<{
  isNavigationPanelExpanded: boolean;
  toggleNavigationPanel: () => void;
  closeNavigationPanel: () => void;
  openNavigationPanel: () => void;

  isSettingsPathActive: boolean;

  isSidekickPanelOpen: boolean;
  toggleSidekickPanel: () => void;
  closeSidekickPanel: () => void;
  openSidekickPanel: () => void;

  isNavHovered: boolean;
  setNavHovered: (hovered: boolean) => void;
  isCollapsedNavigationTooltipOpen: boolean;
  setCollapsedNavigationTooltipOpen: (open: boolean) => void;
  areNavigationTooltipsSuppressed: boolean;
  setNavigationTooltipsSuppressed: (suppressed: boolean) => void;
}>((set) => ({
  isNavigationPanelExpanded: true,
  toggleNavigationPanel: () =>
    set((state) => ({
      isNavigationPanelExpanded: !state.isNavigationPanelExpanded,
    })),
  closeNavigationPanel: () => set({ isNavigationPanelExpanded: false }),
  openNavigationPanel: () => set({ isNavigationPanelExpanded: true }),

  isSettingsPathActive: false,

  isSidekickPanelOpen: false,
  toggleSidekickPanel: () =>
    set((state) => ({ isSidekickPanelOpen: !state.isSidekickPanelOpen })),
  closeSidekickPanel: () => set({ isSidekickPanelOpen: false }),
  openSidekickPanel: () => set({ isSidekickPanelOpen: true }),

  isNavHovered: false,
  setNavHovered: (hovered) => set({ isNavHovered: hovered }),
  isCollapsedNavigationTooltipOpen: false,
  setCollapsedNavigationTooltipOpen: (open) =>
    set({ isCollapsedNavigationTooltipOpen: open }),
  areNavigationTooltipsSuppressed: false,
  setNavigationTooltipsSuppressed: (suppressed) =>
    set({ areNavigationTooltipsSuppressed: suppressed }),
}));

function syncSettingsPathActive() {
  const isSettingsPathActive = getCurrentSettingsPathActive();
  if (useLayoutStore.getState().isSettingsPathActive === isSettingsPathActive) {
    return;
  }
  useLayoutStore.setState({ isSettingsPathActive });
}

function startRouteSync() {
  if (routeSyncStarted || typeof window === 'undefined') return;
  routeSyncStarted = true;

  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = (...args: Parameters<History['pushState']>) => {
    const result = originalPushState(...args);
    syncSettingsPathActive();
    return result;
  };

  window.history.replaceState = (
    ...args: Parameters<History['replaceState']>
  ) => {
    const result = originalReplaceState(...args);
    syncSettingsPathActive();
    return result;
  };

  window.addEventListener('popstate', syncSettingsPathActive);
  syncSettingsPathActive();
}

startRouteSync();
