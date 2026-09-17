import React from 'react';
import clsx from 'clsx';
import { useLocation, useMatches, useOutlet } from 'react-router';
import { useDelayedSidekickPanelOpen } from '~/hooks/use-delayed-sidekick-panel-open';
import { Toolbar } from '~/components/toolbar/toolbar';
import { useToolbarHidden } from '~/components/toolbar/hooks/use-toolbar';
import { SidekickFloatingInput } from '~/components/sidekick/floating-input/sidekick-floating-input';
import { AnimatePresence, m } from 'motion/react';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';
import { IntentPortalContainer } from '~/ui/components/intent';
import { ProgressiveBlur } from '~/ui/components/progressive-blur/progressive-blur';
import { useMainContentState } from './hooks/use-main-content';
import { useSidekickFloatingInputState } from '~/components/sidekick/floating-input/hooks/use-sidekick-floating-input';

export function MainContent({
  scrollRootRef,
}: {
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
}) {
  const isDelayedSidekickPanelOpen = useDelayedSidekickPanelOpen();
  const isToolbarHidden = useToolbarHidden();
  const { config } = useMainContentState();
  const { config: sidekickFloatingInputConfig } =
    useSidekickFloatingInputState();
  const outlet = useOutlet();
  const { pathname } = useLocation();
  const matches = useMatches();
  const leafRouteId = matches[matches.length - 1]?.id ?? pathname;
  const isHomeRoute = pathname === '/store';

  return (
    <div
      ref={IntentPortalContainer.ref}
      className="relative isolate flex h-full flex-1"
    >
      <m.main
        layoutId="main-content-surface"
        className={clsx(
          'relative isolate flex h-full flex-1 bg-background',
          'origin-top transition-[scale,filter,border-radius] delay-100 ease-out will-change-transform',
          'has-[~_.intent-portal_[data-ending-style]]:delay-100 has-[~_.intent-portal_[data-open]]:scale-97',
          'rounded-3xl',
        )}
        initial={false}
        transition={{
          duration: motionDurations.slower,
          ease: motionEasings.ease,
        }}
      >
        <div
          ref={scrollRootRef}
          className="flex size-full flex-col overflow-x-clip overflow-y-auto"
        >
          <Toolbar />

          <AnimatePresence
            mode="wait"
            initial={false}
            onExitComplete={() => {
              scrollRootRef.current?.scrollTo({ top: 0, left: 0 });
            }}
          >
            {outlet ? (
              <m.div
                key={leafRouteId}
                className="@container isolate flex flex-1 flex-col"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: motionDurations.base,
                  ease: motionEasings.easeOut,
                }}
              >
                {outlet}
              </m.div>
            ) : null}
          </AnimatePresence>
        </div>

        <ProgressiveBlur
          side="top"
          className={clsx(
            'h-13.5 rounded-t-3xl',
            (isToolbarHidden || !config.showTopScrim) && 'opacity-0',
          )}
        />

        <ProgressiveBlur
          side="bottom"
          className={clsx(
            'h-24 rounded-b-3xl',
            (isDelayedSidekickPanelOpen || !config.showBottomScrim) &&
              'opacity-0',
          )}
        />
      </m.main>

      <SidekickFloatingInput
        chatThreadId={sidekickFloatingInputConfig.chatThreadId}
        isVisible={!isHomeRoute}
        inputOnly={sidekickFloatingInputConfig.inputOnly}
      />
    </div>
  );
}
