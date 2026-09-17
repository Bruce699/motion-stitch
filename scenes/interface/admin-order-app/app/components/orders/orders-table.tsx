import { useState } from 'react';
import type {
  OrderDeliveryStatus,
  OrderFulfillmentStatus,
  OrderPaymentStatus,
} from '~/data/orders';
import { getCustomer } from '~/data/customers';
import { orders } from '~/data/orders';
import { Badge, Checkbox, Icon, SearchBar, Table } from '~/ui';
import { clsx } from 'clsx';

function itemCountLabel(itemCount: number) {
  return `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;
}

function deliveryMethodLabel(deliveryMethod: string) {
  if (deliveryMethod === 'Gift card') return 'Shipping not required';
  if (deliveryMethod === 'Pickup in store' || deliveryMethod === 'In store') {
    return deliveryMethod;
  }

  return 'UPS Ground';
}

function paymentStatusVariant(status: OrderPaymentStatus) {
  if (status === 'Payment pending') return 'caution';

  return 'default';
}

function fulfillmentStatusVariant(status: OrderFulfillmentStatus) {
  if (status === 'Partially fulfilled') return 'caution';
  if (status === 'Unfulfilled') return 'caution';
  if (status === 'Ready for pickup') return 'info';

  return 'default';
}

function deliveryStatusVariant(status: OrderDeliveryStatus) {
  if (status === 'In transit') return 'info';

  return 'default';
}

function isOrderComplete(order: (typeof orders)[number]) {
  return (
    order.paymentStatus !== 'Payment pending' &&
    order.fulfillmentStatus === 'Fulfilled'
  );
}

export function OrdersTable() {
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(
    () => new Set(),
  );
  const hasSelectedOrders = selectedOrderIds.size > 0;
  const allOrdersSelected = selectedOrderIds.size === orders.length;
  const someOrdersSelected = hasSelectedOrders && !allOrdersSelected;

  function setAllOrdersSelected(checked: boolean) {
    setSelectedOrderIds(
      checked ? new Set(orders.map((order) => order.id)) : new Set(),
    );
  }

  function setOrderSelected(orderId: string, checked: boolean) {
    setSelectedOrderIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (checked) {
        nextIds.add(orderId);
      } else {
        nextIds.delete(orderId);
      }

      return nextIds;
    });
  }

  return (
    <section>
      <div className="flex flex-col gap-3">
        <SearchBar
          aria-label="Search orders"
          className="mx-3"
          placeholder="Search and filter"
        />

        <Table.Root bleed dense stickyHeader={false}>
          <Table.Head>
            <Table.Row>
              <Table.Header type="checkbox">
                <Checkbox.Root
                  aria-label="Select all orders"
                  aria-checked={someOrdersSelected ? 'mixed' : undefined}
                  checked={hasSelectedOrders}
                  onCheckedChange={() =>
                    setAllOrdersSelected(!allOrdersSelected)
                  }
                >
                  <Checkbox.Indicator
                    variant={someOrdersSelected ? 'indeterminate' : 'check'}
                  />
                </Checkbox.Root>
              </Table.Header>
              <Table.Header>Order</Table.Header>
              <Table.Header aria-label="Risk" className="w-px" />
              <Table.Header>
                <span className="inline-flex items-center gap-1">
                  Date
                  <Icon name="ChevronDown" size={12} />
                </span>
              </Table.Header>
              <Table.Header>Customer</Table.Header>
              <Table.Header className="text-right">Total</Table.Header>
              <Table.Header type="picker">Payment status</Table.Header>
              <Table.Header type="picker">Fulfillment status</Table.Header>
              <Table.Header>Items</Table.Header>
              <Table.Header type="picker">Delivery status</Table.Header>
              <Table.Header>Delivery method</Table.Header>
              <Table.Header>Tags</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {orders.map((order) => {
              const customer = getCustomer(order.customerId);

              return (
                <Table.Row
                  key={order.id}
                  href={`/store/orders/${order.id}`}
                  muted={isOrderComplete(order)}
                  title={order.orderNumber}
                >
                  <Table.Cell type="checkbox">
                    <Checkbox.Root
                      aria-label={`Select ${order.orderNumber}`}
                      checked={selectedOrderIds.has(order.id)}
                      onCheckedChange={(checked) =>
                        setOrderSelected(order.id, checked === true)
                      }
                    >
                      <Checkbox.Indicator />
                    </Checkbox.Root>
                  </Table.Cell>
                  <Table.Cell link>
                    <span className="font-medium text-foreground">
                      {order.orderNumber}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="w-px">
                    {order.hasRisk ? (
                      <span className="text-red-600" aria-label="Order risk">
                        <Icon name="TriangleWarning" size={14} />
                      </span>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell>{order.placedAt}</Table.Cell>
                  <Table.Cell
                    preview={
                      customer
                        ? { type: 'customer', resource: customer }
                        : undefined
                    }
                  >
                    {order.customer}
                  </Table.Cell>
                  <Table.Cell className="text-right">{order.total}</Table.Cell>
                  <Table.Cell type="picker">
                    <Badge
                      variant={paymentStatusVariant(order.paymentStatus)}
                      className={clsx(
                        'gap-1',
                        paymentStatusVariant(order.paymentStatus) ===
                          'default' &&
                          'border-transparent bg-gray-100 text-gray-600 shadow-none',
                      )}
                    >
                      {order.paymentStatus}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell type="picker">
                    <Badge
                      variant={fulfillmentStatusVariant(
                        order.fulfillmentStatus,
                      )}
                      className={clsx(
                        'gap-1',
                        fulfillmentStatusVariant(order.fulfillmentStatus) ===
                          'default' &&
                          'border-transparent bg-gray-100 text-gray-600 shadow-none',
                      )}
                    >
                      {order.fulfillmentStatus}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{itemCountLabel(order.itemCount)}</Table.Cell>
                  <Table.Cell
                    type={order.deliveryStatus ? 'picker' : undefined}
                  >
                    {order.deliveryStatus ? (
                      <Badge
                        variant={deliveryStatusVariant(order.deliveryStatus)}
                        className={clsx(
                          'gap-1',
                          deliveryStatusVariant(order.deliveryStatus) ===
                            'default' &&
                            'border-transparent bg-gray-100 text-gray-600 shadow-none',
                        )}
                      >
                        {order.deliveryStatus}
                      </Badge>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell>
                    {deliveryMethodLabel(order.deliveryMethod)}
                  </Table.Cell>
                  <Table.Cell>{order.tags.join(', ')}</Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </div>
    </section>
  );
}
