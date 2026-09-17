import React from 'react';
import { m, AnimatePresence } from 'motion/react';
import { isTauri } from '@tauri-apps/api/core';
import { Icon, Input, Link } from '~/ui';
import clsx from 'clsx';
import { motionEasings } from '~/ui/tokens/motion';
import {
  NavigationItem,
  SETTINGS_NAV_SELECTION_LAYOUT_ID,
} from './navigation-accordion';
import { GeneralIcon } from '../../icons/navigation/settings/general';
import { PlanIcon } from '../../icons/navigation/settings/plan';
import { BillingIcon } from '../../icons/navigation/settings/billing';
import { UsersIcon } from '../../icons/navigation/settings/users';
import { PaymentsIcon } from '../../icons/navigation/settings/payments';
import { CheckoutIcon } from '../../icons/navigation/settings/checkout';
import { CustomerAccountsIcon } from '../../icons/navigation/settings/customer-accounts';
import { ShippingAndDeliveryIcon } from '../../icons/navigation/settings/shipping-and-delivery';
import { TaxesAndDutiesIcon } from '../../icons/navigation/settings/taxes-and-duties';
import { LocationsIcon } from '../../icons/navigation/settings/locations';
import { AppsAndSalesChannelsIcon } from '../../icons/navigation/settings/apps-and-sales-channels';
import { DomainsIcon } from '../../icons/navigation/settings/domains';
import { CustomerEventsIcon } from '../../icons/navigation/settings/customer-events';
import { NotificationsIcon } from '../../icons/navigation/settings/notifications';
import { MetaobjectsIcon } from '../../icons/navigation/settings/metaobjects';
import { LanguagesIcon } from '../../icons/navigation/settings/languages';
import { CustomerPrivacyIcon } from '../../icons/navigation/settings/customer-privacy';
import { PoliciesIcon } from '../../icons/navigation/settings/policies';
import { DevUiIcon } from '../../icons/navigation/dev-ui';
import { useNavigationStore } from '../../stores/use-navigation-store';
import { useLayoutStore } from '../../stores/use-layout-store';
import { useLocation } from 'react-router';


const SETTINGS_NAV_ITEMS: {
  href: string;
  title: string;
  Icon: React.ComponentType;
}[] = [
  { href: '/store/settings/general', title: 'General', Icon: GeneralIcon },
  { href: '/store/settings/plan', title: 'Plan', Icon: PlanIcon },
  { href: '/store/settings/billing', title: 'Billing', Icon: BillingIcon },
  { href: '/store/settings/users', title: 'Users', Icon: UsersIcon },
  { href: '/store/settings/payments', title: 'Payments', Icon: PaymentsIcon },
  { href: '/store/settings/checkout', title: 'Checkout', Icon: CheckoutIcon },
  {
    href: '/store/settings/customer-accounts',
    title: 'Customer accounts',
    Icon: CustomerAccountsIcon,
  },
  {
    href: '/store/settings/shipping-and-delivery',
    title: 'Shipping and delivery',
    Icon: ShippingAndDeliveryIcon,
  },
  {
    href: '/store/settings/taxes-and-duties',
    title: 'Taxes and duties',
    Icon: TaxesAndDutiesIcon,
  },
  {
    href: '/store/settings/locations',
    title: 'Locations',
    Icon: LocationsIcon,
  },
  {
    href: '/store/settings/apps-and-sales-channels',
    title: 'Apps and sales channels',
    Icon: AppsAndSalesChannelsIcon,
  },
  { href: '/store/settings/domains', title: 'Domains', Icon: DomainsIcon },
  {
    href: '/store/settings/customer-events',
    title: 'Customer events',
    Icon: CustomerEventsIcon,
  },
  {
    href: '/store/settings/notifications',
    title: 'Notifications',
    Icon: NotificationsIcon,
  },
  {
    href: '/store/settings/metaobjects',
    title: 'Metaobjects',
    Icon: MetaobjectsIcon,
  },
  {
    href: '/store/settings/languages',
    title: 'Languages',
    Icon: LanguagesIcon,
  },
  {
    href: '/store/settings/customer-privacy',
    title: 'Customer privacy',
    Icon: CustomerPrivacyIcon,
  },
  { href: '/store/settings/policies', title: 'Policies', Icon: PoliciesIcon },
  { href: '/store/settings/dev-ui', title: 'Dev UI', Icon: DevUiIcon },
];

const settingsNavigationListVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.01,
    },
  },
} as const;

