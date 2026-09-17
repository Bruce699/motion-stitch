import React from 'react';
import clsx from 'clsx';
import { Link } from '~/ui/components/link/link';
import * as Tooltip from '~/ui/components/tooltip/tooltip';
import { useLayoutStore } from '~/stores/use-layout-store';

const tooltipItemClassName =
  '-mx-2 -my-1 rounded px-2 py-1.25 text-left font-book';
const tooltipLinkClassName =
  '-mx-1 rounded px-2 py-1.25 text-left font-book dark:hover:bg-white/12';
type NavigationTooltipTriggerProps = {
  onPointerDown?: React.PointerEventHandler<HTMLElement>;
};

export function NavigationTooltip({
  disabled = false,
  content,
  href,
  activeHref,
  title,
  items,
  children,
}: {
  disabled?: boolean;
  content?: React.ReactNode;
  href?: string;
  activeHref?: string | null;
  title: string;
  items?: {
    href: string;
    title: string;
  }[];
  children: React.ReactElement<NavigationTooltipTriggerProps>;
}) {
  const [open, setOpen] = React.useState(false);
  const areNavigationTooltipsSuppressed = useLayoutStore(
    (state) => state.areNavigationTooltipsSuppressed,
  );
  const setCollapsedNavigationTooltipOpen = useLayoutStore(
    (state) => state.setCollapsedNavigationTooltipOpen,
  );
  const setNavHovered = useLayoutStore((state) => state.setNavHovered);

  const closeTooltip = React.useCallback(() => {
    setOpen(false);
    setCollapsedNavigationTooltipOpen(false);
  }, [setCollapsedNavigationTooltipOpen]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      setCollapsedNavigationTooltipOpen(nextOpen);

      if (!nextOpen) {
        window.requestAnimationFrame(() => {
          setNavHovered(
            Boolean(document.querySelector('[data-primary-navigation]:hover')),
          );
        });
      }
    },
    [setCollapsedNavigationTooltipOpen, setNavHovered],
  );

  React.useEffect(() => {
    return () => setCollapsedNavigationTooltipOpen(false);
  }, [setCollapsedNavigationTooltipOpen]);

  React.useEffect(() => {
    if (areNavigationTooltipsSuppressed) {
      closeTooltip();
    }
  }, [areNavigationTooltipsSuppressed, closeTooltip]);

  const trigger = React.cloneElement(children, {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      children.props.onPointerDown?.(event);
      closeTooltip();
    },
  });

  return (
    <Tooltip.Provider delay={0} closeDelay={0}>
      <Tooltip.Root
        disabled={disabled || areNavigationTooltipsSuppressed}
        open={open}
        onOpenChange={handleOpenChange}
      >
        <Tooltip.Trigger render={trigger} />
        <Tooltip.Portal>
          <Tooltip.Positioner
            side="right"
            align="start"
            sideOffset={4}
            className="-ml-4 cursor-pointer pl-4"
          >
            <Tooltip.Popup className="gap-0.5">
              {content ? (
                <span className={tooltipItemClassName}>{content}</span>
              ) : (
                href && (
                  <>
                    <Link
                      to={href}
                      draggable={false}
                      className={clsx(
                        tooltipLinkClassName,
                        activeHref === href &&
                          'bg-white/8 font-medium text-primary shadow-nav-selected',
                      )}
                      onClick={closeTooltip}
                    >
                      {title}
                    </Link>

                    {items?.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        draggable={false}
                        className={clsx(
                          tooltipLinkClassName,
                          activeHref === item.href &&
                            'bg-white/8 font-medium text-primary shadow-nav-selected',
                        )}
                        onClick={closeTooltip}
                      >
                        {item.title}
                      </Link>
                    ))}
                  </>
                )
              )}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
