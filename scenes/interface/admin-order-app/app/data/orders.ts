import {
  customers,
  getCustomer,
  type Customer,
  type CustomerCoordinates,
} from './customers';
import { products } from './products';
import { staffMembers, type StaffMember } from './staff-members';

export type OrderPaymentStatus = 'Paid' | 'Payment pending' | 'Refunded';

export type OrderFulfillmentStatus =
  | 'Fulfilled'
  | 'Partially fulfilled'
  | 'Unfulfilled'
  | 'Ready for pickup';

export type OrderDeliveryStatus = 'Delivered' | 'In transit' | 'Tracking added';

export type OrderLineItemWeight = {
  value: string;
  prefix: string;
};

type OrderLineItem = {
  productId: string;
  quantity: number;
  weight: OrderLineItemWeight;
};

export type OrderFulfillmentGroup = {
  fulfillmentStatus?: OrderFulfillmentStatus;
  id: string;
  lineItemIndexes: number[];
  locationName?: string;
};

export type OrderFulfillmentHeaderAction = 'add-tracking' | 'mark-as-delivered';

export type OrderPaymentSummary = {
  subtotal: {
    detail: string;
    value: string;
  };
  discount: {
    code: string;
    value: string;
  };
  shipping: {
    method: string;
    value: string;
  };
  total: string;
  shopCash: string;
  cardLast4: string;
  cardTotal: string;
};

type OrderCustomerDetails = {
  address: string;
  coordinates: CustomerCoordinates;
  email: string;
  phone: string;
  orderCount: number;
};

type OrderRiskLevel = 'Low' | 'Medium' | 'High';

export type OrderRisk = {
  level: OrderRiskLevel;
  description: string;
};

export type OrderTimelineEvent = {
  date: string;
  staffMember: StaffMember;
  body: string;
  time: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  placedAt: string;
  source: string;
  customerId: string;
  customer: string;
  total: string;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  itemCount: number;
  deliveryStatus?: OrderDeliveryStatus;
  deliveryMethod: string;
  fulfillmentHeaderActions?: OrderFulfillmentHeaderAction[];
  fulfillmentGroups?: OrderFulfillmentGroup[];
  giftCardValue?: string;
  lineItems: OrderLineItem[];
  payment: OrderPaymentSummary;
  customerDetails: OrderCustomerDetails;
  risk: OrderRisk;
  timelineEvents: OrderTimelineEvent[];
  tags: string[];
  customerNote?: string;
  hasRisk?: boolean;
};

const orderProductIds = products.map((product) => product.id);
const orderLineItemWeights: OrderLineItemWeight[] = [
  { value: '2.5', prefix: 'kg' },
  { value: '0.5', prefix: 'kg' },
  { value: '0.3', prefix: 'kg' },
  { value: '0.2', prefix: 'kg' },
];
const productsById = new Map(products.map((product) => [product.id, product]));
const fallbackCustomer = customers[0] as Customer;

