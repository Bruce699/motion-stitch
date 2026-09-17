import { AnimatePresence, m } from 'motion/react';
import clsx from 'clsx';
import { Icon, type IconName } from '~/ui/components/icon/icon';
import { Link } from '~/ui/components/link/link';
import {
  StatusIndicator,
  type StatusIndicatorStatus,
} from '~/ui/components/status-indicator/status-indicator';
import { SystemAlertStripes } from '~/components/components/system-alerts/system-alert-stripes';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';

const systemAlertContentMotion = {
  initial: { opacity: 0, filter: 'blur(2px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
  transition: {
    duration: motionDurations.slower,
    ease: motionEasings.ease,
  },
};

const systemAlertRowMotion = {
  initial: { height: 0, opacity: 0, filter: 'blur(2px)' },
  animate: { height: 'auto', opacity: 1, filter: 'blur(0px)' },
  exit: { height: 0, opacity: 0, filter: 'blur(2px)' },
  transition: {
    duration: motionDurations.slower,
    ease: motionEasings.ease,
  },
};

type NavigationBanner = {
  href: string;
  icon: IconName;
  iconClassName: string;
  title: string;
  status: string;
  indicatorStatus: StatusIndicatorStatus;
};

export function NavigationBanners({
  isNavOpen,
  isPaymentsTestModeEnabled,
  isPayoutsPaused,
}: {
  isNavOpen: boolean;
  isPaymentsTestModeEnabled: boolean;
  isPayoutsPaused: boolean;
}) {
  const banners: NavigationBanner[] = [
    ...(isPaymentsTestModeEnabled
      ? [
          {
            href: '/store/settings/payments/methods',
            icon: 'CartAlert',
            iconClassName: 'text-yellow-300',
            title: 'Payments',
            status: 'Testing',
            indicatorStatus: 'caution',
          } satisfies NavigationBanner,
        ]
      : []),
    ...(isPayoutsPaused
      ? [
          {
            href: '/store/settings/payments/payouts',
            icon: 'WalletContent',
            iconClassName: 'text-red-300',
            title: 'Payouts',
            status: 'Paused',
            indicatorStatus: 'warning',
          } satisfies NavigationBanner,
        ]
      : []),
  ];

  if (banners.length === 0) return null;

  return (
    <div
      className={clsx(
        'dark relative pt-4',
        'after:absolute after:inset-x-5 after:top-3.5 after:h-px after:bg-white/12',
      )}
    >
      <div className="relative isolate mt-2">
        <div
          className={clsx(
            'pointer-events-none absolute right-0 -bottom-4 -left-4 -z-1 h-48 opacity-40',
            'mask-[radial-gradient(ellipse_80%_60%_at_50%_80%,black_0%,black_42%,rgb(0_0_0/0.58)_68%,transparent_100%)]',
          )}
        >
          <SystemAlertStripes className="text-yellow-300" />
        </div>

        <AnimatePresence initial={false}>
          {banners.map((banner) => (
            <m.div
              key={banner.href}
              {...systemAlertRowMotion}
              className="overflow-hidden"
            >
              <Link
                as="button"
                className="group relative isolate flex h-control w-full shrink-0 items-center gap-2 px-5.5 whitespace-nowrap text-secondary transition-[font-weight,color] duration-100 before:absolute before:inset-x-3 before:inset-y-[0.5px] before:z-[-1] before:rounded before:bg-white/6 before:opacity-0 before:transition-opacity before:duration-100 hover:text-primary hover:before:opacity-100"
                to={banner.href}
              >
                <AnimatePresence>
                  {!isNavOpen && (
                    <m.span
                      {...systemAlertContentMotion}
                      className={banner.iconClassName}
                    >
                      <Icon name={banner.icon} />
                    </m.span>
                  )}
                  {isNavOpen && (
                    <m.div
                      {...systemAlertContentMotion}
                      className="flex w-full items-center justify-between gap-2"
                    >
                      <span>{banner.title}</span>
                      <span className="inline-flex items-center gap-1 font-medium">
                        <StatusIndicator status={banner.indicatorStatus} />
                        <span>{banner.status}</span>
                      </span>
                    </m.div>
                  )}
                </AnimatePresence>
              </Link>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
