import { AnimatePresence, m } from 'motion/react';
import clsx from 'clsx';
import { buttonClass } from '~/ui/components/button/button-class';
import { Icon } from '~/ui/components/icon/icon';
import { Link } from '~/ui/components/link/link';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';
import type { ToolbarBreadcrumbItem as ToolbarBreadcrumbType } from './toolbar.types';

const toolbarTransition = {
  duration: motionDurations.base,
  ease: motionEasings.easeOut,
};

export function ToolbarBreadcrumbs({
  breadcrumbs,
}: {
  breadcrumbs?: ToolbarBreadcrumbType[];
}) {
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  const hasScrollMountAnimation = breadcrumbs.some(
    (breadcrumb) => breadcrumb.animateOnMount,
  );

  return (
    <m.div
      className="flex items-center gap-2 px-1 font-medium"
      initial={hasScrollMountAnimation ? false : { x: -8, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={toolbarTransition}
    >
      {breadcrumbs.map((breadcrumb, index) => {
        const previousBreadcrumb = breadcrumbs[index - 1];
        const shouldShowSeparator =
          index > 0 &&
          breadcrumb.variant !== 'button' &&
          previousBreadcrumb?.variant !== 'button';

        return (
          <m.div
            layout={breadcrumb.animateOnMount ? false : 'position'}
            className="flex items-center"
            initial={
              breadcrumb.animateOnMount ? { y: 8, opacity: 0 } : undefined
            }
            animate={{ y: 0, opacity: 1 }}
            exit={breadcrumb.animateOnMount ? { y: 8, opacity: 0 } : undefined}
            key={index}
            transition={toolbarTransition}
          >
            {shouldShowSeparator && (
              <span className="text-muted-foreground/40">/</span>
            )}
            <ToolbarBreadcrumbItem breadcrumb={breadcrumb} />
          </m.div>
        );
      })}
    </m.div>
  );
}

function ToolbarBreadcrumbItem({
  breadcrumb,
}: {
  breadcrumb: ToolbarBreadcrumbType;
}) {
  const variant = breadcrumb.variant ?? 'link';
  const iconKey = breadcrumb.label;
  const isNavigable = breadcrumb.url !== undefined;
  const isLabelVisible = variant !== 'button' && breadcrumb.hideLabel !== true;

  return (
    <Link
      as="button"
      to={breadcrumb.url ?? ''}
      aria-label={!isLabelVisible ? breadcrumb.label : undefined}
      aria-disabled={!isNavigable ? true : undefined}
      className={clsx(
        'relative flex h-control items-center gap-1.75',
        variant === 'link' && 'text-secondary',
        !isNavigable && 'cursor-default',
      )}
      onClick={(event) => {
        if (!isNavigable) {
          event.preventDefault();
        }
      }}
      tabIndex={isNavigable ? undefined : -1}
    >
      <m.div
        layout="position"
        animate={{ marginLeft: variant === 'button' ? -4 : 0 }}
        className={clsx(
          'relative flex items-center gap-1',
          variant === 'button' && 'px-3',
        )}
        transition={toolbarTransition}
      >
        <AnimatePresence mode="popLayout">
          {variant === 'button' && (
            <m.div
              key="button-surface"
              initial={{
                opacity: 0,
                scale: 0.5,
                filter: 'blur(2px)',
              }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
              }}
              exit={{
                opacity: 0,
                scale: 0.5,
                filter: 'blur(2px)',
              }}
              transition={toolbarTransition}
              className="absolute inset-0 -z-1 inline-flex flex-center rounded-full"
            >
              <div className={clsx('w-full', buttonClass('elevated'))}></div>
            </m.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false} mode="popLayout">
          {variant === 'button' && (
            <m.span
              key="button-chevron"
              layout="position"
              className="inline-flex shrink-0 text-muted-foreground"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={toolbarTransition}
            >
              <Icon name="ChevronLeft" size={12} strokeWidth={2} />
            </m.span>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false} mode="popLayout">
          {breadcrumb.icon && (
            <m.span
              key="breadcrumb-icon-slot"
              layout
              className="inline-flex h-4 shrink-0 items-center justify-center overflow-visible"
              initial={{ width: 0 }}
              animate={{ width: 16 }}
              exit={{ width: 0 }}
              transition={toolbarTransition}
            >
              <AnimatePresence initial={false} mode="popLayout">
                <m.span
                  key={iconKey}
                  className="inline-flex size-4 shrink-0 items-center justify-center"
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.3 }}
                  transition={toolbarTransition}
                >
                  {breadcrumb.icon}
                </m.span>
              </AnimatePresence>
            </m.span>
          )}
        </AnimatePresence>
      </m.div>
      <AnimatePresence initial={false} mode="popLayout">
        {isLabelVisible && (
          <m.span
            key={breadcrumb.label}
            className="shrink-0 whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={toolbarTransition}
          >
            {breadcrumb.label}
          </m.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
