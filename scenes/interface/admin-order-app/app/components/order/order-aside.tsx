import type { Order } from '~/data/orders';
import { Aside } from '~/ui';
import { OrderMap } from './order-map';
import { OrderRisk } from './order-risk';

export function OrderAside({ order }: { order?: Order }) {
  if (!order) return null;

  return (
    <Aside.Root>
      <OrderMap center={order.customerDetails.coordinates} />
      <Aside.Group data-tilt-id="customer">
        <h2 className="mb-1.5 text-xl font-medium">{order.customer}</h2>
        <Aside.Item type="info" icon="Pin">
          <span className="block truncate">
            {order.customerDetails.address}
          </span>
        </Aside.Item>
        <Aside.Item type="info" icon="Envelope">
          <span className="block truncate">{order.customerDetails.email}</span>
        </Aside.Item>
        <Aside.Item type="info" icon="Mobile">
          <span className="block truncate">{order.customerDetails.phone}</span>
        </Aside.Item>
        <Aside.Item type="info" icon="CartShopping">
          {order.customerDetails.orderCount} orders
        </Aside.Item>
      </Aside.Group>

      <Aside.Group heading="Order risk" data-tilt-id="risk">
        <OrderRisk risk={order.risk} />
      </Aside.Group>

      <Aside.Group heading="Timeline" data-tilt-id="timeline">
        <Aside.Timeline events={order.timelineEvents} />
      </Aside.Group>
    </Aside.Root>
  );
}
