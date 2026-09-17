import './App.css';
import React from 'react';
import { useHotkey } from './hooks/use-hotkey';
import { useChatsReturnPath } from './hooks/use-chats-return-path';

import { PrimaryNavigation } from './components/navigation/primary-navigation';
import { ChatsNavigation } from './components/navigation/chats-navigation';
import { SettingsNavigation } from './components/navigation/settings-navigation';
import { MainContent } from './components/main-content/main-content';
import { SidekickPanel } from './components/sidekick/sidekick-panel';
import { ViewAsToolbar } from './components/view-as-toolbar';
import { SearchDialog } from './components/search/search-dialog';
import { useLayoutStore } from './stores/use-layout-store';
import { useSearchStore } from './stores/use-search-store';

export default function AppShell() {
  const scrollRootRef = React.useRef<HTMLDivElement>(null);
  const openNavigationPanel = useLayoutStore(
    (state) => state.openNavigationPanel,
  );
  const closeNavigationPanel = useLayoutStore(
    (state) => state.closeNavigationPanel,
  );

  const toggleSidekickPanel = useLayoutStore(
    (state) => state.toggleSidekickPanel,
  );
  const toggleSearch = useSearchStore((state) => state.toggleSearch);

  useChatsReturnPath();

  useHotkey('meta+period', () => {
    toggleSidekickPanel();
  });

  useHotkey('meta+k', () => {
    toggleSearch();
  });

  const NAV_COLLAPSE_BREAKPOINT = 800;

  React.useEffect(() => {
    const sync = () => {
      if (window.innerWidth < NAV_COLLAPSE_BREAKPOINT) {
        closeNavigationPanel();
      } else {
        openNavigationPanel();
      }
    };

    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [openNavigationPanel, closeNavigationPanel]);

  return (
    <>
      <PrimaryNavigation />
      <SearchDialog />

      <div className="relative flex h-full flex-1 flex-col">
        <ViewAsToolbar />

        <div className="relative isolate flex flex-1">
          <SettingsNavigation />
          <ChatsNavigation />

          <MainContent scrollRootRef={scrollRootRef} />

          <SidekickPanel />
        </div>

        {/* Lower control bar container placeholder */}
        <div className="h-1"></div>
      </div>
    </>
  );
}
