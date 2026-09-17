import React from 'react';
import { AnimatePresence, m } from 'motion/react';
import { motionEasings } from '~/ui/tokens/motion';
import clsx from 'clsx';
import {
  Link,
  type LinkAsButtonProps,
  type LinkAsLinkProps,
} from '~/ui/components/link/link';
import { NavigationTooltip } from './navigation-tooltip';


/** layoutId prefix for Motion shared-element selection pill in the primary rail. */
export const PRIMARY_NAV_SELECTION_LAYOUT_ID = 'nav-primary-selection';

/** layoutId for selection pill motion in the settings sub-panel. */
export const SETTINGS_NAV_SELECTION_LAYOUT_ID = 'nav-settings-selection';

/** layoutId for the Settings item in the primary rail (not shared with section accordions). */
export const PRIMARY_NAV_SETTINGS_ITEM_SELECTION_LAYOUT_ID =
  'nav-primary-settings-item-selection';

/**
 * Shared `layoutId` projection can bootstrap from the first DOM candidate on the hydration
 * frame (so Home flashes selected) before jumping to the real route. Activate `layoutId` only
 * after paint so prerender HTML and the first painted frame stay consistent.
 */
function DeferredNavSelectionLayoutPill({
  show,
  layoutId,
  className,
  transition,
}: {
  show: boolean;
  layoutId: string;
  className?: string;
  transition: { duration: number; ease: typeof motionEasings.ease };
}) {
  const [layoutProjectionReady, setLayoutProjectionReady] =
    React.useState(false);

  React.useLayoutEffect(() => {
    if (!show) {
      setLayoutProjectionReady(false);
      return;
    }

    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => setLayoutProjectionReady(true));
    });

    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, [show]);

  if (!show) return null;

  return (
    <m.span
      layoutId={layoutProjectionReady ? layoutId : undefined}
      className={className}
      transition={transition}
    />
  );
}

