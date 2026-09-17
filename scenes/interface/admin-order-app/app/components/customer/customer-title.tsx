import { AnimatePresence, m } from 'motion/react';
import type { Customer } from '~/data/customers';
import { Icon, Map } from '~/ui';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';

const customerTitleTransition = {
  duration: motionDurations.base,
  ease: motionEasings.easeOut,
};

function CustomerInfoItem({
  children,
  icon,
}: {
  children: string;
  icon: 'Envelope' | 'Mobile' | 'Pin';
}) {
  return (
    <span className="flex items-center gap-2 text-secondary">
      <Icon name={icon} />
      <span>{children}</span>
    </span>
  );
}

export function CustomerTitle({
  address,
  city,
  customer,
  email,
  name,
  phone,
}: {
  address: string;
  city: string;
  customer: Customer;
  email: string;
  name: string;
  phone: string;
}) {
  return (
    <div data-breadcrumb-title-target className="flex items-center gap-6">
      <div className="flex flex-1 flex-col gap-2">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={customer.id}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 0, opacity: 0 }}
            transition={customerTitleTransition}
          >
            <h1 className="text-3xl font-medium">{name}</h1>
          </m.div>
        </AnimatePresence>
        <div className="flex flex-col gap-1">
          <CustomerInfoItem icon="Pin">{`${address}, ${city}`}</CustomerInfoItem>
          <CustomerInfoItem icon="Envelope">{email}</CustomerInfoItem>
          <CustomerInfoItem icon="Mobile">{phone}</CustomerInfoItem>
        </div>
      </div>
      <div className="relative size-[120px] overflow-hidden rounded-2xl border-4 border-white shadow-[0_-1px_6px_0_rgba(0,0,0,0.08),0_2px_2px_-1px_rgba(0,0,0,0.05),0_3px_4px_-1.5px_rgba(0,0,0,0.05),0_5px_16px_-2.5px_rgba(0,0,0,0.05)]">
        <Map
          center={customer.coordinates}
          zoom={14}
          aria-label={`${name} location map`}
        />
      </div>
    </div>
  );
}
