import { useParams } from 'react-router';
import { MainContentLayout } from '~/components/main-content-layout';
import { OrderAside } from '~/components/order/order-aside';
import { OrderFulfillment } from '~/components/order/order-fulfillment';
import { OrderToolbar } from '~/components/order/order-toolbar';
import { getOrderLineItems } from '~/data/order-line-items';
import { OrderNote } from '~/components/order/order-note';
import { OrderPayment } from '~/components/order/order-payment';
import { OrderTitle } from '~/components/order/order-title';
import type { OrderFulfillmentGroup } from '~/data/orders';
import { orders } from '~/data/orders';

function getOrder(orderId: string) {
  return orders.find((item) => item.id === orderId);
}

function getFulfillmentGroups(
  lineItemCount: number,
  fulfillmentGroups?: OrderFulfillmentGroup[],
) {
  return (
    fulfillmentGroups ?? [
      {
        id: 'default',
        lineItemIndexes: Array.from(
          { length: lineItemCount },
          (_, index) => index,
        ),
      },
    ]
  );
}

export default function OrderDetailPage() {
  const { orderId = '' } = useParams();
  const order = getOrder(orderId);
  const title = order?.orderNumber ?? 'Order';
  const lineItems = getOrderLineItems(order);
  const fulfillmentGroups = getFulfillmentGroups(
    lineItems.length,
    order?.fulfillmentGroups,
  );

  return (
    <>
      <OrderToolbar orderId={orderId} title={title} />
      <MainContentLayout
        aside={<OrderAside order={order} />}
        variant="constrained"
      >
        <div className="flex flex-col gap-6">
          <OrderTitle order={order} />
          {order?.customerNote ? <OrderNote note={order.customerNote} /> : null}
          <div className="flex flex-col gap-8">
            {fulfillmentGroups.map((fulfillmentGroup, fulfillmentIndex) => (
              <OrderFulfillment
                key={fulfillmentGroup.id}
                fulfillmentCount={fulfillmentGroups.length}
                fulfillmentIndex={fulfillmentIndex}
                fulfillmentLocation={fulfillmentGroup.locationName}
                fulfillmentStatus={fulfillmentGroup.fulfillmentStatus}
                order={order}
                orderId={orderId}
                lineItems={fulfillmentGroup.lineItemIndexes.flatMap(
                  (lineItemIndex) => {
                    const lineItem = lineItems[lineItemIndex];

                    return lineItem ? [lineItem] : [];
                  },
                )}
              />
            ))}
            <OrderPayment payment={order?.payment} />
          </div>
        </div>
      </MainContentLayout>
    </>
  );
}
