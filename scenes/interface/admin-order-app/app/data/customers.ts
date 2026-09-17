import type { AsideTimelineEvent } from '~/ui';
import { currentStaffMember, staffMembers } from './staff-members';

export type CustomerCoordinates = [number, number];

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  orderCount: number;
  lifetimeSpend: string;
  customerSinceDays: number;
  segment?: string;
  status?: string;
  emailSubscribed: boolean;
  smsSubscribed: boolean;
  coordinates: CustomerCoordinates;
};

export const customerEmailSubscriptionOptions = [
  { value: 'subscribed', label: 'Email subscribed' },
  { value: 'not-subscribed', label: 'Email not subscribed' },
];

export const customerSmsSubscriptionOptions = [
  { value: 'subscribed', label: 'SMS subscribed' },
  { value: 'not-subscribed', label: 'SMS not subscribed' },
];

export const customerTagOptions = [
  { value: 'vip', label: 'VIP' },
  { value: 'local', label: 'Local' },
  { value: 'wholesale', label: 'Wholesale' },
];

export const customerNoteOptions = [
  { value: 'follow-up', label: 'Needs follow-up' },
  { value: 'prefers-email', label: 'Prefers email' },
  { value: 'high-intent', label: 'High intent' },
];

type CustomerInput = Omit<
  Customer,
  | 'address'
  | 'city'
  | 'coordinates'
  | 'country'
  | 'customerSinceDays'
  | 'email'
  | 'emailSubscribed'
  | 'phone'
  | 'smsSubscribed'
> &
  Partial<
    Pick<
      Customer,
      | 'address'
      | 'city'
      | 'coordinates'
      | 'country'
      | 'customerSinceDays'
      | 'email'
      | 'emailSubscribed'
      | 'phone'
      | 'smsSubscribed'
    >
  >;

