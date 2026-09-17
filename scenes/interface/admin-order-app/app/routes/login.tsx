import { m } from 'motion/react';
import { useLocation, useNavigationType } from 'react-router';
import { featuredStores } from '~/data/stores';
import { currentStaffMember } from '~/data/staff-members';
import { motionEasings } from '~/ui/tokens/motion';
import { Avatar, Button, Icon, Image, Link, ShopifyLogo } from '~/ui';

const MotionLink = m.create(Link);

export default function Login() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const isFromAppLogout =
    navigationType !== 'POP' &&
    typeof location.state === 'object' &&
    location.state !== null &&
    'fromAppLogout' in location.state;

  return (
    <div className="isolate mx-auto flex w-[98vw] max-w-90 flex-col justify-center gap-6">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          ease: motionEasings.ease,
          duration: 2,
          delay: isFromAppLogout ? 0.2 : 0.1,
        }}
        className="mx-auto mb-2 will-change-transform"
      >
        <ShopifyLogo variant="full" />
      </m.div>

      <m.div
        layoutId="main-content-surface"
        className="z-1 overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/20 will-change-transform"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          isFromAppLogout
            ? {
                type: 'spring',
                stiffness: 333,
                damping: 33,
              }
            : {
                duration: 1,
                ease: motionEasings.ease,
              }
        }
      >
        <div className="p-1.5">
          {featuredStores.map((store, index) => (
            <MotionLink
              as="button"
              key={store.domain}
              className="relative flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2 text-left transition-colors ease-out hover:bg-gray-100"
              to="/store"
              state={{ shouldStaggerPrimaryNav: true }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: (isFromAppLogout ? 0.3 : 0.15) + index * 0.06,
                duration: 0.8,
                ease: motionEasings.ease,
              }}
            >
              <Image
                src={store.logo}
                alt={store.name}
                size={40}
                borderRadius="md"
                className="shrink-0"
                decoding="async"
              />
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="text-lg font-medium">{store.name}</div>
                <div className="text-sm text-secondary">{store.domain}</div>
              </div>
            </MotionLink>
          ))}
        </div>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          ease: motionEasings.ease,
          duration: 2,
          delay: isFromAppLogout ? 0.2 : 0.1,
        }}
        className="flex items-center justify-between px-5 will-change-transform"
      >
        <div className="flex items-center gap-3">
          <span className="contents">
            <Avatar
              className="size-8 border-none bg-transparent"
              initials={currentStaffMember.initials}
              name={currentStaffMember.name}
              rounded
              src={currentStaffMember.image}
            />
          </span>
          <div>
            <div className="font-medium text-white">
              {currentStaffMember.name}
            </div>
            <div className="text-muted-foreground">
              {currentStaffMember.email}
            </div>
          </div>
        </div>

        <div className="dark">
          <Button onClick={() => {}} variant="plain" size="icon">
            <span className="text-tertiary">
              <Icon name="Logout" />
            </span>
          </Button>
        </div>
      </m.div>
    </div>
  );
}