export function NavigationAccordion({
  title,
  href,
  quantity,
  icon,
  items,
  isNavigationPanelExpanded,
  exactMatch = false,
  activePath,
  selectionLayoutId,
}: {
  title: string;
  href: string;
  quantity?: number;
  icon?: React.ReactElement;
  items?: {
    href: string;
    title: string;
  }[];
  isNavigationPanelExpanded: boolean;
  exactMatch?: boolean;
  activePath: string;
  selectionLayoutId: string;
}) {
  const isActivePath = exactMatch
    ? activePath === href
    : activePath === href || activePath.startsWith(`${href}/`);

  const isSubItemRoute =
    items &&
    items.some(
      (item) =>
        activePath === item.href || activePath.startsWith(`${item.href}/`),
    );

  const isTriggerActive =
    activePath === href ||
    (activePath.startsWith(`${href}/`) && !isSubItemRoute);

  const [isExpandedOverride, setIsExpandedOverride] = React.useState<
    boolean | null
  >(null);
  const isExpanded = isActivePath || isExpandedOverride === true;

  const collapseInactiveAccordion = () => {
    if (!isActivePath) {
      setIsExpandedOverride(false);
    }
  };

  const expandAccordionForKeyboardNavigation = () => {
    if (!isExpanded) {
      setIsExpandedOverride(true);
    }
  };

  const activeChildHref = items?.length
    ? items.reduce<string | null>((longestMatch, item) => {
        const isMatch =
          activePath === item.href || activePath.startsWith(`${item.href}/`);

        if (!isMatch) return longestMatch;
        if (longestMatch === null || item.href.length > longestMatch.length) {
          return item.href;
        }

        return longestMatch;
      }, null)
    : null;
  const activeTooltipHref = activeChildHref ?? (isActivePath ? href : null);

  const trigger = (
    <NavigationTooltip
      disabled={isNavigationPanelExpanded}
      href={href}
      activeHref={activeTooltipHref}
      title={title}
      items={items}
    >
      <NavigationItem
        onBlur={collapseInactiveAccordion}
        href={href}
        quantity={quantity}
        icon={icon}
        title={title}
        navState={{
          active: isNavigationPanelExpanded ? isTriggerActive : isActivePath,
          subItemActive: isSubItemRoute,
          panelExpanded: isNavigationPanelExpanded,
          exactMatch,
        }}
        activePath={activePath}
        selectionLayoutId={selectionLayoutId}
        inactiveHoverBackdrop="before:bg-white/6"
      />
    </NavigationTooltip>
  );

  return (
    <>
      {trigger}

      {items && items.length > 0 && (
        <div
          className="grid shrink-0 overflow-hidden transition-[grid-template-rows] duration-400"
          style={{
            gridTemplateRows:
              isExpanded && isNavigationPanelExpanded ? '1fr' : '0fr',
            transitionTimingFunction: 'var(--ease-out)',
          }}
          onFocus={expandAccordionForKeyboardNavigation}
          onBlur={collapseInactiveAccordion}
        >
          <div className="">
            {items.map((item, index) => {
              const isItemActive = item.href === activeChildHref;

              const totalDelay = 0.15;
              const delayPerItem =
                items.length > 0 ? totalDelay / items.length : 0;
              const delay =
                isExpanded && isNavigationPanelExpanded
                  ? index * delayPerItem
                  : 0;

              return (
                <m.div
                  key={item.href}
                  animate={{
                    opacity: isExpanded && isNavigationPanelExpanded ? 1 : 0,
                    transform:
                      isExpanded && isNavigationPanelExpanded
                        ? 'translateX(0)'
                        : 'translateX(-4px)',
                    filter:
                      isExpanded && isNavigationPanelExpanded
                        ? 'blur(0px)'
                        : 'blur(2px)',
                  }}
                  transition={{
                    duration: 0.4,
                    ease: motionEasings.ease,
                    delay,
                  }}
                >
                  <Link
                    to={item.href}
                    draggable={false}
                    aria-current={isItemActive ? 'page' : undefined}
                    className={clsx(
                      'relative isolate flex h-control w-full items-center gap-2 pl-11.5 text-left transition-[font-weight,color] duration-75',
                      isItemActive
                        ? 'font-medium text-primary'
                        : clsx(
                            'text-muted-foreground',
                            'before:absolute before:inset-x-3 before:inset-y-[0.5px] before:z-[-1] before:rounded before:bg-white/6 before:opacity-0 before:transition-opacity before:duration-100 hover:before:opacity-100',
                          ),
                    )}
                  >
                    {isItemActive && isNavigationPanelExpanded && (
                      <DeferredNavSelectionLayoutPill
                        show
                        layoutId={selectionLayoutId}
                        className="absolute inset-x-3 inset-y-[0.5px] -z-10 rounded bg-white/8 shadow-nav-selected"
                        transition={{ duration: 0.4, ease: motionEasings.ease }}
                      />
                    )}
                    {item.title}
                  </Link>
                </m.div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export function NavigationItem({
  href,
  icon,
  title,
  quantity,
  navState,
  activePath,
  selectionLayoutId,
  selectionPillClassName = 'shadow-nav-selected bg-white/8',
  activeClassName,
  inactiveClassName,
  inactiveHoverBackdrop,
  as = 'link',
  className,
  onClick,
  ...props
}: {
  href: string;
  icon?: React.ReactElement;
  title: string;
  quantity?: number;
  navState?: {
    active?: boolean;
    subItemActive?: boolean;
    panelExpanded?: boolean;
    exactMatch?: boolean;
    muteInactiveIcon?: boolean;
  };
  activePath: string;
  selectionLayoutId: string;
  selectionPillClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  inactiveHoverBackdrop?: string;
} & Omit<LinkAsLinkProps, 'as' | 'onClick' | 'to'> & {
    as?: 'link' | 'button';
    onClick?: (
      event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    ) => void;
  }) {
  const {
    active,
    subItemActive,
    panelExpanded = true,
    exactMatch,
    muteInactiveIcon = true,
  } = navState ?? {};

  const isActivePath = exactMatch
    ? activePath === href
    : active || activePath === href || activePath.startsWith(`${href}/`);

  const isCurrentDestination = activePath === href;

  const showSelectionPill =
    (isActivePath && !subItemActive) ||
    (!panelExpanded && subItemActive && isActivePath);
  const showHoverBackdrop =
    inactiveHoverBackdrop &&
    (!isActivePath || (panelExpanded && subItemActive));

  const content = (
    <>
      <DeferredNavSelectionLayoutPill
        show={Boolean(showSelectionPill)}
        layoutId={selectionLayoutId}
        className={clsx(
          'absolute inset-x-3.5 inset-y-[0.5px] -z-10 rounded',
          selectionPillClassName,
        )}
        transition={{ duration: 0.4, ease: motionEasings.ease }}
      />

      {icon && (
        <span
          className={clsx(
            'size-4 shrink-0 transition-[color] duration-100',
            muteInactiveIcon &&
              !isActivePath &&
              'text-muted-foreground group-hover:text-secondary group-data-[popup-open]:text-secondary',
          )}
        >
          {icon}
        </span>
      )}

      <AnimatePresence initial={false}>
        {panelExpanded && (
          <m.span
            initial={{ opacity: 0, x: 4, filter: 'blur(2px)' }}
            animate={{
              opacity: 1,
              x: 0,
              filter: 'blur(0px)',
            }}
            exit={{
              opacity: 0,
              x: 4,
              filter: 'blur(2px)',
            }}
            transition={{ duration: 0.4, ease: motionEasings.ease }}
            className="flex flex-1 items-center justify-between text-inherit"
          >
            {title}

            {quantity && (
              <span className="mr-1.25 rounded-full bg-white/15 px-1.5 py-0.5 text-xs font-semibold text-secondary transition-colors group-hover:text-primary">
                {quantity}
              </span>
            )}
          </m.span>
        )}
      </AnimatePresence>
    </>
  );

  const linkClassName = clsx(
    'group relative isolate flex h-control w-full shrink-0 items-center gap-2 pr-3.5 pl-5.5 whitespace-nowrap transition-[font-weight,color] duration-100',
    showHoverBackdrop &&
      'before:absolute before:inset-x-3.5 before:inset-y-[0.5px] before:z-[-1] before:rounded before:opacity-0 before:transition-opacity before:duration-100 hover:before:opacity-100 data-popup-open:before:opacity-100',
    showHoverBackdrop && inactiveHoverBackdrop,
    isActivePath
      ? clsx('font-medium', activeClassName ?? 'text-primary')
      : clsx('font-normal', inactiveClassName ?? 'text-secondary'),
    className,
  );

  if (as === 'button') {
    return (
      <Link
        {...(props as Omit<LinkAsButtonProps, 'as' | 'onClick' | 'to'>)}
        as="button"
        to={href}
        draggable={false}
        aria-current={isCurrentDestination ? 'page' : undefined}
        onClick={onClick}
        className={linkClassName}
      >
        {content}
      </Link>
    );
  }

  return (
    <Link
      {...props}
      to={href}
      draggable={false}
      aria-current={isCurrentDestination ? 'page' : undefined}
      onClick={onClick}
      className={linkClassName}
    >
      {content}
    </Link>
  );
}
