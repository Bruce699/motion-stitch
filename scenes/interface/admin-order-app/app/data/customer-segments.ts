import type { Customer } from './customers';
import { customers } from './customers';

export type CustomerSegmentCreator =
  | {
      type: 'merchant';
      name: string;
      initials: string;
    }
  | {
      type: 'shopify';
      name: 'Shopify';
    };

export type CustomerSegment = {
  id: string;
  name: string;
  customerPercentage: number;
  activity: string;
  createdBy: CustomerSegmentCreator;
};

type CustomerSegmentDefinition = Omit<CustomerSegment, 'customerPercentage'> & {
  matches: (customer: Customer, index: number) => boolean;
};

const merchantCreator: CustomerSegmentCreator = {
  type: 'merchant',
  name: 'Arda Karacizmeli',
  initials: 'AK',
};

const shopifyCreator: CustomerSegmentCreator = {
  type: 'shopify',
  name: 'Shopify',
};

const customerSegmentDefinitions: CustomerSegmentDefinition[] = [
  {
    id: 'haksfalgj',
    name: 'Haksfalgj',
    activity: 'Created on 19 Nov 2024',
    createdBy: merchantCreator,
    matches: () => false,
  },
  {
    id: 'all-customers',
    name: 'all customers',
    activity: 'Created on 11 Nov 2024',
    createdBy: merchantCreator,
    matches: () => true,
  },
  {
    id: 'repeat-customers',
    name: 'Repeat customers',
    activity: 'Edited on 5 Nov 2024',
    createdBy: merchantCreator,
    matches: (customer) => customer.orderCount > 1,
  },
  {
    id: 'customers-added-to-companies',
    name: 'Customers added to companies',
    activity: 'Edited on 5 Nov 2024',
    createdBy: shopifyCreator,
    matches: (customer) => customer.country !== 'Netherlands',
  },
  {
    id: 'customers-not-added-to-companies',
    name: 'Customers not added to companies',
    activity: 'Edited on 5 Nov 2024',
    createdBy: shopifyCreator,
    matches: (customer) => customer.country === 'Netherlands',
  },
  {
    id: 'customers-who-have-purchased-at-least-once',
    name: 'Customers who have purchased at least once',
    activity: 'Edited on 5 Nov 2024',
    createdBy: shopifyCreator,
    matches: (customer) => customer.orderCount > 0,
  },
  {
    id: 'email-subscribers',
    name: 'Email subscribers',
    activity: 'Edited on 5 Nov 2024',
    createdBy: shopifyCreator,
    matches: (_customer, index) => index % 3 === 0,
  },
  {
    id: 'abandoned-checkouts-in-the-last-30-days',
    name: 'Abandoned checkouts in the last 30 days',
    activity: 'Edited on 5 Nov 2024',
    createdBy: shopifyCreator,
    matches: () => false,
  },
  {
    id: 'customers-who-have-purchased-more-than-once',
    name: 'Customers who have purchased more than once',
    activity: 'Edited on 5 Nov 2024',
    createdBy: shopifyCreator,
    matches: (customer) => customer.orderCount > 1,
  },
  {
    id: 'customers-who-havent-purchased',
    name: "Customers who haven't purchased",
    activity: 'Edited on 5 Nov 2024',
    createdBy: shopifyCreator,
    matches: (customer) => customer.orderCount === 0,
  },
];

function customerPercentageFor(
  matches: CustomerSegmentDefinition['matches'],
): number {
  if (customers.length === 0) return 0;

  const matchingCustomers = customers.filter(matches).length;

  return Math.round((matchingCustomers / customers.length) * 100);
}

export const customerSegments: CustomerSegment[] =
  customerSegmentDefinitions.map(({ matches, ...segment }) => ({
    ...segment,
    customerPercentage: customerPercentageFor(matches),
  }));

export function useCustomerSegmentsData() {
  return customerSegments;
}