function parseMoney(value: string) {
  return Number(value.replace(/[^0-9.]/g, '')) || 0;
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function buildOrderLineItems(
  orderIndex: number,
  itemCount: number,
): OrderLineItem[] {
  return Array.from({ length: itemCount }, (_, itemIndex) => ({
    productId:
      orderProductIds[(orderIndex + itemIndex) % orderProductIds.length],
    quantity: 1,
    weight: orderLineItemWeights[itemIndex % orderLineItemWeights.length],
  }));
}

function buildOrderPayment(
  order: Omit<
    Order,
    | 'customerDetails'
    | 'lineItems'
    | 'payment'
    | 'risk'
    | 'source'
    | 'timelineEvents'
  >,
  lineItems: OrderLineItem[],
): OrderPaymentSummary {
  const itemCount = lineItems.reduce(
    (total, lineItem) => total + lineItem.quantity,
    0,
  );
  const isGiftCard = order.deliveryMethod === 'Gift card';
  const giftCardValue = parseMoney(order.giftCardValue ?? '$100.00');
  const subtotal = isGiftCard
    ? itemCount * giftCardValue
    : lineItems.reduce((total, lineItem, index) => {
        const product = productsById.get(lineItem.productId);
        const variant =
          product?.variants[index % (product.variants.length || 1)];

        return total + parseMoney(variant?.price ?? '$0') * lineItem.quantity;
      }, 0);
  const discount = subtotal > 0 && !isGiftCard ? 30 : 0;
  const shipping =
    order.deliveryMethod.includes('Pickup') ||
    order.deliveryMethod === 'Gift card'
      ? 0
      : 4.99;
  const total = Math.max(subtotal - discount + shipping, 0);
  const shopCash = 50;

  return {
    subtotal: {
      detail: `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`,
      value: formatCurrency(subtotal),
    },
    discount: {
      code: '10OFF',
      value: `- ${formatCurrency(discount)}`,
    },
    shipping: {
      method: order.deliveryMethod,
      value: formatCurrency(shipping),
    },
    total: formatCurrency(total),
    shopCash: formatCurrency(shopCash),
    cardLast4: '0029',
    cardTotal: formatCurrency(Math.max(total - shopCash, 0)),
  };
}

function buildCustomerDetails(customer: Customer): OrderCustomerDetails {
  return {
    address: customer.address,
    coordinates: customer.coordinates,
    email: customer.email,
    phone: customer.phone,
    orderCount: customer.orderCount,
  };
}

function buildRisk(level: OrderRiskLevel): OrderRisk {
  if (level === 'High') {
    return {
      level,
      description:
        'High chargeback risk. Review payment and customer details before fulfillment.',
    };
  }

  if (level === 'Medium') {
    return {
      level,
      description:
        'Medium chargeback risk. Verify the order details before fulfillment.',
    };
  }

  return {
    level,
    description: 'Low chargeback risk. You can fulfill this order.',
  };
}

function getRiskLevel(order: OrderRecord, orderIndex: number): OrderRiskLevel {
  if (order.riskLevel) return order.riskLevel;
  if (order.hasRisk) return 'High';
  if (orderIndex % 6 === 1 || orderIndex % 11 === 4) return 'Medium';

  return 'Low';
}

function buildTimelineEvents(): OrderTimelineEvent[] {
  return [
    {
      date: 'July 19, 2025',
      staffMember: staffMembers[0],
      body: 'Customer asked to hold the shipment until next week.',
      time: '1:36pm',
    },
    {
      date: 'July 17, 2025',
      staffMember: staffMembers[1],
      body: 'Shipping address was updated after customer confirmation.',
      time: '10:38am',
    },
    {
      date: 'July 16, 2025',
      staffMember: staffMembers[2],
      body: 'Payment was captured and the order was cleared for processing.',
      time: '4:12pm',
    },
  ];
}

type OrderRecord = Omit<
  Order,
  | 'customerDetails'
  | 'customer'
  | 'lineItems'
  | 'payment'
  | 'risk'
  | 'source'
  | 'timelineEvents'
> & {
  riskLevel?: OrderRiskLevel;
};

const orderRecords: OrderRecord[] = [
  {
    id: '1401',
    orderNumber: '#1401',
    placedAt: 'Today at 11:54',
    customerId: 'milo-hart',
    total: '$58,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Unfulfilled',
    itemCount: 2,
    deliveryMethod: 'Free Shipping',
    tags: [],
    customerNote:
      "Please delay shipping 2 days as I'm out on holiday and unable to retrieve the package. Thanks!",
    hasRisk: true,
  },
  {
    id: '1400',
    orderNumber: '#1400',
    placedAt: 'Today at 11:13',
    customerId: 'nora-finch',
    total: '$100.00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Unfulfilled',
    itemCount: 1,
    deliveryMethod: 'Gift card',
    giftCardValue: '$100.00',
    tags: [],
  },
  {
    id: '1399',
    orderNumber: '#1399',
    placedAt: 'Today at 9:15',
    customerId: 'ari-vale',
    total: '$87,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Unfulfilled',
    itemCount: 3,
    deliveryMethod: 'Shipping',
    fulfillmentGroups: [
      { id: '1399-1', lineItemIndexes: [0], locationName: 'Toronto Flagship' },
      {
        id: '1399-2',
        lineItemIndexes: [1, 2],
        locationName: 'Ottawa Warehouse',
      },
    ],
    tags: [],
    hasRisk: true,
  },
  {
    id: '1398',
    orderNumber: '#1398',
    placedAt: '26 Apr at 13:22',
    customerId: 'lina-park',
    total: '$67,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Partially fulfilled',
    itemCount: 3,
    deliveryStatus: 'Tracking added',
    deliveryMethod: 'Free Shipping',
    fulfillmentGroups: [
      {
        fulfillmentStatus: 'Fulfilled',
        id: '1398-1',
        lineItemIndexes: [0, 1],
        locationName: 'Toronto Flagship',
      },
      {
        fulfillmentStatus: 'Unfulfilled',
        id: '1398-2',
        lineItemIndexes: [2],
        locationName: 'Ottawa Warehouse',
      },
    ],
    tags: [],
  },
  {
    id: '1397',
    orderNumber: '#1397',
    placedAt: '24 Apr at 22:47',
    customerId: 'theo-stone',
    total: '$816,00',
    paymentStatus: 'Payment pending',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 5,
    deliveryMethod: 'Shipping',
    fulfillmentHeaderActions: ['mark-as-delivered', 'add-tracking'],
    tags: ['Priority'],
  },
  {
    id: '1396',
    orderNumber: '#1396',
    placedAt: '24 Apr at 8:31',
    customerId: 'maren-fox',
    total: '$29,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Ready for pickup',
    itemCount: 1,
    deliveryMethod: 'Pickup in store',
    tags: [],
  },
  {
    id: '1395',
    orderNumber: '#1395',
    placedAt: '18 Apr at 21:05',
    customerId: 'iris-reed',
    total: '$0,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 2,
    deliveryStatus: 'Delivered',
    deliveryMethod: 'Shipping',
    tags: [],
  },
  {
    id: '1394',
    orderNumber: '#1394',
    placedAt: '11 Apr at 5:32',
    customerId: 'iris-reed',
    total: '$88,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 4,
    deliveryMethod: 'Free Shipping',
    fulfillmentHeaderActions: ['mark-as-delivered', 'add-tracking'],
    tags: [],
  },
  {
    id: '1393',
    orderNumber: '#1393',
    placedAt: '4 Apr at 11:52',
    customerId: 'sofia-lane',
    total: '$57,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 3,
    deliveryMethod: 'Pickup in store',
    tags: [],
  },
  {
    id: '1392',
    orderNumber: '#1392',
    placedAt: '29 Mar at 21:17',
    customerId: 'omar-bell',
    total: '$38,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 2,
    deliveryMethod: 'Pickup in store',
    tags: [],
  },
  {
    id: '1391',
    orderNumber: '#1391',
    placedAt: '24 Mar at 14:47',
    customerId: 'evan-brooks',
    total: '$50.00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 1,
    deliveryMethod: 'Gift card',
    giftCardValue: '$50.00',
    tags: [],
  },
  {
    id: '1390',
    orderNumber: '#1390',
    placedAt: '24 Mar at 14:45',
    customerId: 'evan-brooks',
    total: '$73,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 3,
    deliveryMethod: 'Pickup in store',
    tags: [],
  },
  {
    id: '1389',
    orderNumber: '#1389',
    placedAt: '19 Mar at 19:50',
    customerId: 'caleb-moss',
    total: '$23,36',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 1,
    deliveryStatus: 'In transit',
    deliveryMethod: 'Canada Flat Rate',
    tags: [],
  },
  {
    id: '1388',
    orderNumber: '#1388',
    placedAt: '11 Mar at 18:27',
    customerId: 'riley-cole',
    total: '$29,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 1,
    deliveryMethod: 'Pickup in store',
    tags: [],
  },
  {
    id: '1387',
    orderNumber: '#1387',
    placedAt: '10 Mar at 10:43',
    customerId: 'parker-quinn',
    total: '$61,11',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 3,
    deliveryStatus: 'Delivered',
    deliveryMethod: 'Free Shipping',
    riskLevel: 'Medium',
    fulfillmentGroups: [
      { id: '1387-1', lineItemIndexes: [0], locationName: 'Toronto Flagship' },
      {
        id: '1387-2',
        lineItemIndexes: [1, 2],
        locationName: 'Ottawa Warehouse',
      },
    ],
    tags: [],
  },
  {
    id: '1386',
    orderNumber: '#1386',
    placedAt: '7 Mar at 15:42',
    customerId: 'june-avery',
    total: '$48,95',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 2,
    deliveryStatus: 'Tracking added',
    deliveryMethod: 'Canada Flat Rate',
    tags: [],
  },
  {
    id: '1385',
    orderNumber: '#1385',
    placedAt: '3 Mar at 7:49',
    customerId: 'maya-rivers',
    total: '$29,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 1,
    deliveryMethod: 'Pickup in store',
    riskLevel: 'Medium',
    tags: [],
  },
  {
    id: '1384',
    orderNumber: '#1384',
    placedAt: '2 Mar at 10:28',
    customerId: 'june-avery',
    total: '$250.00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 1,
    deliveryMethod: 'Gift card',
    giftCardValue: '$250.00',
    tags: [],
  },
  {
    id: '1383',
    orderNumber: '#1383',
    placedAt: '27 Feb at 10:40',
    customerId: 'iris-reed',
    total: '$61,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 3,
    deliveryStatus: 'Tracking added',
    deliveryMethod: 'Free Shipping',
    tags: [],
  },
  {
    id: '1382',
    orderNumber: '#1382',
    placedAt: '10 Feb at 19:52',
    customerId: 'samir-west',
    total: '$0,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 2,
    deliveryStatus: 'Tracking added',
    deliveryMethod: 'Shipping',
    tags: [],
  },
  {
    id: '1381',
    orderNumber: '#1381',
    placedAt: '10 Feb at 18:56',
    customerId: 'alden-pierce',
    total: '$35,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 1,
    deliveryMethod: 'Pickup in store',
    tags: [],
  },
  {
    id: '1380',
    orderNumber: '#1380',
    placedAt: '5 Feb at 10:50',
    customerId: 'tessa-bloom',
    total: '$14,25',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 1,
    deliveryMethod: 'Pickup in store',
    tags: [],
  },
  {
    id: '1379',
    orderNumber: '#1379',
    placedAt: '1 Feb at 9:43',
    customerId: 'mateo-cruz',
    total: '$19,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 1,
    deliveryMethod: 'Pickup in store',
    tags: [],
  },
  {
    id: '1378',
    orderNumber: '#1378',
    placedAt: '1 Feb at 9:21',
    customerId: 'samir-west',
    total: '$102,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 4,
    deliveryStatus: 'Tracking added',
    deliveryMethod: 'Free Shipping',
    fulfillmentGroups: [
      {
        id: '1378-1',
        lineItemIndexes: [0, 1, 2],
        locationName: 'Toronto Flagship',
      },
      { id: '1378-2', lineItemIndexes: [3], locationName: 'Ottawa Warehouse' },
    ],
    tags: [],
  },
  {
    id: '1377',
    orderNumber: '#1377',
    placedAt: '26 Jan at 15:52',
    customerId: 'maya-rivers',
    total: '$29,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 1,
    deliveryMethod: 'Pickup in store',
    tags: [],
  },
  {
    id: '1376',
    orderNumber: '#1376',
    placedAt: '15 Jan at 20:50',
    customerId: 'elena-frost',
    total: '$62,40',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 4,
    deliveryStatus: 'Tracking added',
    deliveryMethod: 'Free Shipping',
    tags: [],
  },
  {
    id: '1375',
    orderNumber: '#1375',
    placedAt: '2 Jan at 21:27',
    customerId: 'miles-archer',
    total: '$38,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 2,
    deliveryMethod: 'Pickup in store',
    tags: [],
  },
  {
    id: '1374',
    orderNumber: '#1374',
    placedAt: '13 Dec at 18:35',
    customerId: 'julian-north',
    total: '$34,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 1,
    deliveryMethod: 'Canada Flat Rate',
    fulfillmentHeaderActions: ['mark-as-delivered', 'add-tracking'],
    tags: [],
  },
  {
    id: '1373',
    orderNumber: '#1373',
    placedAt: '12 Dec at 13:58',
    customerId: 'casey-rowan',
    total: '$58,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 2,
    deliveryMethod: 'Free Shipping',
    tags: [],
  },
  {
    id: '1372',
    orderNumber: '#1372',
    placedAt: '8 Dec at 16:09',
    customerId: 'nadia-ellis',
    total: '$45,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 3,
    deliveryMethod: 'In store',
    tags: [],
  },
  {
    id: '1371',
    orderNumber: '#1371',
    placedAt: '27 Nov at 21:59',
    customerId: 'evan-brooks',
    total: '$124,26',
    paymentStatus: 'Refunded',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 5,
    deliveryStatus: 'In transit',
    deliveryMethod: 'Free Shipping',
    tags: [],
  },
  {
    id: '1370',
    orderNumber: '#1370',
    placedAt: '25 Nov at 17:50',
    customerId: 'bryn-willow',
    total: '$19,74',
    paymentStatus: 'Refunded',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 1,
    deliveryStatus: 'Delivered',
    deliveryMethod: 'Canada Flat Rate',
    tags: [],
  },
  {
    id: '1369',
    orderNumber: '#1369',
    placedAt: '8 Nov at 12:18',
    customerId: 'clara-wynn',
    total: '$36,53',
    paymentStatus: 'Refunded',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 1,
    deliveryStatus: 'Delivered',
    deliveryMethod: 'Canada Flat Rate',
    tags: [],
  },
  {
    id: '1368',
    orderNumber: '#1368',
    placedAt: '30 Oct at 8:48',
    customerId: 'maya-rivers',
    total: '$43,50',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 2,
    deliveryMethod: 'Pickup in store',
    tags: [],
  },
  {
    id: '1367',
    orderNumber: '#1367',
    placedAt: '27 Oct at 19:55',
    customerId: 'hazel-monroe',
    total: '$29,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 1,
    deliveryMethod: 'Pickup in store',
    tags: [],
  },
  {
    id: '1366',
    orderNumber: '#1366',
    placedAt: '19 Oct at 14:39',
    customerId: 'felix-ward',
    total: '$15,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 1,
    deliveryMethod: 'In store',
    tags: [],
  },
  {
    id: '1365',
    orderNumber: '#1365',
    placedAt: '17 Oct at 18:06',
    customerId: 'iris-reed',
    total: '$58,00',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 2,
    deliveryStatus: 'Tracking added',
    deliveryMethod: 'Free Shipping',
    tags: [],
  },
  {
    id: '1349',
    orderNumber: '#1349',
    placedAt: '14 Sep at 11:23',
    customerId: 'sandy-quill',
    total: '$16,35',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 1,
    deliveryStatus: 'Delivered',
    deliveryMethod: 'Canada Flat Rate',
    tags: [],
  },
  {
    id: '1328',
    orderNumber: '#1328',
    placedAt: '14 Sep at 11:11',
    customerId: 'amito-brar',
    total: '$29,07',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 4,
    deliveryStatus: 'Delivered',
    deliveryMethod: 'Canada Flat Rate',
    tags: [],
  },
  {
    id: '1004',
    orderNumber: '#1004',
    placedAt: '25 Jan at 9:00',
    customerId: 'wei-lin',
    total: '$19,68',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 3,
    deliveryStatus: 'Delivered',
    deliveryMethod: 'Canada Flat Rate',
    tags: [],
  },
  {
    id: '1003',
    orderNumber: '#1003',
    placedAt: '4 Jan at 15:59',
    customerId: 'wei-lin',
    total: '$17,03',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Fulfilled',
    itemCount: 3,
    deliveryStatus: 'Delivered',
    deliveryMethod: 'Canada Flat Rate',
    tags: [],
  },
];

export const orders: Order[] = orderRecords.map((order, index) => {
  const { riskLevel, ...orderData } = order;
  void riskLevel;
  const customer = getCustomer(order.customerId) ?? fallbackCustomer;
  const lineItems = buildOrderLineItems(index, order.itemCount);
  const orderWithDetails = {
    ...orderData,
    customer: customer.name,
    customerDetails: buildCustomerDetails(customer),
    risk: buildRisk(getRiskLevel(order, index)),
    source: 'Online Store',
    timelineEvents: buildTimelineEvents(),
    lineItems,
  };

  return {
    ...orderWithDetails,
    payment: buildOrderPayment(orderWithDetails, lineItems),
  };
});

export function useOrdersData() {
  return orders;
}
