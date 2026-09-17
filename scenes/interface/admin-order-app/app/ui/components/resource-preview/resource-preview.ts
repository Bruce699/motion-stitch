import React from 'react';
import type { Collection } from '~/data/collections';
import type { Customer } from '~/data/customers';
import type { Discount } from '~/data/discounts';
import type { Order } from '~/data/orders';
import type { Product } from '~/data/products';
import { Avatar } from '~/ui/components/avatar/avatar';
import { Badge } from '~/ui/components/badge/badge';
import { Icon, type IconName } from '~/ui/components/icon/icon';
import { Image } from '~/ui/components/image/image';
import * as SharedPopover from '~/ui/components/shared-popover/shared-popover';
import { getCursorTriggerProps } from '~/ui/components/shared-popover/shared-popover-cursor';

type ResourcePreviewType =
  | 'collection'
  | 'customer'
  | 'discount'
  | 'order'
  | 'product';

type ResourcePreviewResourceMap = {
  collection: Collection;
  customer: Customer;
  discount: Discount;
  order: Order;
  product: Product;
};

type PreviewItem = {
  icon: IconName;
  text: string;
};

type PreviewModel = {
  title: string;
  subtitle: string;
  badge?: {
    label: string;
    variant?: 'default' | 'success' | 'info' | 'caution' | 'warning' | 'ai';
  };
  image?: {
    src: string;
    alt: string;
  };
  icon?: IconName;
  initials?: string;
  items: PreviewItem[];
};

type ResourcePreviewProps<Type extends ResourcePreviewType> = {
  type: Type;
  resource: ResourcePreviewResourceMap[Type];
  trigger: React.ReactElement;
  triggerClassName?: string;
  delay?: number;
  side?: SharedPopover.SharedPopoverSide;
  align?: SharedPopover.SharedPopoverAlign;
};

type ResourcePreviewConfig = {
  [Type in ResourcePreviewType]: Omit<ResourcePreviewProps<Type>, 'trigger'>;
}[ResourcePreviewType];

type ResourcePreviewTriggerProps = SharedPopover.SharedPopoverTriggerProps;

const defaultPreviewDelay = 250;
const previewSurfaceClassName = 'rounded-xl bg-white px-3 py-3 shadow-lg';

function ResourcePreview<Type extends ResourcePreviewType>({
  align = 'start',
  delay = defaultPreviewDelay,
  resource,
  side = 'top',
  trigger,
  triggerClassName,
  type,
}: ResourcePreviewProps<Type>) {
  const preview = getPreviewModel(type, resource);

  return React.createElement(
    SharedPopover.CursorTrigger,
    {
      align,
      className: previewSurfaceClassName,
      content: React.createElement(ResourcePreviewCard, { preview }),
      delay,
      id: previewKey(preview),
      side,
      children: trigger,
      triggerClassName,
    },
  );
}

function getResourcePreviewTriggerProps(
  config: ResourcePreviewConfig,
): ResourcePreviewTriggerProps {
  const { align = 'start', delay = defaultPreviewDelay, side = 'top' } = config;
  const preview = getPreviewModelForConfig(config);

  return getCursorTriggerProps({
    align,
    className: previewSurfaceClassName,
    content: React.createElement(ResourcePreviewCard, { preview }),
    delay,
    id: previewKey(preview),
    side,
  });
}

function ResourcePreviewCard({ preview }: { preview: PreviewModel }) {
  return React.createElement(
    'div',
    { className: 'flex flex-col gap-3' },
    React.createElement(
      'div',
      { className: 'flex items-center gap-3 border-b border-border pb-3' },
      React.createElement(PreviewAvatar, { preview }),
      React.createElement(
        'div',
        { className: 'flex-1' },
        React.createElement(
          'div',
          { className: 'flex items-center gap-2' },
          React.createElement(
            'div',
            { className: 'truncate text-base font-medium' },
            preview.title,
          ),
          preview.badge
            ? React.createElement(
                Badge,
                { variant: preview.badge.variant },
                preview.badge.label,
              )
            : null,
        ),
        React.createElement(
          'div',
          { className: 'truncate text-sm text-secondary' },
          preview.subtitle,
        ),
      ),
    ),
    React.createElement(
      'div',
      { className: 'flex flex-col gap-2' },
      preview.items.slice(0, 5).map((item) =>
        React.createElement(
          'div',
          {
            key: `${item.icon}-${item.text}`,
            className: 'flex items-center gap-2 text-sm text-secondary',
          },
          React.createElement(
            'span',
            { className: 'text-muted-foreground' },
            React.createElement(Icon, { name: item.icon, size: 14 }),
          ),
          React.createElement('span', { className: 'truncate' }, item.text),
        ),
      ),
    ),
  );
}

function PreviewAvatar({ preview }: { preview: PreviewModel }) {
  if (preview.image) {
    return React.createElement(Image, {
      src: preview.image.src,
      alt: preview.image.alt,
      size: 32,
      borderRadius: 'lg',
      shadow: 'sm',
      loading: 'lazy',
      decoding: 'async',
    });
  }

  if (preview.initials) {
    return React.createElement(Avatar, {
      initials: preview.initials,
      size: 'lg',
      name: preview.title,
    });
  }

  return React.createElement(
    'span',
    {
      className:
        'flex size-10 items-center justify-center rounded-lg bg-muted text-secondary',
    },
    React.createElement(Icon, { name: preview.icon ?? 'File' }),
  );
}

