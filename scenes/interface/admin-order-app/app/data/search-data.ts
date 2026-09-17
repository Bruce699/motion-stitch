import { collections } from './collections';
import React from 'react';
import { customers } from './customers';
import { discounts } from './discounts';
import { SECTIONS_BY_ID } from './navigation';
import { orders } from './orders';
import { products } from './products';
import { AppsAndSalesChannelsIcon } from '~/icons/navigation/settings/apps-and-sales-channels';
import { BillingIcon } from '~/icons/navigation/settings/billing';
import { CheckoutIcon } from '~/icons/navigation/settings/checkout';
import { CustomerAccountsIcon } from '~/icons/navigation/settings/customer-accounts';
import { CustomerEventsIcon } from '~/icons/navigation/settings/customer-events';
import { CustomerPrivacyIcon } from '~/icons/navigation/settings/customer-privacy';
import { DevUiIcon } from '~/icons/navigation/dev-ui';
import { DomainsIcon } from '~/icons/navigation/settings/domains';
import { GeneralIcon } from '~/icons/navigation/settings/general';
import { LanguagesIcon } from '~/icons/navigation/settings/languages';
import { LocationsIcon } from '~/icons/navigation/settings/locations';
import { MetaobjectsIcon as SettingsMetaobjectsIcon } from '~/icons/navigation/settings/metaobjects';
import { NotificationsIcon } from '~/icons/navigation/settings/notifications';
import { PaymentsIcon as SettingsPaymentsIcon } from '~/icons/navigation/settings/payments';
import { PlanIcon } from '~/icons/navigation/settings/plan';
import { PoliciesIcon } from '~/icons/navigation/settings/policies';
import { ShippingAndDeliveryIcon } from '~/icons/navigation/settings/shipping-and-delivery';
import { TaxesAndDutiesIcon } from '~/icons/navigation/settings/taxes-and-duties';
import { UsersIcon } from '~/icons/navigation/settings/users';
import type { Badge } from '~/ui/components/badge/badge';
import type { IconName } from '~/ui/components/icon/icon';

type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

export const SEARCH_GROUPS = [
  { id: 'recent-searches', label: 'Recent searches' },
  { id: 'products', label: 'Products' },
  { id: 'orders', label: 'Orders' },
  { id: 'customers', label: 'Customers' },
  { id: 'discounts', label: 'Discounts' },
  { id: 'collections', label: 'Collections' },
  { id: 'navigation', label: 'Navigation' },
] as const;

export type SearchGroupId = (typeof SEARCH_GROUPS)[number]['id'];

export type SearchItem = {
  id: string;
  group: SearchGroupId;
  title: string;
  subtitle: [string, string];
  href: string;
  icon: IconName;
  image?: string;
  navigationIcon?: React.ReactElement;
  status?: string;
  statusVariant?: BadgeVariant;
};

export type SearchGroup = {
  id: SearchGroupId;
  label: string;
  items: SearchItem[];
};

function collectionImagePath(image: string) {
  return image.startsWith('/') ? image : `/images/${image}`;
}

function subtitle(primary: string, secondary: string): [string, string] {
  return [primary, secondary];
}

function productStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function productStatusVariant(status: string): BadgeVariant {
  return status === 'active' ? 'success' : 'info';
}

function orderFulfillmentStatusVariant(status: string): BadgeVariant {
  if (status === 'Unfulfilled') return 'caution';
  if (status === 'Ready for pickup') return 'info';

  return 'default';
}

function customerSubscriptionStatus(customer: (typeof customers)[number]) {
  return customer.emailSubscribed ? 'Subscribed' : 'Not subscribed';
}

function customerSubscriptionStatusVariant(
  customer: (typeof customers)[number],
): BadgeVariant {
  return customer.emailSubscribed ? 'success' : 'default';
}

function discountStatusVariant(status: string): BadgeVariant {
  return status === 'Active' ? 'success' : 'default';
}

const productsById = new Map(products.map((product) => [product.id, product]));

