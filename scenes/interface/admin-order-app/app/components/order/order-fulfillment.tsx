import { currentStore } from '~/data/stores';
import { Badge } from '~/ui/components/badge/badge';
import { Button } from '~/ui/components/button/button';
import { Icon, type IconName } from '~/ui/components/icon/icon';
import { Image } from '~/ui/components/image/image';
import { Menu } from '~/ui/components/menu/menu';
import { Section } from '~/ui/components/section/section';
import * as Table from '~/ui/components/table/table';
import type { OrderDetailLineItem } from '~/data/order-line-items';
import type { Order, OrderFulfillmentStatus } from '~/data/orders';
import { fulfillmentStatusVariant } from './order-status';

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatPlacedAtDate(placedAt: string) {
  const [, day, month] = placedAt.match(/^(\d{1,2}) ([A-Za-z]{3})/) ?? [];

  if (!day || !month) return placedAt;

  return `${month} ${day}, 2026`;
}

function getFulfillmentId(order: Order, fulfillmentIndex = 0) {
  const orderNumber = Number(order.orderNumber.replace(/\D/g, ''));

  if (!Number.isFinite(orderNumber)) {
    return `${order.orderNumber}-F${fulfillmentIndex + 1}`;
  }

  return `#${orderNumber + 214}-F${fulfillmentIndex + 1}`;
}

function isShippedOrder(order?: Order): order is Order {
  return (
    order !== undefined &&
    order.deliveryMethod !== 'Pickup in store' &&
    order.deliveryMethod !== 'Gift card'
  );
}

function isPickupOrder(order?: Order): order is Order {
  return order !== undefined && order.deliveryMethod === 'Pickup in store';
}

function isGiftCardOrder(order?: Order): order is Order {
  return order !== undefined && order.deliveryMethod === 'Gift card';
}

type FulfillmentType = 'gift-card' | 'pickup' | 'shipping';

type FulfillmentMenuAction = {
  label: string;
  tone?: 'destructive';
};

type FulfillmentHeaderButton = {
  href?: string;
  label: string;
  prefixIconName?: IconName;
  variant: 'primary' | 'secondary';
};

type FulfillmentSummaryDetail = {
  iconName: IconName;
  primaryText?: string;
  secondaryText: string;
};

type FulfillmentSummaryPresentation = {
  badgeIconName: IconName;
  badgeLabel: string;
  badgeVariant: ReturnType<typeof fulfillmentStatusVariant>;
  detail?: FulfillmentSummaryDetail;
};

type FulfillmentPresentation = {
  buttons: FulfillmentHeaderButton[];
  isFulfilled: boolean;
  menuActions: FulfillmentMenuAction[];
  showTrackingCard: boolean;
  summary?: FulfillmentSummaryPresentation;
  type: FulfillmentType;
};