function getPreviewModel<Type extends ResourcePreviewType>(
  type: Type,
  resource: ResourcePreviewResourceMap[Type],
): PreviewModel {
  switch (type) {
    case 'collection':
      return getCollectionPreview(resource as Collection);
    case 'customer':
      return getCustomerPreview(resource as Customer);
    case 'discount':
      return getDiscountPreview(resource as Discount);
    case 'order':
      return getOrderPreview(resource as Order);
    case 'product':
      return getProductPreview(resource as Product);
  }
}

function getPreviewModelForConfig(config: ResourcePreviewConfig) {
  switch (config.type) {
    case 'collection':
      return getCollectionPreview(config.resource);
    case 'customer':
      return getCustomerPreview(config.resource);
    case 'discount':
      return getDiscountPreview(config.resource);
    case 'order':
      return getOrderPreview(config.resource);
    case 'product':
      return getProductPreview(config.resource);
  }
}

function previewKey(preview: PreviewModel) {
  return `${preview.title}:${preview.subtitle}`;
}

function getCustomerPreview(customer: Customer): PreviewModel {
  return {
    title: customer.name,
    subtitle: customer.email,
    initials: initialsForName(customer.name),
    items: compactItems([
      { icon: 'Pin', text: `${customer.city}, ${customer.country}` },
      {
        icon: 'CartShopping',
        text: `${customer.orderCount} orders (${customer.lifetimeSpend} lifetime spend)`,
      },
      customer.segment ? { icon: 'Tag', text: customer.segment } : undefined,
    ]),
  };
}

function getOrderPreview(order: Order): PreviewModel {
  return {
    title: order.orderNumber,
    subtitle: order.placedAt,
    icon: 'InvoiceIn',
    badge: {
      label: order.paymentStatus,
      variant:
        order.paymentStatus === 'Payment pending' ? 'caution' : 'success',
    },
    items: compactItems([
      {
        icon: 'PalletPackage',
        text: `${order.paymentStatus}, ${order.fulfillmentStatus}`,
      },
      {
        icon: 'CartShopping',
        text: `${order.total} (${order.itemCount} items)`,
      },
      { icon: 'TruckFast', text: order.deliveryMethod },
    ]),
  };
}

function getProductPreview(product: Product): PreviewModel {
  const firstVariant = product.variants[0];

  return {
    title: product.title,
    subtitle: `${product.category}`,
    image: product.images[0]
      ? { src: product.images[0], alt: product.title }
      : undefined,
    badge: {
      label: formatStatus(product.status),
      variant: product.status === 'active' ? 'success' : 'default',
    },
    items: compactItems([
      firstVariant
        ? { icon: 'CircleDollar', text: firstVariant.price }
        : undefined,
      firstVariant
        ? { icon: 'PalletPackage', text: `${firstVariant.inventory} in stock` }
        : undefined,
      { icon: 'ReplaceObjs', text: `${product.variants.length} variants` },
    ]),
  };
}

function getCollectionPreview(collection: Collection): PreviewModel {
  return {
    title: collection.title,
    subtitle: productCountLabel(collection.productCount),
    image: { src: `/images/${collection.image}`, alt: collection.title },
    badge: {
      label: formatStatus(collection.status),
      variant: collection.status === 'active' ? 'success' : 'default',
    },
    items: compactItems([
      collection.metrics[0]
        ? {
            icon: 'CircleDollar',
            text: `${collection.metrics[0].title}: ${collection.metrics[0].metric}`,
          }
        : undefined,
      collection.metrics[1]
        ? {
            icon: 'Gauge5',
            text: `${collection.metrics[1].metric}% ${collection.metrics[1].title.toLowerCase()}`,
          }
        : undefined,
      {
        icon: 'ConnectedDots3',
        text: `${collection.channelIds.length} channels, ${collection.catalogIds.length} catalogs`,
      },
    ]),
  };
}

function getDiscountPreview(discount: Discount): PreviewModel {
  return {
    title: discount.title,
    subtitle: discount.description,
    icon: discount.typeIcon,
    badge: {
      label: discount.status,
      variant: discount.status === 'Active' ? 'success' : 'default',
    },
    items: compactItems([
      { icon: 'DiscountCode', text: discount.method },
      { icon: 'Tag', text: discount.type },
      { icon: 'Gauge5', text: `${discount.used} uses` },
    ]),
  };
}

function compactItems(items: Array<PreviewItem | undefined>) {
  return items.filter((item): item is PreviewItem => Boolean(item)).slice(0, 5);
}

function initialsForName(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function productCountLabel(productCount: number) {
  return `${productCount} ${productCount === 1 ? 'product' : 'products'}`;
}

export { ResourcePreview, getResourcePreviewTriggerProps };
export type { ResourcePreviewConfig, ResourcePreviewType };