const settingsNavigationLinkVariants = {
  hidden: {
    opacity: 0,
    filter: 'blur(6px)',
    x: 60,
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    x: 0,
  },
} as const;

export function SettingsNavigation() {
  const { pathname: activePath } = useLocation();
  const isNavHovered = useLayoutStore((state) => state.isNavHovered);

  const storedSettingsPath = useNavigationStore(
    (state) => state.storedSettingsPath,
  );
  const previousPath = storedSettingsPath || '/store';
  const isSettingsPathActive =
    activePath === '/store/settings' ||
    activePath.startsWith('/store/settings/');

  return (
    <AnimatePresence initial={false}>
      {isSettingsPathActive && (
        <m.div
          initial={{ width: 0 }}
          animate={{ width: 'calc(var(--spacing) * 60)' }}
          exit={{ width: 0 }}
          transition={{
            duration: 0.4,
            ease: motionEasings.ease,
          }}
          className="dark relative h-full shadow-[-1px_0_0_--alpha(var(--color-white)/5%)]"
        >
          <m.aside
            className={clsx(
              'absolute inset-y-0 left-0 flex h-full w-60 flex-col rounded-l-2xl transition-opacity ease-out',
              isTauri() ? 'pt-control' : 'pt-0',
              isNavHovered && 'opacity-50',
            )}
          >
            <m.div
              className="flex flex-1 flex-col overflow-hidden"
              initial={{ opacity: 0, filter: 'blur(2px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(2px)' }}
              transition={{ duration: 0.4, ease: motionEasings.ease }}
            >
              <header className="mb-0.75 flex px-3.5 py-3">
                <m.div
                  initial="rest"
                  whileHover="hover"
                  animate="rest"
                  className="w-full"
                >
                  <Link
                    as="button"
                    to={previousPath}
                    className="group/settings-back relative isolate flex w-full items-center gap-2 py-1 pr-3 pl-1.75"
                  >
                    <span className="text-secondary transition group-hover/settings-back:text-primary">
                      <Icon name="ChevronLeft" size={14} />
                    </span>

                    <div className="text-md relative text-left leading-5.75 font-medium text-primary perspective-near transform-3d">
                      <m.div
                        variants={{
                          rest: {
                            rotateX: 90,
                            opacity: 0,
                            y: -18,
                            filter: 'blur(1px)',
                          },
                          hover: {
                            rotateX: 0,
                            opacity: 1,
                            y: 0,
                            filter: 'blur(0px)',
                          },
                        }}
                        transition={{ duration: 0.4, ease: motionEasings.ease }}
                        className="absolute inset-0 origin-bottom"
                      >
                        Back
                      </m.div>

                      <m.div
                        className="origin-top"
                        variants={{
                          rest: {
                            rotateX: 0,
                            opacity: 1,
                            y: 0,
                            filter: 'blur(0px)',
                          },
                          hover: {
                            rotateX: -90,
                            opacity: 0,
                            y: 20,
                            filter: 'blur(1px)',
                          },
                        }}
                        transition={{ duration: 0.4, ease: motionEasings.ease }}
                      >
                        Settings
                      </m.div>
                    </div>
                  </Link>
                </m.div>
              </header>

              <div className="pointer-events-none mb-[7px] px-3">
                <Input placeholder="Search" />
              </div>

              <m.nav
                className="flex w-full flex-1 flex-col overflow-y-auto pt-px pb-3 base:font-book"
                initial="hidden"
                animate="visible"
                exit="visible"
                variants={settingsNavigationListVariants}
              >
                {SETTINGS_NAV_ITEMS.map(({ href, title, Icon }, index) => (
                  <m.div
                    key={href}
                    className="shrink-0 will-change-transform"
                    variants={settingsNavigationLinkVariants}
                    transition={{
                      duration: 0.4,
                      ease: motionEasings.ease,
                    }}
                  >
                    <NavigationItem
                      href={href}
                      icon={<Icon />}
                      title={title}
                      navState={{ exactMatch: index === 0 }}
                      activePath={activePath}
                      selectionLayoutId={SETTINGS_NAV_SELECTION_LAYOUT_ID}
                      inactiveClassName="text-secondary hover:text-primary"
                      inactiveHoverBackdrop="before:bg-white/6"
                    />
                  </m.div>
                ))}
              </m.nav>
            </m.div>
          </m.aside>
        </m.div>
      )}
    </AnimatePresence>
  );
}
