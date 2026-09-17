type ShippingLabelDocumentStatus = 'Printed';
type ShippingLabelDeliveryStatus = 'Delivered' | 'In transit';

type ShippingLabelCarrier = {
  name: string;
  imageSrc: string;
};

export type ShippingLabel = {
  id: string;
  purchasedAt: string;
  orderNumber: string;
  customer: string;
  destination: string;
  itemCount: number;
  items: string;
  packageName: string;
  dimensions: string;
  weight: string;
  cost: string;
  carrier: ShippingLabelCarrier;
  shippingService: string;
  trackingNumber: string;
  documentStatus: ShippingLabelDocumentStatus;
  deliveryStatus: ShippingLabelDeliveryStatus;
};

const shippingLabelCarriers = {
  dhl: {
    name: 'DHL',
    imageSrc: '/images/carriers/dhl.svg',
  },
  ups: {
    name: 'UPS',
    imageSrc: '/images/carriers/ups.svg',
  },
} satisfies Record<string, ShippingLabelCarrier>;

export const shippingLabels: ShippingLabel[] = [
  {
    id: '1395',
    purchasedAt: '18 April 2026 at 9:06 pm - 1 label',
    orderNumber: '#1395',
    customer: 'Iris Reed',
    destination: 'Brooklyn, NY',
    itemCount: 2,
    items: 'Grip tape',
    packageName: 'Deck mailer',
    dimensions: '9 x 33 x 2 in',
    weight: '11,0231 lb',
    cost: '$15,65',
    carrier: shippingLabelCarriers.ups,
    shippingService: 'UPS Ground',
    trackingNumber: '2010505322580380',
    documentStatus: 'Printed',
    deliveryStatus: 'Delivered',
  },
  {
    id: '1389',
    purchasedAt: '11 April 2026 at 7:02 pm - 1 label',
    orderNumber: '#1389',
    customer: 'Caleb Moss',
    destination: 'San Anselmo, CA',
    itemCount: 1,
    items: 'Bearings set',
    packageName: 'Small parts box',
    dimensions: '7 x 7 x 4 in',
    weight: '5 lb',
    cost: '$27,18',
    carrier: shippingLabelCarriers.ups,
    shippingService: 'UPS Ground',
    trackingNumber: '520451034703',
    documentStatus: 'Printed',
    deliveryStatus: 'In transit',
  },
  {
    id: '1387',
    purchasedAt: '11 April 2026 at 7:00 pm - 1 label',
    orderNumber: '#1387',
    customer: 'Parker Quinn',
    destination: 'Brooklyn, NY',
    itemCount: 3,
    items: 'Multiple items',
    packageName: 'Deck mailer',
    dimensions: '9 x 33 x 2 in',
    weight: '12 lb',
    cost: '$29,41',
    carrier: shippingLabelCarriers.ups,
    shippingService: 'UPS Ground',
    trackingNumber: '520451029695',
    documentStatus: 'Printed',
    deliveryStatus: 'Delivered',
  },
  {
    id: '1349',
    purchasedAt: '14 September 2025 at 11:23 am - 1 label',
    orderNumber: '#1349',
    customer: 'Sandy Quill',
    destination: 'Jersey City, NJ',
    itemCount: 1,
    items: 'Skate wax',
    packageName: 'Small parts box',
    dimensions: '7 x 7 x 4 in',
    weight: '11,1 lb',
    cost: '$16,35',
    carrier: shippingLabelCarriers.dhl,
    shippingService: 'DHL eCommerce',
    trackingNumber: '2010505088669279',
    documentStatus: 'Printed',
    deliveryStatus: 'Delivered',
  },
  {
    id: '1328',
    purchasedAt: '14 September 2025 at 11:11 am - 1 label',
    orderNumber: '#1328',
    customer: 'Amito Brar',
    destination: 'New Haven, CT',
    itemCount: 4,
    items: 'Multiple items',
    packageName: 'Complete setup box',
    dimensions: '12 x 34 x 8 in',
    weight: '42,3288 lb',
    cost: '$29,07',
    carrier: shippingLabelCarriers.ups,
    shippingService: 'UPS Ground',
    trackingNumber: '2010505088512274',
    documentStatus: 'Printed',
    deliveryStatus: 'Delivered',
  },
  {
    id: '1004',
    purchasedAt: '25 January 2023 at 9:00 am - 1 label',
    orderNumber: '#1004',
    customer: 'Wei Lin',
    destination: 'Long Island City, NY',
    itemCount: 3,
    items: 'Multiple items',
    packageName: 'Deck mailer',
    dimensions: '9 x 33 x 2 in',
    weight: '6,8988 kg',
    cost: '$19,68',
    carrier: shippingLabelCarriers.ups,
    shippingService: 'UPS Ground',
    trackingNumber: '2007953400677631',
    documentStatus: 'Printed',
    deliveryStatus: 'Delivered',
  },
  {
    id: '1003',
    purchasedAt: '4 January 2023 at 3:59 pm - 1 label',
    orderNumber: '#1003',
    customer: 'Wei Lin',
    destination: 'New York, NY',
    itemCount: 3,
    items: 'Multiple items',
    packageName: 'Deck mailer',
    dimensions: '9 x 33 x 2 in',
    weight: '8 lb',
    cost: '$17,03',
    carrier: shippingLabelCarriers.dhl,
    shippingService: 'DHL eCommerce',
    trackingNumber: '2007953094086627',
    documentStatus: 'Printed',
    deliveryStatus: 'Delivered',
  },
];

export function useShippingLabelsData() {
  return shippingLabels;
}
