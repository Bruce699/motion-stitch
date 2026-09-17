import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import { Button } from '~/ui/components/button/button';
import { Icon } from '~/ui/components/icon/icon';
import { Shortcut } from '~/ui/components/shortcut/shortcut';
import * as Tooltip from '~/ui/components/tooltip/tooltip';
import { SearchIcon } from '../../icons/navigation/search';
import { ShopifyLogo } from '~/ui/components/shopify-logo/shopify-logo';
import { useLayoutStore } from '~/stores/use-layout-store';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';
import { NavigationTooltip } from './navigation-tooltip';


export function NavigationHeader({
  mode,
  collapsedActionTone,
  isSecondaryNavigationActive,
  onSearch,
  onNavToggle,
}: {
  mode: 'expanded' | 'collapsed' | 'collapsed-hovered';
  collapsedActionTone: 'default' | 'muted';
  isSecondaryNavigationActive: boolean;
  onSearch: () => void;
  onNavToggle: () => void;
}) {
  const isExpanded = mode === 'expanded';
  const showExpandNavigationButton =
    mode === 'collapsed-hovered' && !isSecondaryNavigationActive;
  const isCollapsedActionMuted = collapsedActionTone === 'muted';
  const areNavigationTooltipsSuppressed = useLayoutStore(
    (state) => state.areNavigationTooltipsSuppressed,
  );

  return (
    <>
      <header className="flex h-15.75 shrink-0 items-center justify-between text-tertiary">
        <AnimatePresence mode="popLayout">
          {showExpandNavigationButton ? (
            <m.div
              key="expand-navigation"
              className="w-full"
              initial={{ opacity: 0, scale: 0.75, filter: 'blur(2px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.75, filter: 'blur(2px)' }}
              transition={{ duration: motionDurations.slow, ease: motionEasings.ease }}
            >
              <NavigationTooltip
                title="Expand navigation"
                content={
                  <span className="flex items-center gap-2">
                    <span>Expand navigation</span>
                    <span className="-mr-1">
                      <Shortcut
                        keys={[
                          { type: 'modifier', name: 'command' },
                          { type: 'character', value: 'B' },
                        ]}
                      />
                    </span>
                  </span>
                }
              >
                <button
                  type="button"
                  aria-label="Expand navigation"
                  onClick={onNavToggle}
                  className={clsx(
                    'group relative isolate flex h-control w-full shrink-0 items-center gap-2 pr-3.5 pl-5.5 font-normal whitespace-nowrap text-secondary transition-[font-weight,color] duration-100',
                    'before:absolute before:inset-x-3.5 before:inset-y-[0.5px] before:z-[-1] before:rounded before:bg-white/6 before:opacity-0 before:transition-opacity before:duration-100 hover:before:opacity-100 data-popup-open:before:opacity-100',
                  )}
                >
                  <span className="size-4 shrink-0 text-muted-foreground transition-[color] duration-100 group-hover:text-secondary group-data-[popup-open]:text-secondary">
                    <Icon name="SidebarShow" />
                  </span>
                </button>
              </NavigationTooltip>
            </m.div>
          ) : (
            <m.div
              key="shopify-logo"
              initial={{ opacity: 0, scale: 0.75, filter: 'blur(2px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.75, filter: 'blur(2px)' }}
              transition={{ duration: motionDurations.slow, ease: motionEasings.ease }}
            >
              <span className="inline-flex pl-4.75">
                <ShopifyLogo className="size-6" aria-hidden />
              </span>
            </m.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isExpanded && (
            <Tooltip.Provider delay={500} closeDelay={0}>
              <div className="flex items-center">
                <m.div
                  initial={{ opacity: 0, scale: 0.75, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{
                    opacity: 0,
                    scale: 0.75,
                    filter: 'blur(2px)',
                  }}
                  transition={{
                    duration: motionDurations.slower,
                    ease: motionEasings.ease,
                  }}
                >
                  <Tooltip.Root disabled={areNavigationTooltipsSuppressed}>
                    <Tooltip.Trigger
                      render={
                        <Button
                          size="icon"
                          variant="plain"
                          aria-label="Search"
                          onClick={onSearch}
                        >
                          <SearchIcon />
                        </Button>
                      }
                    />
                    <Tooltip.Portal>
                      <Tooltip.Positioner>
                        <Tooltip.Popup className="flex-row items-center gap-2">
                          <span>Search</span>
                          <span className="-mr-1">
                            <Shortcut
                              keys={[
                                { type: 'modifier', name: 'command' },
                                { type: 'character', value: 'K' },
                              ]}
                            />
                          </span>
                        </Tooltip.Popup>
                      </Tooltip.Positioner>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </m.div>
                <m.div
                  initial={{ opacity: 0, scale: 0.75, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{
                    opacity: 0,
                    scale: 0.75,
                    filter: 'blur(2px)',
                  }}
                  transition={{
                    duration: motionDurations.slower,
                    ease: motionEasings.ease,
                  }}
                  className="mr-2.75"
                >
                  <Tooltip.Root disabled={areNavigationTooltipsSuppressed}>
                    <Tooltip.Trigger
                      render={
                        <Button
                          size="icon"
                          variant="plain"
                          aria-label="Collapse navigation"
                          onClick={onNavToggle}
                        >
                          <Icon name="SidebarHide" />
                        </Button>
                      }
                    />
                    <Tooltip.Portal>
                      <Tooltip.Positioner>
                        <Tooltip.Popup className="flex-row items-center gap-2">
                          <span>Collapse navigation</span>
                          <span className="-mr-1">
                            <Shortcut
                              keys={[
                                { type: 'modifier', name: 'command' },
                                { type: 'character', value: 'B' },
                              ]}
                            />
                          </span>
                        </Tooltip.Popup>
                      </Tooltip.Positioner>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </m.div>
              </div>
            </Tooltip.Provider>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {!isExpanded && (
          <m.div
            initial={{ height: 0, marginBottom: 0 }}
            animate={{ height: 'var(--spacing-control)', marginBottom: 8 }}
            exit={{ height: 0, marginBottom: 0 }}
            transition={{ duration: 0.4, ease: motionEasings.ease }}
          >
            <NavigationTooltip
              title="Search"
              content={
                <span className="flex items-center gap-2">
                  <span>Search</span>
                  <span className="-mr-1">
                    <Shortcut
                      keys={[
                        { type: 'modifier', name: 'command' },
                        { type: 'character', value: 'K' },
                      ]}
                    />
                  </span>
                </span>
              }
            >
              <button
                type="button"
                aria-label="Search"
                onClick={onSearch}
                className={clsx(
                  'group relative isolate flex h-control w-full shrink-0 items-center gap-2 pl-5.5 whitespace-nowrap text-secondary transition-[color,filter,opacity] duration-800 ease-out group-hover/settings-active:opacity-100 group-hover/settings-active:duration-100',
                  'before:absolute before:inset-x-3.5 before:inset-y-[0.5px] before:z-[-1] before:rounded before:bg-white/6 before:opacity-0 before:transition-opacity before:duration-100 hover:before:opacity-100 data-popup-open:before:opacity-100',
                  isCollapsedActionMuted && 'opacity-50',
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
                  <SearchIcon />
                </m.span>
              </button>
            </NavigationTooltip>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
