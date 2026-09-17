import type { Order } from '~/data/orders';
import { products } from '~/data/products';
import {
  fulfillmentStatusVariant,
  paymentStatusVariant,
} from '~/components/order/order-status';
import { Badge, Button, Icon, Image, Section, Table } from '~/ui';

const productsById = new Map(products.map((product) => [product.id, product]));

function itemCountLabel(itemCount: number) {
  return `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;
}

function getOrderImages(order: Order) {
  return order.lineItems.slice(0, 2).map((lineItem) => {
    const product = productsById.get(lineItem.productId);

    return product?.images[0] ?? '';
  });
}

function OrderItemImages({ order }: { order: Order }) {
  const imageSources = getOrderImages(order);

  if (imageSources.length <= 1) {
    return (
      <Image
        src={imageSources[0] ?? ''}
        alt=""
        size={32}
        borderRadius="md"
        shadow="sm"
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div className="relative flex min-w-10 -space-x-2">
      {imageSources.map((imageSource, imageIndex) => (
        <div
          key={`${imageSource}-${imageIndex}`}
          className={
            imageIndex === 0
              ? 'z-2 ml-0.75 rotate-4'
              : 'absolute -top-0.25 -left-0.5 z-1 -rotate-8'
          }
        >
          <Image
            src={imageSource}
            alt=""
            size={32}
            borderRadius="md"
            shadow="sm"
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
    </div>
  );
}

export function CustomerOrders({
  customerName,
  orders,
}: {
  customerName: string;
  orders: Order[];
}) {
  return (
    <Section
      title={
        <span className="inline-flex items-baseline gap-2">
          <span>Orders</span>
          <span className="text-lg text-secondary">{orders.length}</span>
        </span>
      }
      action={
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {}}
            variant="secondary"
            type="button"
            prefix={<Icon name="Sorting" />}
            suffix={
              <span className="text-muted-foreground">
                <Icon name="ChevronExpandY" size={14} />
              </span>
            }
          >
            Latest
          </Button>
          <Button
            onClick={() => {}}
            variant="secondary"
            type="button"
            prefix={<Icon name="Plus" />}
          >
            Order
          </Button>
        </div>
      }
      bleed
    >
      <div className="p-2">
        <Table.Root stickyHeader={false}>
          <Table.Body>
            {orders.map((order) => (
              <Table.Row
                key={order.id}
                href={`/store/orders/${order.id}`}
                title={order.orderNumber}
              >
                <Table.Cell link>
                  <div className="flex items-center gap-3">
                    <OrderItemImages order={order} />
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {order.orderNumber}
                      </span>
                      <span className="text-sm text-secondary">
                        {order.placedAt}
                      </span>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>{itemCountLabel(order.itemCount)}</Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      iconName="InvoiceIn"
                      variant={paymentStatusVariant(order.paymentStatus)}
                    >
                      {order.paymentStatus}
                    </Badge>
                    <Badge
                      iconName="PalletPackage"
                      variant={fulfillmentStatusVariant(
                        order.fulfillmentStatus,
                      )}
                    >
                      {order.fulfillmentStatus}
                    </Badge>
                  </div>
                </Table.Cell>
                <Table.Cell className="text-right">{order.total}</Table.Cell>
              </Table.Row>
            ))}
            {orders.length === 0 ? (
              <Table.Row>
                <Table.Cell>
                  <span className="text-secondary">
                    {customerName} has not placed any orders yet.
                  </span>
                </Table.Cell>
              </Table.Row>
            ) : null}
          </Table.Body>
        </Table.Root>
      </div>
    </Section>
  );
}