const settingsNavigationIconsByHref = new Map<string, React.ReactElement>([
  ['/store/settings/general', React.createElement(GeneralIcon)],
  [
    '/store/settings/apps-and-sales-channels',
    React.createElement(AppsAndSalesChannelsIcon),
  ],
  ['/store/settings/billing', React.createElement(BillingIcon)],
  ['/store/settings/checkout', React.createElement(CheckoutIcon)],
  [
    '/store/settings/customer-accounts',
    React.createElement(CustomerAccountsIcon),
  ],
  ['/store/settings/customer-events', React.createElement(CustomerEventsIcon)],
  [
    '/store/settings/customer-privacy',
    React.createElement(CustomerPrivacyIcon),
  ],
  ['/store/settings/domains', React.createElement(DomainsIcon)],
  ['/store/settings/dev-ui', React.createElement(DevUiIcon)],
  ['/store/settings/languages', React.createElement(LanguagesIcon)],
  ['/store/settings/locations', React.createElement(LocationsIcon)],
  ['/store/settings/metaobjects', React.createElement(SettingsMetaobjectsIcon)],
  ['/store/settings/notifications', React.createElement(NotificationsIcon)],
  ['/store/settings/payments', React.createElement(SettingsPaymentsIcon)],
  [
    '/store/settings/payments/methods',
    React.createElement(SettingsPaymentsIcon),
  ],
  [
    '/store/settings/payments/more-ways-to-pay',
    React.createElement(SettingsPaymentsIcon),
  ],
  [
    '/store/settings/payments/payouts',
    React.createElement(SettingsPaymentsIcon),
  ],
  ['/store/settings/plan', React.createElement(PlanIcon)],
  ['/store/settings/policies', React.createElement(PoliciesIcon)],
  [
    '/store/settings/shipping-and-delivery',
    React.createElement(ShippingAndDeliveryIcon),
  ],
  ['/store/settings/taxes-and-duties', React.createElement(TaxesAndDutiesIcon)],
  ['/store/settings/users', React.createElement(UsersIcon)],
]);

const settingsNavigationItems = [
  { title: 'Settings', href: '/store/settings/general' },
  {
    title: 'Apps and sales channels',
    href: '/store/settings/apps-and-sales-channels',
  },
  { title: 'Billing', href: '/store/settings/billing' },
  { title: 'Checkout', href: '/store/settings/checkout' },
  { title: 'Customer accounts', href: '/store/settings/customer-accounts' },
  { title: 'Customer events', href: '/store/settings/customer-events' },
  { title: 'Customer privacy', href: '/store/settings/customer-privacy' },
  { title: 'Dev UI', href: '/store/settings/dev-ui' },
  { title: 'Domains', href: '/store/settings/domains' },
  { title: 'Languages', href: '/store/settings/languages' },
  { title: 'Locations', href: '/store/settings/locations' },
  { title: 'Metaobjects', href: '/store/settings/metaobjects' },
  { title: 'Notifications', href: '/store/settings/notifications' },
  { title: 'Payments', href: '/store/settings/payments' },
  { title: 'Payment methods', href: '/store/settings/payments/methods' },
  {
    title: 'More ways to pay',
    href: '/store/settings/payments/more-ways-to-pay',
  },
  { title: 'Payouts', href: '/store/settings/payments/payouts' },
  { title: 'Plan', href: '/store/settings/plan' },
  { title: 'Policies', href: '/store/settings/policies' },
  {
    title: 'Shipping and delivery',
    href: '/store/settings/shipping-and-delivery',
  },
  { title: 'Taxes and duties', href: '/store/settings/taxes-and-duties' },
  { title: 'Users', href: '/store/settings/users' },
] satisfies { title: string; href: string }[];

function getOrderImages(order: (typeof orders)[number]) {
  return order.lineItems
    .map((lineItem) => productsById.get(lineItem.productId)?.images[0])
    .filter((image): image is string => Boolean(image))
    .slice(0, 2);
}

