import { AnimatePresence, m } from 'motion/react';
import { Avatar } from '~/ui/components/avatar/avatar';
import { Button } from '~/ui/components/button/button';
import { Icon } from '~/ui/components/icon/icon';
import { Menu } from '~/ui/components/menu/menu';
import * as Tooltip from '~/ui/components/tooltip/tooltip';
import { NotificationsIcon } from '../../icons/navigation/settings/notifications';
import type { ComponentProps } from 'react';
import { useNavigate } from 'react-router';
import clsx from 'clsx';
import { currentStaffMember } from '~/data/staff-members';
import { currentStore, featuredStores } from '~/data/stores';
import { motionEasings } from '~/ui/tokens/motion';


function UserMenuTrigger({
  className,
  isNavOpen,
  ...props
}: ComponentProps<'button'> & { isNavOpen: boolean }) {
  return (
    <div className="flex items-center">
      <button
        {...props}
        type="button"
        className={clsx(
          'group relative isolate flex h-control w-full flex-1 shrink-0 items-center gap-1.5 px-5 whitespace-nowrap',
          'before:absolute before:inset-x-3.5 before:inset-y-[0.5px] before:z-[-1] before:rounded before:bg-black/5 before:opacity-0 before:transition-opacity before:duration-100 group-data-[popup-open]/collapsed-navigation-tooltip:before:opacity-100 hover:before:opacity-100 dark:before:bg-white/6',
          className,
        )}
      >
        <Avatar
          className="shrink-0"
          initials={currentStore.name.slice(0, 2)}
          name={currentStore.name}
          size="sm"
          src={currentStore.logo}
        />

        <AnimatePresence initial={false}>
          {isNavOpen && (
            <m.span
              className="flex-1 text-left text-secondary transition-[color] duration-100 group-hover:text-primary"
              initial={{ opacity: 0, x: 4, filter: 'blur(2px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{
                opacity: 0,
                x: 4,
                filter: 'blur(2px)',
              }}
              transition={{ duration: 0.4, ease: motionEasings.ease }}
            >
              {currentStore.name}
            </m.span>
          )}
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {isNavOpen && (
          <m.div
            initial={{ opacity: 0, scale: 0.75, filter: 'blur(2px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{
              opacity: 0,
              scale: 0.75,
              filter: 'blur(2px)',
            }}
            transition={{ duration: 0.4, ease: motionEasings.ease }}
            className="mr-3"
          >
            <Tooltip.Provider delay={0} closeDelay={0}>
              <Tooltip.Root>
                <Tooltip.Trigger
                  render={
                    <Button
                      onClick={() => {}}
                      size="icon"
                      variant="plain"
                      aria-label="Notifications"
                    >
                      <span className="text-tertiary">
                        <NotificationsIcon />
                      </span>
                    </Button>
                  }
                />
                <Tooltip.Portal>
                  <Tooltip.Positioner>
                    <Tooltip.Popup>Notifications</Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function NavigationUserMenu({ isNavOpen }: { isNavOpen: boolean }) {
  const navigate = useNavigate();

  return (
    <Menu
      side="top"
      align="start"
      alignOffset={10}
      sideOffset={4}
      popupClassName="dark w-52 rounded-xl bg-gray-900 shadow-xl shadow-black/30"
      options={[
        ...featuredStores.map((store) => ({
          id: store.domain,
          children: store.name,
          prefix: (
            <Avatar
              initials={store.name.slice(0, 2)}
              name={store.name}
              src={store.logo}
              size="md"
            />
          ),
          checked: store.domain === currentStore.domain,
          onSelect: () => {
            navigate('/store', { state: { shouldStaggerPrimaryNav: true } });
          },
        })),
        {
          id: 'create-store',
          children: 'Create store',
          prefix: (
            <span className="mx-1">
              <Icon name="Plus" />
            </span>
          ),
        },
        {
          type: 'separator',
          id: 'account-separator',
        },
        {
          id: 'current-user',
          children: (
            <span className="-gap-1 flex flex-col py-1">
              <span className="truncate font-medium">
                {currentStaffMember.name}
              </span>
              {currentStaffMember.email && (
                <span className="-mt-0.25 truncate text-sm text-muted-foreground">
                  {currentStaffMember.email}
                </span>
              )}
            </span>
          ),
          prefix: (
            <Avatar
              initials={currentStaffMember.initials}
              name={currentStaffMember.name}
              rounded
              size="md"
              src={currentStaffMember.image}
            />
          ),
          suffix: <Icon name="Logout" />,
          onSuffixSelect: () => {
            navigate('/login', { state: { fromAppLogout: true } });
          },
        },
      ]}
      trigger={<UserMenuTrigger isNavOpen={isNavOpen} />}
    />
  );
}