const customerLocations: {
  address: string;
  city: string;
  coordinates: CustomerCoordinates;
  country: string;
}[] = [
  {
    address: '184 Kent Ave',
    city: 'Brooklyn, NY',
    coordinates: [40.7181, -73.9627],
    country: 'United States',
  },
  {
    address: '31-00 47th Ave',
    city: 'Long Island City, NY',
    coordinates: [40.7425, -73.9354],
    country: 'United States',
  },
  {
    address: '125 W 125th St',
    city: 'New York, NY',
    coordinates: [40.809, -73.9468],
    country: 'United States',
  },
  {
    address: '72 Hester St',
    city: 'New York, NY',
    coordinates: [40.7166, -73.9901],
    country: 'United States',
  },
  {
    address: '89 Newark Ave',
    city: 'Jersey City, NJ',
    coordinates: [40.7218, -74.043],
    country: 'United States',
  },
  {
    address: '142 Montague St',
    city: 'Brooklyn, NY',
    coordinates: [40.6948, -73.993],
    country: 'United States',
  },
  {
    address: '26 Journal Square',
    city: 'Jersey City, NJ',
    coordinates: [40.7336, -74.0628],
    country: 'United States',
  },
  {
    address: '1000 Chapel St',
    city: 'New Haven, CT',
    coordinates: [41.3063, -72.925],
    country: 'United States',
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function emailForName(name: string) {
  return `${slugify(name).replaceAll('-', '.')}@example.com`;
}

export function getCustomerInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function createCustomer(input: CustomerInput, index: number): Customer {
  const location = customerLocations[index % customerLocations.length];

  return {
    address: location.address,
    city: location.city,
    coordinates: location.coordinates,
    country: location.country,
    customerSinceDays: 90 + index * 17,
    email: emailForName(input.name),
    emailSubscribed: index % 4 !== 0,
    phone: '+1 212 555 0156',
    smsSubscribed: index % 4 === 0,
    status: 'Active',
    ...input,
  };
}

const customerInputs: CustomerInput[] = [
  {
    id: 'milo-hart',
    name: 'Milo Hart',
    orderCount: 3,
    lifetimeSpend: '$412.00',
    segment: 'At risk',
  },
  {
    id: 'nora-finch',
    name: 'Nora Finch',
    orderCount: 2,
    lifetimeSpend: '$188.00',
    segment: 'New customer',
  },
  {
    id: 'ari-vale',
    name: 'Ari Vale',
    orderCount: 4,
    lifetimeSpend: '$356.00',
    segment: 'Repeat customer',
  },
  {
    id: 'lina-park',
    name: 'Lina Park',
    orderCount: 5,
    lifetimeSpend: '$531.00',
  },
  {
    id: 'theo-stone',
    name: 'Theo Stone',
    orderCount: 2,
    lifetimeSpend: '$923.00',
    segment: 'High value',
  },
  {
    id: 'maren-fox',
    name: 'Maren Fox',
    orderCount: 1,
    lifetimeSpend: '$29.00',
  },
  {
    id: 'iris-reed',
    name: 'Iris Reed',
    orderCount: 6,
    lifetimeSpend: '$361.00',
    segment: 'VIP',
  },
  {
    id: 'sofia-lane',
    name: 'Sofia Lane',
    orderCount: 3,
    lifetimeSpend: '$247.00',
  },
  {
    id: 'omar-bell',
    name: 'Omar Bell',
    orderCount: 2,
    lifetimeSpend: '$102.00',
  },
  {
    id: 'evan-brooks',
    name: 'Evan Brooks',
    orderCount: 4,
    lifetimeSpend: '$211.21',
  },
  {
    id: 'caleb-moss',
    name: 'Caleb Moss',
    orderCount: 1,
    lifetimeSpend: '$23.36',
  },
  {
    id: 'riley-cole',
    name: 'Riley Cole',
    orderCount: 1,
    lifetimeSpend: '$29.00',
  },
  {
    id: 'parker-quinn',
    name: 'Parker Quinn',
    orderCount: 1,
    lifetimeSpend: '$61.11',
  },
  {
    id: 'june-avery',
    name: 'June Avery',
    orderCount: 3,
    lifetimeSpend: '$131.90',
  },
  {
    id: 'maya-rivers',
    name: 'Maya Rivers',
    orderCount: 3,
    lifetimeSpend: '$101.50',
  },
  {
    id: 'samir-west',
    name: 'Samir West',
    orderCount: 2,
    lifetimeSpend: '$102.00',
  },
  {
    id: 'alden-pierce',
    name: 'Alden Pierce',
    orderCount: 1,
    lifetimeSpend: '$35.00',
  },
  {
    id: 'tessa-bloom',
    name: 'Tessa Bloom',
    orderCount: 1,
    lifetimeSpend: '$14.25',
  },
  {
    id: 'mateo-cruz',
    name: 'Mateo Cruz',
    orderCount: 1,
    lifetimeSpend: '$19.00',
  },
  {
    id: 'elena-frost',
    name: 'Elena Frost',
    orderCount: 1,
    lifetimeSpend: '$62.40',
  },
  {
    id: 'miles-archer',
    name: 'Miles Archer',
    orderCount: 1,
    lifetimeSpend: '$38.00',
  },
  {
    id: 'julian-north',
    name: 'Julian North',
    orderCount: 1,
    lifetimeSpend: '$34.00',
  },
  {
    id: 'casey-rowan',
    name: 'Casey Rowan',
    orderCount: 1,
    lifetimeSpend: '$58.00',
  },
  {
    id: 'nadia-ellis',
    name: 'Nadia Ellis',
    orderCount: 1,
    lifetimeSpend: '$45.00',
  },
  {
    id: 'bryn-willow',
    name: 'Bryn Willow',
    orderCount: 1,
    lifetimeSpend: '$19.74',
  },
  {
    id: 'clara-wynn',
    name: 'Clara Wynn',
    orderCount: 1,
    lifetimeSpend: '$36.53',
  },
  {
    id: 'hazel-monroe',
    name: 'Hazel Monroe',
    orderCount: 1,
    lifetimeSpend: '$29.00',
  },
  {
    id: 'felix-ward',
    name: 'Felix Ward',
    orderCount: 1,
    lifetimeSpend: '$15.00',
  },
  {
    id: 'mika-stone',
    name: 'Mika Stone',
    orderCount: 2,
    lifetimeSpend: '$516.05',
  },
  {
    id: 'zara-wu',
    name: 'Zara Wu',
    orderCount: 1,
    lifetimeSpend: '$35.72',
  },
  {
    id: 'evan-atlas',
    name: 'Evan Atlas',
    orderCount: 1,
    lifetimeSpend: '$24.00',
  },
  {
    id: 'arden-mcneil',
    name: 'Arden McNeil',
    orderCount: 2,
    lifetimeSpend: '$68.00',
  },
  {
    id: 'sandy-quill',
    name: 'Sandy Quill',
    orderCount: 1,
    lifetimeSpend: '$16.35',
  },
  {
    id: 'amito-brar',
    name: 'Amito Brar',
    orderCount: 1,
    lifetimeSpend: '$29.07',
  },
  {
    id: 'wei-lin',
    name: 'Wei Lin',
    orderCount: 2,
    lifetimeSpend: '$36.71',
  },
];

export const customers = customerInputs.map(createCustomer);

export function getCustomer(customerId: string) {
  return customers.find((customer) => customer.id === customerId);
}

export function getCustomerByName(name: string) {
  return customers.find((customer) => customer.name === name);
}

export function getCustomerTimeline(
  customerName: string,
): AsideTimelineEvent[] {
  return [
    {
      date: 'July 19, 2025',
      staffMember: currentStaffMember,
      body: `${customerName} reached out to us.`,
      time: '1:36pm',
    },
    {
      date: 'July 17, 2025',
      staffMember: staffMembers[1],
      body: 'Created this customer.',
      time: '10:38am',
    },
  ];
}

export function useCustomersData() {
  return customers;
}