function FulfillmentLineItemImage({
  lineItem,
}: {
  lineItem: OrderDetailLineItem;
}) {
  if (lineItem.product?.id === 'gift-card') {
    return (
      <Image
        src={currentStore.logo}
        alt={currentStore.name}
        size={40}
        borderRadius="lg"
        shadow="sm"
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <Image
      src={lineItem.product?.images[0] ?? ''}
      alt={lineItem.product?.title}
      size={40}
      borderRadius="lg"
      shadow="sm"
      loading="lazy"
      decoding="async"
    />
  );
}

function getFulfillmentPresentation({
  fulfillmentLocation,
  fulfillmentStatus,
  itemCount,
  order,
  orderId,
}: {
  fulfillmentLocation?: string;
  fulfillmentStatus?: OrderFulfillmentStatus;
  itemCount: number;
  order?: Order;
  orderId: string;
}): FulfillmentPresentation {
  if (!order || !fulfillmentStatus) {
    return {
      buttons: [],
      isFulfilled: false,
      menuActions: [],
      showTrackingCard: false,
      type: 'shipping',
    };
  }

  const shippedOrder = isShippedOrder(order);
  const pickupOrder = isPickupOrder(order);
  const giftCardOrder = isGiftCardOrder(order);
  const type: FulfillmentType = giftCardOrder
    ? 'gift-card'
    : pickupOrder
      ? 'pickup'
      : 'shipping';
  const isFulfilled = fulfillmentStatus === 'Fulfilled';
  const isUnfulfilled = fulfillmentStatus === 'Unfulfilled';
  const paidOrder = order.paymentStatus === 'Paid';
  const inTransitOrder = order.deliveryStatus === 'In transit';
  const deliveredOrder = order.deliveryStatus === 'Delivered';
  const trackingAddedOrder = order.deliveryStatus === 'Tracking added';
  const seededHeaderActions = order.fulfillmentHeaderActions ?? [];
  const showShippingActions = shippedOrder && paidOrder && isUnfulfilled;
  const showPickupAction =
    paidOrder && fulfillmentStatus === 'Ready for pickup';
  const showGiftCardActions = giftCardOrder && paidOrder && isUnfulfilled;
  const showResendGiftCardAction = isFulfilled && giftCardOrder;
  const showFulfilledActions = isFulfilled && !giftCardOrder;
  const showMarkAsDeliveredAction =
    showFulfilledActions &&
    (inTransitOrder ||
      seededHeaderActions.includes('mark-as-delivered') ||
      (shippedOrder && trackingAddedOrder));
  const showAddTrackingAction =
    showFulfilledActions && seededHeaderActions.includes('add-tracking');
  const useShippedSummaryLabel =
    (showMarkAsDeliveredAction && !showAddTrackingAction) || trackingAddedOrder;
  const placedAtDate = formatPlacedAtDate(order.placedAt);
  const menuActions: FulfillmentMenuAction[] = [];
  const buttons: FulfillmentHeaderButton[] = [];

  if (showShippingActions) {
    menuActions.push(
      { label: 'Change location' },
      { label: 'Split fulfillment' },
    );
    buttons.push(
      { label: 'Mark as fulfilled', variant: 'secondary' },
      {
        href: `/store/orders/${orderId}/create-shipping-label`,
        label: 'Create shipping label',
        variant: 'primary',
      },
    );
  }

  if (showPickupAction) {
    buttons.push({ label: 'Mark as picked up', variant: 'primary' });
  }

  if (showGiftCardActions) {
    buttons.push({ label: 'Send gift card', variant: 'primary' });
  }

  if (showResendGiftCardAction) {
    buttons.push({ label: 'Resend gift card', variant: 'secondary' });
  }

  if (showFulfilledActions) {
    if (useShippedSummaryLabel) {
      menuActions.push({ label: 'Edit tracking' });
    }

    menuActions.push(
      { label: 'Print packing slip' },
      { label: 'Cancel fulfillment', tone: 'destructive' },
    );
  }

  if (showMarkAsDeliveredAction) {
    buttons.push({
      label: 'Mark as delivered',
      variant: showAddTrackingAction ? 'secondary' : 'primary',
    });
  }

  if (showAddTrackingAction) {
    buttons.push({
      label: 'Tracking',
      prefixIconName: 'Plus',
      variant: 'primary',
    });
  }

  const summaryIconName: IconName = isFulfilled
    ? 'CircleCheck'
    : giftCardOrder || pickupOrder
      ? 'PalletPackage'
      : 'TruckFast';
  let summaryDetail: FulfillmentSummaryDetail | undefined;

  if (giftCardOrder) {
    summaryDetail = isFulfilled
      ? {
          iconName: summaryIconName,
          primaryText: order.customerDetails.email,
          secondaryText: 'Gift card sent to',
        }
      : undefined;
  } else if (pickupOrder) {
    summaryDetail = {
      iconName: summaryIconName,
      primaryText: 'Toronto Flagship',
      secondaryText: isFulfilled
        ? `Picked up ${placedAtDate} from`
        : 'Pickup in store at',
    };
  } else {
    const shippingSummaryVerb = deliveredOrder
      ? 'Delivered'
      : useShippedSummaryLabel
        ? 'Shipped'
        : 'Fulfilled';

    summaryDetail = {
      iconName: summaryIconName,
      primaryText:
        deliveredOrder && isFulfilled
          ? undefined
          : (fulfillmentLocation ?? 'Ottawa Warehouse'),
      secondaryText: isFulfilled
        ? `${shippingSummaryVerb} ${placedAtDate}${deliveredOrder ? '' : ' from'}`
        : 'Ship from',
    };
  }

  return {
    buttons,
    isFulfilled,
    menuActions,
    showTrackingCard:
      shippedOrder &&
      isFulfilled &&
      (useShippedSummaryLabel || trackingAddedOrder || deliveredOrder),
    summary: {
      badgeIconName: 'PalletPackage',
      badgeLabel: isFulfilled
        ? fulfillmentStatus
        : `${fulfillmentStatus} (${itemCount})`,
      badgeVariant: fulfillmentStatusVariant(fulfillmentStatus),
      detail: summaryDetail,
    },
    type,
  };
}

export function OrderFulfillment({
  fulfillmentCount = 1,
  fulfillmentIndex = 0,
  fulfillmentLocation,
  fulfillmentStatus: fulfillmentStatusOverride,
  order,
  orderId,
  lineItems,
}: {
  fulfillmentCount?: number;
  fulfillmentIndex?: number;
  fulfillmentLocation?: string;
  fulfillmentStatus?: OrderFulfillmentStatus;
  order?: Order;
  orderId: string;
  lineItems: OrderDetailLineItem[];
}) {
  const fulfillmentStatus =
    fulfillmentStatusOverride ?? order?.fulfillmentStatus;
  const fulfillmentItemCount = lineItems.reduce(
    (total, lineItem) => total + lineItem.quantity,
    0,
  );
  const presentation = getFulfillmentPresentation({
    fulfillmentLocation,
    fulfillmentStatus,
    itemCount: fulfillmentItemCount,
    order,
    orderId,
  });
  const hasFulfillmentActions =
    presentation.menuActions.length > 0 || presentation.buttons.length > 0;
  const isSplitFulfillment = fulfillmentCount > 1;
  const titleDetail =
    presentation.isFulfilled && order
      ? getFulfillmentId(order, fulfillmentIndex)
      : isSplitFulfillment
        ? `#${fulfillmentIndex + 1}`
        : undefined;
  const title = titleDetail ? (
    <span className="inline-flex items-baseline gap-2">
      <span>Fulfillment</span>
      <span className="text-lg text-secondary">{titleDetail}</span>
    </span>
  ) : (
    'Fulfillment'
  );

  return (
    <div className="flex flex-col gap-3">
      <Section
        layerId={`fulfillment-${fulfillmentIndex}`}
        title={title}
        action={
          hasFulfillmentActions && (
            <FulfillmentActions
              buttons={presentation.buttons}
              menuActions={presentation.menuActions}
            />
          )
        }
        bleed
      >
        <div className="p-3">
          {presentation.summary && (
            <>
              <FulfillmentSummary summary={presentation.summary} />
              <hr className="mx-2 mt-2 border-border" />
            </>
          )}
          <div className="pr-1">
            <Table.Root stickyHeader={false}>
              <Table.Body>
                {lineItems.map((lineItem, index) => (
                  <Table.Row key={lineItem.id}>
                    <Table.Cell
                      className={
                        index > 0
                          ? "relative before:absolute before:-top-px before:left-0 before:h-px before:w-15.5 before:bg-background before:content-['']"
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-3">
                        <FulfillmentLineItemImage lineItem={lineItem} />
                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-foreground">
                            {lineItem.product?.title ?? 'Unknown product'}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge>
                              <span className="text-muted-foreground">
                                {lineItem.variantTitle}
                              </span>
                              <span className="ml-1 font-book text-primary">
                                {lineItem.variantOption}
                              </span>
                            </Badge>
                            {lineItem.sku ? (
                              <Badge>
                                <span className="text-muted-foreground">
                                  SKU
                                </span>
                                <span className="ml-1 font-book text-primary">
                                  {lineItem.sku}
                                </span>
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-right tabular-nums">
                      {formatCurrency(lineItem.unitPrice)}
                      <span className="px-1.5 pr-2 text-muted-foreground">
                        ×
                      </span>
                      <Badge>{lineItem.quantity}</Badge>
                    </Table.Cell>
                    <Table.Cell className="pr-0 text-right tabular-nums">
                      {formatCurrency(lineItem.unitPrice * lineItem.quantity)}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </div>
        </div>
      </Section>
      {presentation.showTrackingCard ? <FulfillmentTrackingCard /> : null}
    </div>
  );
}

function FulfillmentActions({
  buttons,
  menuActions,
}: {
  buttons: FulfillmentHeaderButton[];
  menuActions: FulfillmentMenuAction[];
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {menuActions.length > 0 ? (
        <Menu
          align="end"
          trigger={
            <Button
              onClick={() => {}}
              aria-label="More fulfillment actions"
              size="icon"
              type="button"
              variant="plain"
            >
              <Icon name="Dots" />
            </Button>
          }
          options={menuActions.map((action) => ({
            label:
              action.tone === 'destructive' ? (
                <span className="text-destructive-foreground">
                  {action.label}
                </span>
              ) : (
                action.label
              ),
            onSelect: () => {},
          }))}
        />
      ) : null}
      {buttons.map((button) => (
        <Button
          key={button.label}
          href={button.href}
          prefix={
            button.prefixIconName ? (
              <Icon name={button.prefixIconName} />
            ) : undefined
          }
          variant={button.variant}
          type="button"
          onClick={button.href ? undefined : () => {}}
        >
          {button.label}
        </Button>
      ))}
    </div>
  );
}

function FulfillmentTrackingCard() {
  return (
    <div className="rounded-3xl bg-background shadow-sm">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#e21b2d]">
            <img
              src="/images/carriers/ups.svg"
              alt=""
              className="size-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </span>
          <p className="font-medium">UPS Ground</p>
        </div>
        <span className="shrink-0 font-medium tabular-nums">1770943315184</span>
      </div>
    </div>
  );
}

function FulfillmentSummary({
  summary,
}: {
  summary: FulfillmentSummaryPresentation;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-2 py-1">
      <Badge variant={summary.badgeVariant} iconName={summary.badgeIconName}>
        {summary.badgeLabel}
      </Badge>
      {summary.detail ? (
        <div className="flex items-center gap-1">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-lg">
            <Icon name={summary.detail.iconName} size={16} aria-hidden />
          </div>
          <div className="text-md flex flex-wrap items-center gap-x-1 font-medium">
            <span className="text-secondary">
              {summary.detail.secondaryText}
            </span>
            {summary.detail.primaryText ? (
              <span className="text-primary">{summary.detail.primaryText}</span>
            ) : null}
          </div>
        </div>
      ) : (
        <div aria-hidden className="size-6 shrink-0" />
      )}
    </div>
  );
}
