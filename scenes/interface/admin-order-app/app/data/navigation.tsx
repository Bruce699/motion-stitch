import React from 'react';
import { ChatsIcon } from '../icons/navigation/chats';
import { ContentIcon } from '../icons/navigation/content';
import { CustomersIcon } from '../icons/navigation/customers';
import { HomeIcon } from '../icons/navigation/home';
import { InboxIcon } from '../icons/navigation/inbox';
import { MarketsIcon } from '../icons/navigation/markets';
import { OnlineStoreIcon } from '../icons/navigation/online-store';
import { OrdersIcon } from '../icons/navigation/orders';
import { PaymentsIcon } from '../icons/navigation/payments';
import { GrowthIcon } from '../icons/navigation/growth';
import { ProductsIcon } from '../icons/navigation/products';

export type PrimaryNavigationSection = {
  id: string;
  title: string;
  href: string;
  quantity?: number;
  icon: React.ReactElement;
  exactMatch?: boolean;
  items?: {
    href: string;
    title: string;
  }[];
};

const NAV_SECTIONS: PrimaryNavigationSection[] = [
  {
    id: 'home',
    title: 'Home',
    href: '/store',
    icon: <HomeIcon />,
    exactMatch: true,
  },
  {
    id: 'orders',
    title: 'Orders',
    href: '/store/orders',
    quantity: 5,
    icon: <OrdersIcon />,
    items: [
      { href: '/store/orders/drafts', title: 'Drafts' },
      { href: '/store/orders/shipping-labels', title: 'Shipping labels' },
      {
        href: '/store/orders/abandoned-checkouts',
        title: 'Abandoned checkouts',
      },
    ],
  },
  {
    id: 'products',
    title: 'Products',
    href: '/store/products',
    icon: <ProductsIcon />,
    items: [
      { href: '/store/products/collections', title: 'Collections' },
      { href: '/store/products/inventory', title: 'Inventory' },
      { href: '/store/products/purchase-orders', title: 'Purchase orders' },
      { href: '/store/products/transfers', title: 'Transfers' },
      { href: '/store/products/discounts', title: 'Discounts' },
      { href: '/store/products/gift-cards', title: 'Gift cards' },
    ],
  },
  {
    id: 'customers',
    title: 'Customers',
    href: '/store/customers',
    icon: <CustomersIcon />,
    items: [
      { href: '/store/customers/segments', title: 'Segments' },
      { href: '/store/customers/companies', title: 'Companies' },
    ],
  },
  {
    id: 'growth',
    title: 'Growth',
    href: '/store/growth',
    icon: <GrowthIcon />,
    items: [
      { href: '/store/growth/campaigns', title: 'Campaigns' },
      { href: '/store/growth/attribution', title: 'Attribution' },
      { href: '/store/growth/reports', title: 'Reports' },
      { href: '/store/growth/live-view', title: 'Live View' },
    ],
  },
  {
    id: 'markets',
    title: 'Markets',
    href: '/store/markets',
    icon: <MarketsIcon />,
    items: [{ href: '/store/markets/catalogs', title: 'Catalogs' }],
  },
  {
    id: 'finance',
    title: 'Payments',
    href: '/store/payments',
    icon: <PaymentsIcon />,
    items: [
      { href: '/store/payments/risk-management', title: 'Risk management' },
      { href: '/store/payments/sales-tax', title: 'Sales tax' },
    ],
  },
  {
    id: 'content',
    title: 'Content',
    href: '/store/content',
    icon: <ContentIcon />,
    items: [
      { href: '/store/content/metaobjects', title: 'Metaobjects' },
      { href: '/store/content/files', title: 'Files' },
      { href: '/store/content/menus', title: 'Menus' },
      { href: '/store/content/blog-posts', title: 'Blog posts' },
    ],
  },
  {
    id: 'chats',
    title: 'Chats',
    href: '/store/chats',
    icon: <ChatsIcon />,
  },
  {
    id: 'online-store',
    title: 'Online Store',
    href: '/store/online-store',
    icon: <OnlineStoreIcon />,
  },
  {
    id: 'inbox',
    title: 'Inbox',
    href: '/store/inbox',
    icon: <InboxIcon />,
  },
];

export const SECTIONS_BY_ID = new Map(
  NAV_SECTIONS.map((section) => [section.id, section]),
);
