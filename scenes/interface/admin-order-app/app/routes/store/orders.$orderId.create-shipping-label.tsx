import { useParams } from 'react-router';
import { MainContentLayout } from '~/components/main-content-layout';
import { CreateShippingLabelAside } from '~/components/order/create-shipping-label-aside';
import { CreateShippingLabelToolbar } from '~/components/order/create-shipping-label-toolbar';
import { CreateShippingLabelItems } from '~/components/order/create-shipping-label-items';
import { CreateShippingLabelPackage } from '~/components/order/create-shipping-label-package';
import { CreateShippingLabelRecipient } from '~/components/order/create-shipping-label-recipient';
import { CreateShippingLabelCarriers } from '~/components/order/create-shipping-label-carriers';
import { getOrderLineItems } from '~/data/order-line-items';
import { orders } from '~/data/orders';

function getOrder(orderId: string) {
  return orders.find((item) => item.id === orderId) ?? orders[0];
}

export default function CreateShippingLabelPage() {
  const { orderId = '' } = useParams();
  const order = getOrder(orderId);
  const title = order.orderNumber;
  const lineItems = getOrderLineItems(order);

  return (
    <>
      <CreateShippingLabelToolbar orderId={order.id} title={title} />
      <MainContentLayout aside={<CreateShippingLabelAside />}>
        <div className="flex flex-col gap-8">
          <h1 data-breadcrumb-title-target className="text-3xl font-medium">
            Create shipping label
          </h1>
          <CreateShippingLabelRecipient order={order} />
          <CreateShippingLabelItems lineItems={lineItems} />
          <CreateShippingLabelPackage />
          <CreateShippingLabelCarriers />
        </div>
      </MainContentLayout>
    </>
  );
}
