import { AnimatePresence, m } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Link, type LinkProps } from '~/ui/components/link/link';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';

export function Section({
  layerId,
  action,
  className,
  title,
  subtitle,
  children,
  dashed = false,
  bleed = false,
  noBg = false,
  wrapperBg = 'bg-muted',
  wrapperActive,
  wrapperContent,
  wrapperContentPosition = 'bottom',
  href,
}: {
  layerId?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
  dashed?: boolean;
  bleed?: boolean;
  noBg?: boolean;
  wrapperBg?: string;
  wrapperActive?: boolean;
  wrapperContent?: ReactNode;
  wrapperContentPosition?: 'top' | 'bottom';
  href?: LinkProps['to'];
}) {
  const hasWrapperContent = wrapperContent !== undefined && wrapperContent !== null;
  const hasWrapper = wrapperActive ?? hasWrapperContent;
  const [isWrapperMounted, setIsWrapperMounted] = useState(hasWrapper);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasWrapper) {
      setIsWrapperMounted(true);
    }
  }, [hasWrapper]);

  const shouldRenderWrapper =
    hasWrapper || hasWrapperContent || isWrapperMounted;
  const surface = (
    <div
      data-tilt-id={layerId ? `${layerId}-surface` : undefined}
      className={clsx(
        'min-h-16 rounded-3xl',
        href && 'h-full',
        bleed ? 'p-0' : 'p-5',
        noBg ? 'bg-transparent' : 'bg-background',
        !dashed && !noBg && 'shadow-sm',
        dashed &&
          'border border-dashed border-gray-300 bg-transparent shadow-none',
      )}
    >
      {children}
    </div>
  );
  const wrapperPanel = (
    <AnimatePresence
      initial={hasMounted}
      onExitComplete={() => {
        if (!hasWrapper) {
          setIsWrapperMounted(false);
        }
      }}
    >
      {hasWrapper ? (
        <m.div
          className={clsx(
            'overflow-hidden',
            wrapperContentPosition === 'top' ? 'origin-bottom' : 'origin-top',
          )}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            duration: motionDurations.slow,
            ease: motionEasings.easeOut,
          }}
        >
          <m.div
            initial={{
              opacity: 0,
              transform: `translateY(${wrapperContentPosition === 'top' ? 8 : -8}px)`,
            }}
            animate={{ opacity: 1, transform: 'translateY(0)' }}
            exit={{
              opacity: 0,
              transform: `translateY(${wrapperContentPosition === 'top' ? 8 : -8}px)`,
            }}
            transition={{
              duration: motionDurations.base,
              ease: motionEasings.easeOut,
            }}
          >
            {wrapperContent}
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );

  const section = (
    <section
      data-tilt-id={layerId}
      className={clsx(
        'flex flex-col gap-3',
        href && 'h-full',
        !href && className,
      )}
    >
      {title || subtitle || action ? (
        <div className="flex items-center gap-4">
          <div className="flex flex-1 flex-col gap-0.5">
            {title ? <h2 className="text-lg font-medium">{title}</h2> : null}
            {subtitle ? (
              <p className="text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {shouldRenderWrapper ? (
        <div className="relative">
          <m.div
            aria-hidden
            className={clsx(
              'pointer-events-none absolute -inset-0.25 z-0 rounded-[calc(var(--radius-3xl)+1px)]',
              wrapperContentPosition === 'top' ? 'origin-bottom' : 'origin-top',
              wrapperBg,
            )}
            initial={{ opacity: 0 }}
            animate={{
              opacity: hasWrapper ? 1 : 0,
            }}
            transition={{
              duration: motionDurations.base,
              ease: motionEasings.easeOut,
            }}
          />
          <div className="relative z-10">
            {wrapperContentPosition === 'top' ? wrapperPanel : null}
            {surface}
            {wrapperContentPosition === 'bottom' ? wrapperPanel : null}
          </div>
        </div>
      ) : (
        surface
      )}
    </section>
  );

  if (href) {
    return (
      <Link
        className={clsx(
          'block transition-[scale] ease-out hover:scale-[1.009] active:scale-[0.997]',
          className,
        )}
        to={href}
      >
        {section}
      </Link>
    );
  }

  return section;
}
