import React from 'react';
import { motionEasings } from '~/ui/tokens/motion';
import { useLayoutStore } from '../../stores/use-layout-store';
import { m } from 'motion/react';
import { useHotkey } from '../../hooks/use-hotkey';
import clsx from 'clsx';
import { useSearchStore } from '../../stores/use-search-store';
import { useLocation } from 'react-router';
import { NavigationContent } from './navigation-content';
import { NavigationFooter } from './navigation-footer';
import { NavigationHeader } from './navigation-header';


function useIsXlScreen() {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      const mediaQueryList = window.matchMedia('(min-width: 96rem)');
      mediaQueryList.addEventListener('change', onStoreChange);
      return () => mediaQueryList.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia('(min-width: 96rem)').matches,
    () => false,
  );
}

function sidekickCollapseDelayReducer(_isDelayed: boolean, isDelayed: boolean) {
  return isDelayed;
}

export function PrimaryNavigation() {
  const isNavigationPanelExpanded = useLayoutStore(
    (state) => state.isNavigationPanelExpanded,
  );
  const isSidekickPanelOpen = useLayoutStore(
    (state) => state.isSidekickPanelOpen,
  );
  const toggleNavigationPanel = useLayoutStore(
    (state) => state.toggleNavigationPanel,
  );
  const openNavigationPanel = useLayoutStore(
    (state) => state.openNavigationPanel,
  );
  const setNavigationTooltipsSuppressed = useLayoutStore(
    (state) => state.setNavigationTooltipsSuppressed,
  );
  const [isSidekickCollapseDelayed, dispatchSidekickCollapseDelay] =
    React.useReducer(sidekickCollapseDelayReducer, false);
  const { pathname: activePath } = useLocation();
  const activePathRef = React.useRef(activePath);
  activePathRef.current = activePath;
  const isSettingsPathActive =
    activePath === '/store/settings' ||
    activePath.startsWith('/store/settings/');
  const isChatsPathActive =
    activePath === '/store/chats' || activePath.startsWith('/store/chats/');
  const isSecondaryNavigationActive = isSettingsPathActive || isChatsPathActive;
  const isXlScreen = useIsXlScreen();
  const shouldCollapseNav = isSidekickPanelOpen && !isXlScreen;
  const isNavOpen =
    isNavigationPanelExpanded &&
    !isSecondaryNavigationActive &&
    !shouldCollapseNav;
  const isSidekickCollapsingNav =
    isNavigationPanelExpanded &&
    !isSecondaryNavigationActive &&
    shouldCollapseNav;
  const isNavHovered = useLayoutStore((state) => state.isNavHovered);
  const setNavHovered = useLayoutStore((state) => state.setNavHovered);
  const isCollapsedNavigationTooltipOpen = useLayoutStore(
    (state) => state.isCollapsedNavigationTooltipOpen,
  );
  const renderedNavOpen = isNavOpen || isSidekickCollapseDelayed;
  const openSearch = useSearchStore((state) => state.openSearch);
  const isSharedTooltipOpen = false;
  const isCollapsedNavigationInteracted =
    isNavHovered || isCollapsedNavigationTooltipOpen;
  const navigationHeaderMode = renderedNavOpen
    ? 'expanded'
    : isCollapsedNavigationInteracted
      ? 'collapsed-hovered'
      : 'collapsed';
  const navigationHeaderCollapsedActionTone =
    isSecondaryNavigationActive && !isSharedTooltipOpen ? 'muted' : 'default';

  const handleNavigationPanelToggle = React.useCallback(() => {
    setNavHovered(false);
    toggleNavigationPanel();
  }, [setNavHovered, toggleNavigationPanel]);

  React.useEffect(() => {
    if (!isSidekickCollapsingNav) {
      dispatchSidekickCollapseDelay(false);
      return;
    }

    dispatchSidekickCollapseDelay(true);
    const timeout = window.setTimeout(() => {
      dispatchSidekickCollapseDelay(false);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [isSidekickCollapsingNav]);

  useHotkey('meta+b', handleNavigationPanelToggle, [
    handleNavigationPanelToggle,
  ]);

  return (
    <m.aside
      className={clsx(
        'dark z-1 flex h-full flex-col',
        (isSecondaryNavigationActive || isSharedTooltipOpen) &&
          'group/settings-active',
      )}
      data-tauri-drag-region
      data-primary-navigation
      initial={false}
      onMouseEnter={() => setNavHovered(true)}
      onMouseLeave={() => {
        if (!isCollapsedNavigationTooltipOpen) {
          setNavHovered(false);
        }
      }}
      onAnimationStart={() => setNavigationTooltipsSuppressed(true)}
      onAnimationComplete={() => setNavigationTooltipsSuppressed(false)}
      animate={{
        width: renderedNavOpen
          ? 'calc(var(--spacing) * 55)'
          : 'calc(var(--spacing) * 15)',
      }}
      transition={{ duration: 0.4, ease: motionEasings.ease }}
    >
      <NavigationHeader
        mode={navigationHeaderMode}
        collapsedActionTone={navigationHeaderCollapsedActionTone}
        isSecondaryNavigationActive={isSecondaryNavigationActive}
        onSearch={openSearch}
        onNavToggle={handleNavigationPanelToggle}
      />

      <NavigationContent
        activePath={activePath}
        isNavOpen={renderedNavOpen}
        isSecondaryNavigationActive={isSecondaryNavigationActive}
        isSharedTooltipOpen={isSharedTooltipOpen}
        onCollapsedEmptySpaceClick={openNavigationPanel}
      />

      <NavigationFooter
        isNavOpen={renderedNavOpen}
        isSettingsPathActive={isSettingsPathActive}
        isSecondaryNavigationActive={isSecondaryNavigationActive}
        activePathRef={activePathRef}
        isSharedTooltipOpen={isSharedTooltipOpen}
      />
    </m.aside>
  );
}
