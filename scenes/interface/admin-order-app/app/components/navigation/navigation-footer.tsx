import React from 'react';
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import { SettingsIcon } from '../../icons/navigation/settings';
import { NotificationsIcon } from '../../icons/navigation/settings/notifications';
import { useNavigationStore } from '../../stores/use-navigation-store';
import { useSystemAlertsStore } from '~/stores/use-system-alerts-store';
import { motionEasings } from '~/ui/tokens/motion';
import {
  NavigationItem,
  PRIMARY_NAV_SETTINGS_ITEM_SELECTION_LAYOUT_ID,
} from './navigation-accordion';
import { NavigationBanners } from './navigation-banners';
import { NavigationTooltip } from './navigation-tooltip';
import { NavigationUserMenu } from './navigation-user-menu';


export const NavigationFooter = React.memo(function NavigationFooter({
  isNavOpen,
  isSettingsPathActive,
  isSecondaryNavigationActive,
  activePathRef,
  isSharedTooltipOpen,
}: {
  isNavOpen: boolean;
  isSettingsPathActive: boolean;
  isSecondaryNavigationActive: boolean;
  activePathRef: React.RefObject<string>;
  isSharedTooltipOpen: boolean;
}) {
  const setStoredSettingsPath = useNavigationStore(
    (state) => state.setStoredSettingsPath,
  );
  const isPaymentsTestModeEnabled = useSystemAlertsStore(
    (state) => state.paymentsTestMode.enabled,
  );
  const isPayoutsPaused = useSystemAlertsStore(
    (state) => state.payoutsPaused.enabled,
  );
  const hasSystemAlert = isPaymentsTestModeEnabled || isPayoutsPaused;
  const settingsActivePath = isSettingsPathActive
    ? '/store/settings/general'
    : '';

  return (
    <m.footer
      className={clsx(
        'position-sticky inset-x-0 bottom-0 z-1 shrink-0 bg-background pb-4',
        'transition-opacity ease-out group-hover/settings-active:opacity-100 group-hover/settings-active:duration-100',
        isSecondaryNavigationActive && !isSharedTooltipOpen && 'opacity-50',
      )}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.01,
          },
        },
      }}
    >
      <m.div
        variants={{
          hidden: {
            opacity: 0,
            filter: 'blur(2px)',
            y: 60,
          },
          visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
          },
        }}
        transition={{ duration: 0.4, ease: motionEasings.ease }}
      >
        <NavigationTooltip
          disabled={isNavOpen}
          title="Settings"
          content="Settings"
        >
          <NavigationItem
            as="button"
            href="/store/settings/general"
            icon={<SettingsIcon />}
            title="Settings"
            navState={{ panelExpanded: isNavOpen }}
            activePath={settingsActivePath}
            onClick={() => {
              if (!isSettingsPathActive) {
                setStoredSettingsPath(activePathRef.current);
              }
            }}
            selectionLayoutId={PRIMARY_NAV_SETTINGS_ITEM_SELECTION_LAYOUT_ID}
            inactiveHoverBackdrop="before:bg-white/6"
          />
        </NavigationTooltip>
      </m.div>

      <AnimatePresence>
        {!isNavOpen && (
          <m.div
            initial={{ height: 0 }}
            animate={{ height: 'var(--spacing-control)' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.4, ease: motionEasings.ease }}
          >
            <NavigationTooltip
              title="Notifications"
              content="Notifications"
            >
              <button
                type="button"
                aria-label="Notifications"
                className={clsx(
                  'group relative isolate flex h-control w-full shrink-0 items-center gap-2 pl-5.5 whitespace-nowrap text-secondary transition-[color,filter,opacity] duration-800 ease-out group-hover/settings-active:opacity-100 group-hover/settings-active:duration-100',
                  'before:absolute before:inset-x-3.5 before:inset-y-[0.5px] before:z-[-1] before:rounded before:bg-white/6 before:opacity-0 before:transition-opacity before:duration-100 hover:before:opacity-100 data-popup-open:before:opacity-100',
                )}
              >
                <m.span
                  initial={{
                    opacity: 0,
                    scale: 0.75,
                    filter: 'blur(2px)',
                  }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{
                    opacity: 0,
                    scale: 0.75,
                    filter: 'blur(2px)',
                    transition: {
                      duration: 0.4,
                      ease: motionEasings.ease,
                      delay: 0,
                    },
                  }}
                  transition={{
                    duration: 0.4,
                    ease: motionEasings.ease,
                    delay: 0.1,
                  }}
                  className="size-4 shrink-0 text-muted-foreground transition-[color] duration-100 group-hover:text-secondary group-data-[popup-open]:text-secondary"
                >
                  <NotificationsIcon />
                </m.span>
              </button>
            </NavigationTooltip>
          </m.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-1">
        <m.div
          variants={{
            hidden: {
              opacity: 0,
              filter: 'blur(2px)',
              y: 60,
            },
            visible: {
              opacity: 1,
              filter: 'blur(0px)',
              y: 0,
            },
          }}
          transition={{ duration: 0.4, ease: motionEasings.ease }}
          className="flex-1"
        >
          <NavigationTooltip
            disabled={isNavOpen}
            title="MVSE"
            content="MVSE"
          >
            <div className="group/collapsed-navigation-tooltip">
              <NavigationUserMenu isNavOpen={isNavOpen} />
            </div>
          </NavigationTooltip>
        </m.div>
      </div>

      <AnimatePresence initial={false}>
        {hasSystemAlert && (
          <m.div
            initial={{ height: 0, opacity: 0, y: 60, filter: 'blur(2px)' }}
            animate={{ height: 'auto', opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{
              height: 0,
              opacity: 0,
              y: 60,
              filter: 'blur(2px)',
            }}
            transition={{ duration: 0.4, ease: motionEasings.ease }}
          >
            <NavigationBanners
              isNavOpen={isNavOpen}
              isPaymentsTestModeEnabled={isPaymentsTestModeEnabled}
              isPayoutsPaused={isPayoutsPaused}
            />
          </m.div>
        )}
      </AnimatePresence>
    </m.footer>
  );
});
