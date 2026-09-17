import {
  customerEmailSubscriptionOptions,
  customerNoteOptions,
  customerSmsSubscriptionOptions,
  customerTagOptions,
  getCustomerTimeline,
  type Customer,
} from '~/data/customers';
import type { Order } from '~/data/orders';
import { AnimatedNumber, Aside } from '~/ui';

function parseMoney(value: string) {
  return globalThis.Number(value.replace(/[^0-9.]/g, '')) || 0;
}

function getCustomerTotalSpent(customer: Customer, orders: Order[]) {
  const total = orders.reduce((sum, order) => sum + parseMoney(order.total), 0);

  return total > 0 ? total : parseMoney(customer.lifetimeSpend);
}

export function CustomerAside({
  customer,
  customerName,
  emailSubscribed,
  note,
  orders,
  segment,
  smsSubscribed,
  tag,
  onEmailSubscribedChange,
  onNoteChange,
  onSmsSubscribedChange,
  onTagChange,
}: {
  customer: Customer;
  customerName: string;
  emailSubscribed: boolean;
  note: string;
  orders: Order[];
  segment: string;
  smsSubscribed: boolean;
  tag: string;
  onEmailSubscribedChange: (value: boolean) => void;
  onNoteChange: (value: string) => void;
  onSmsSubscribedChange: (value: boolean) => void;
  onTagChange: (value: string) => void;
}) {
  const totalSpent = getCustomerTotalSpent(customer, orders);
  const timelineEvents = getCustomerTimeline(customerName);

  return (
    <Aside.Root>
      <Aside.Group>
        <Aside.Item
          type="status"
          label="Email"
          status={emailSubscribed ? 'active' : 'inactive'}
          value={emailSubscribed ? 'subscribed' : 'not-subscribed'}
          options={customerEmailSubscriptionOptions}
          onValueChange={(value) => {
            if (typeof value === 'string') {
              onEmailSubscribedChange(value === 'subscribed');
            }
          }}
        />
        <Aside.Item
          type="status"
          label="SMS"
          status={smsSubscribed ? 'active' : 'inactive'}
          value={smsSubscribed ? 'subscribed' : 'not-subscribed'}
          options={customerSmsSubscriptionOptions}
          onValueChange={(value) => {
            if (typeof value === 'string') {
              onSmsSubscribedChange(value === 'subscribed');
            }
          }}
        />
        <Aside.Item
          type="select"
          label="Add tags"
          icon="Hashtag"
          value={tag}
          options={customerTagOptions}
          onValueChange={(value) => {
            if (typeof value === 'string') onTagChange(value);
          }}
        />
        <Aside.Item
          type="select"
          label="Add notes"
          icon="Pen"
          value={note}
          options={customerNoteOptions}
          onValueChange={(value) => {
            if (typeof value === 'string') onNoteChange(value);
          }}
        />
      </Aside.Group>

      <Aside.Group heading="Metrics">
        <Aside.Item
          type="metric"
          title="Total spend"
          metric={totalSpent}
          prefix="$"
          animated
          sparkline={{
            data: [6, 7, 5, 8, 6, 7],
            label: -4,
            suffix: '%',
            animated: true,
          }}
        />
        <Aside.Item type="info" spaceBetween>
          <span>Customer since</span>
          <span className="font-medium">
            <AnimatedNumber animated metric={customer.customerSinceDays} /> days
          </span>
        </Aside.Item>
        <Aside.Item type="info" spaceBetween>
          <span>RFM group</span>
          <span className="font-medium">{segment || 'Promising'}</span>
        </Aside.Item>
      </Aside.Group>

      <Aside.Group heading="Timeline">
        <Aside.Timeline events={timelineEvents} />
      </Aside.Group>
    </Aside.Root>
  );
}
