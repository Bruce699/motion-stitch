import type { IconName } from '~/ui';

type ShippingServiceCarrier = {
  name: string;
  imageSrc: string;
};

type ShippingServiceHighlight = {
  label: string;
  iconName: IconName;
};

export type ShippingService = {
  id: string;
  carrier?: ShippingServiceCarrier;
  name: string;
  price: string;
  tone: 'yellow' | 'brown' | 'red' | 'gold';
  highlights: ShippingServiceHighlight[];
  badge?: string;
  selected?: boolean;
};

const shippingServiceCarriers = {
  dhl: {
    name: 'DHL',
    imageSrc: '/images/carriers/dhl.svg',
  },
  ups: {
    name: 'UPS',
    imageSrc: '/images/carriers/ups.svg',
  },
} satisfies Record<string, ShippingServiceCarrier>;

export const shippingServices: ShippingService[] = [
  {
    id: 'dhl-express',
    carrier: shippingServiceCarriers.dhl,
    name: 'Express Worldwide',
    price: '$35 USD',
    tone: 'yellow',
    badge: 'Customer selection',
    selected: true,
    highlights: [
      { label: 'Fastest', iconName: 'BoltSpeed' },
      { label: '2 business days', iconName: 'TruckFast' },
      { label: 'Up to $100 USD', iconName: 'ShieldCheck' },
      { label: 'With tracking', iconName: 'Path2' },
    ],
  },
  {
    id: 'ups-express',
    carrier: shippingServiceCarriers.ups,
    name: 'Express Saver',
    price: '$20 USD',
    tone: 'brown',
    highlights: [
      { label: 'Cheapest', iconName: 'PiggyBank' },
      { label: '2-5 business days', iconName: 'TruckFast' },
      { label: 'Up to $50 USD', iconName: 'ShieldCheck' },
      { label: 'With tracking', iconName: 'Path2' },
    ],
  },
  {
    id: 'ups-ground',
    carrier: shippingServiceCarriers.ups,
    name: 'Ground',
    price: '$15 USD',
    tone: 'red',
    highlights: [
      { label: '2-5 business days', iconName: 'TruckFast' },
      { label: 'With tracking', iconName: 'Path2' },
    ],
  },
  {
    id: 'ups-standard',
    carrier: shippingServiceCarriers.ups,
    name: 'Standard',
    price: '$10 USD',
    tone: 'gold',
    highlights: [
      { label: '5 business days', iconName: 'TruckFast' },
      { label: 'Up to $50 USD', iconName: 'ShieldCheck' },
      { label: 'With tracking', iconName: 'Path2' },
    ],
  },
];
