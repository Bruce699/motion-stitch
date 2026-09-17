import React from 'react';
import { AnimatePresence, m } from 'motion/react';
import type { Order } from '~/data/orders';
import { AnimatedNumber, Badge } from '~/ui';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';
import { fulfillmentStatusVariant, paymentStatusVariant } from './order-status';

const orderBadgeTransition = {
  duration: motionDurations.slow,
  ease: motionEasings.easeOut,
};

export function OrderTitle({
  order,
}: {
  order?: Order;
}) {
  const [animateOrderNumber, setAnimateOrderNumber] = React.useState(false);

  React.useEffect(() => {
    setAnimateOrderNumber(true);
  }, []);

  if (!order) {
    return (
      <div data-breadcrumb-title-target className="flex flex-col gap-2">
        <h1 className="text-3xl font-medium">Order</h1>
      </div>
    );
  }

  return (
    <div data-breadcrumb-title-target className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-1.5 text-3xl font-medium">
          <AnimatedNumber
            animated={animateOrderNumber}
            formatting="none"
            prefix="Order #"
            metric={globalThis.Number(order.orderNumber.replace(/\D/g, ''))}
          />
        </h1>
        <div className="relative flex items-center gap-2">
          <span className="inline-grid overflow-hidden">
            <AnimatePresence initial={false} mode="wait">
              <m.span
                key={`${order.id}:fulfillment`}
                className="col-start-1 row-start-1 inline-flex"
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={orderBadgeTransition}
              >
                <Badge
                  iconName="PalletPackage"
                  variant={fulfillmentStatusVariant(order.fulfillmentStatus)}
                >
                  {order.fulfillmentStatus}
                </Badge>
              </m.span>
            </AnimatePresence>
          </span>
          <span className="inline-grid overflow-hidden">
            <AnimatePresence initial={false} mode="wait">
              <m.span
                key={`${order.id}:payment`}
                className="col-start-1 row-start-1 inline-flex"
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{
                  ...orderBadgeTransition,
                  delay: 0.04,
                }}
              >
                <Badge
                  iconName="InvoiceIn"
                  variant={paymentStatusVariant(order.paymentStatus)}
                >
                  {order.paymentStatus}
                </Badge>
              </m.span>
            </AnimatePresence>
          </span>
        </div>
      </div>
      <p className="text-secondary">
        {order.placedAt} via {order.source}
      </p>
    </div>
  );
}