const resourceSearchItems: SearchItem[] = [
  ...products.map((product) => ({
    id: `product-${product.id}`,
    group: 'products' as const,
    title: product.title,
    subtitle: subtitle(
      `${product.variants.reduce(
        (total, variant) => total + variant.inventory,
        0,
      )} available`,
      product.variants[0]?.price ?? '$0.00',
    ),
    href: `/store/products/${product.id}`,
    icon: 'Box' as const,
    image: product.images[0],
    status: productStatusLabel(product.status),
    statusVariant: productStatusVariant(product.status),
  })),
  ...orders.map((order) => ({
    id: `order-${order.id}`,
    group: 'orders' as const,
    title: order.orderNumber,
    subtitle: subtitle(order.customer, order.total),
    href: `/store/orders/${order.id}`,
    icon: 'InvoiceIn' as const,
    image: getOrderImages(order)[0],
    status: order.fulfillmentStatus,
    statusVariant: orderFulfillmentStatusVariant(order.fulfillmentStatus),
  })),
  ...customers.map((customer) => ({
    id: `customer-${customer.id}`,
    group: 'customers' as const,
    title: customer.name,
    subtitle: subtitle(
      customer.email,
      `${customer.orderCount} ${customer.orderCount === 1 ? 'order' : 'orders'}`,
    ),
    href: `/store/customers/${customer.id}`,
    icon: 'Envelope' as const,
    status: customerSubscriptionStatus(customer),
    statusVariant: customerSubscriptionStatusVariant(customer),
  })),
  ...discounts.map((discount) => ({
    id: `discount-${discount.id}`,
    group: 'discounts' as const,
    title: discount.title,
    subtitle: subtitle(discount.description, `${discount.used} used`),
    href: `/store/products/discounts/${discount.id}`,
    icon: discount.typeIcon,
    status: discount.status,
    statusVariant: discountStatusVariant(discount.status),
  })),
  ...collections.map((collection) => ({
    id: `collection-${collection.id}`,
    group: 'collections' as const,
    title: collection.title,
    subtitle: subtitle(
      `${collection.productCount} ${
        collection.productCount === 1 ? 'product' : 'products'
      }`,
      collection.themeTemplate,
    ),
    href: `/store/products/collections/${collection.id}`,
    icon: 'ObjsGroup' as const,
    image: collectionImagePath(collection.image),
  })),
  ...Array.from(SECTIONS_BY_ID.values()).flatMap((section) => [
    {
      id: `navigation-${section.id}`,
      group: 'navigation' as const,
      title: section.title,
      subtitle: subtitle('Navigation', ''),
      href: section.href,
      icon: 'Link' as const,
      navigationIcon: section.icon,
    },
    ...(section.items?.map((item) => ({
      id: `navigation-${section.id}-${item.href}`,
      group: 'navigation' as const,
      title: item.title,
      subtitle: subtitle(section.title, ''),
      href: item.href,
      icon: 'Link' as const,
      navigationIcon: section.icon,
    })) ?? []),
  ]),
  ...settingsNavigationItems.map((item) => ({
    id: `navigation-settings-${item.href}`,
    group: 'navigation' as const,
    title: item.title,
    subtitle: subtitle('Settings', ''),
    href: item.href,
    icon: 'MonitorSettings' as const,
    navigationIcon: settingsNavigationIconsByHref.get(item.href),
  })),
];

const recentSearchItems: SearchItem[] = [
  resourceSearchItems.find((item) => item.group === 'products'),
  resourceSearchItems.find((item) => item.group === 'orders'),
  resourceSearchItems.find((item) => item.group === 'customers'),
  resourceSearchItems.find((item) => item.group === 'discounts'),
  resourceSearchItems.find((item) => item.group === 'collections'),
]
  .filter((item): item is SearchItem => Boolean(item))
  .map((item) => ({
    ...item,
    id: `recent-search-${item.id}`,
  }));

export function getDefaultSearchGroups(): SearchGroup[] {
  return SEARCH_GROUPS.map((group) => ({
    ...group,
    items:
      group.id === 'recent-searches'
        ? recentSearchItems
        : resourceSearchItems.filter((item) => item.group === group.id),
  })).filter((group) => group.items.length > 0);
}

function getSearchMatchScore(item: SearchItem, query: string) {
  const title = item.title.toLowerCase();
  const compactTitle = title.replace(/\s+/g, '');

  if (title === query) return 0;
  if (title.startsWith(query)) return 1;
  if (compactTitle === query) return 1.1;
  if (compactTitle.startsWith(query)) return 1.2;

  const wordStartIndex = title
    .split(/\s+/)
    .findIndex((word) => word.startsWith(query));

  if (wordStartIndex !== -1) return 2 + wordStartIndex / 100;

  const matchIndex = title.indexOf(query);

  if (matchIndex !== -1) return 3 + matchIndex / 100;

  return null;
}

export function searchItems(query: string): SearchItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return resourceSearchItems
    .map((item) => ({
      item,
      score: getSearchMatchScore(item, normalizedQuery),
    }))
    .filter(
      (result): result is { item: SearchItem; score: number } =>
        result.score !== null,
    )
    .sort(
      (firstResult, secondResult) =>
        firstResult.score - secondResult.score ||
        firstResult.item.title.localeCompare(secondResult.item.title),
    )
    .map((result) => result.item);
}

export function getSearchResultCount(groups: SearchGroup[]) {
  return groups.reduce((total, group) => total + group.items.length, 0);
}
