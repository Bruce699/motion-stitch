import React from 'react';
import { AnimatePresence, m } from 'motion/react';
import { isTauri } from '@tauri-apps/api/core';
import clsx from 'clsx';
import { useLocation } from 'react-router';
import { Icon } from '~/ui/components/icon/icon';
import { Input } from '~/ui/components/input/input';
import { Link } from '~/ui/components/link/link';
import { motionEasings } from '~/ui/tokens/motion';
import { useSidekickThreadStore } from '~/stores/use-sidekick-thread-store';
import { useNavigationStore } from '~/stores/use-navigation-store';
import { useLayoutStore } from '~/stores/use-layout-store';
import { NavigationItem } from './navigation-accordion';

const CHATS_NAV_SELECTION_LAYOUT_ID = 'nav-chats-selection';

const chatsNavigationListVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.01,
    },
  },
} as const;

const chatsNavigationLinkVariants = {
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

export function ChatsNavigation() {
  const { pathname } = useLocation();
  const isNavHovered = useLayoutStore((state) => state.isNavHovered);
  const chatTitle = useSidekickThreadStore((state) => state.chatTitle);
  const chatThreads = useSidekickThreadStore((state) => state.chatThreads);
  const storedChatsPath = useNavigationStore(
    (state) => state.storedChatsPath,
  );
  const previousPath = storedChatsPath || '/store';
  const isChatsPathActive =
    pathname === '/store/chats' || pathname.startsWith('/store/chats/');

  const threadItems = React.useMemo(
    () => [
      { href: '/store/chats', title: chatTitle },
      ...chatThreads.map((thread) => ({
        href: `/store/chats/${thread.id}`,
        title: thread.title,
      })),
    ],
    [chatThreads, chatTitle],
  );

  return (
    <AnimatePresence initial={false}>
      {isChatsPathActive && (
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
                    className="group/chats-back relative isolate flex w-full items-center gap-2 py-1 pr-3 pl-1.75"
                  >
                    <span className="text-secondary transition group-hover/chats-back:text-primary">
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
                        Chats
                      </m.div>
                    </div>
                  </Link>
                </m.div>
              </header>

              <div className="pointer-events-none mb-[7px] px-3">
                <Input placeholder="Search" aria-label="Search chats" />
              </div>

              <m.nav
                className="flex w-full flex-1 flex-col overflow-y-auto pt-px pb-3"
                initial="hidden"
                animate="visible"
                exit="visible"
                variants={chatsNavigationListVariants}
              >
                {threadItems.map(({ href, title }) => (
                  <m.div
                    key={href}
                    className="shrink-0 will-change-transform"
                    variants={chatsNavigationLinkVariants}
                    transition={{
                      duration: 0.4,
                      ease: motionEasings.ease,
                    }}
                  >
                    <NavigationItem
                      href={href}
                      title={title}
                      navState={{ exactMatch: true }}
                      activePath={pathname}
                      selectionLayoutId={CHATS_NAV_SELECTION_LAYOUT_ID}
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
