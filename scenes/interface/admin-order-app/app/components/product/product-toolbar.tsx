import React from 'react';
import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { products } from '~/data/products';
import { ProductsIcon } from '~/icons/navigation/products';

const productIndexById = new Map(
  products.map((product, index) => [product.id, index]),
);

export function ProductToolbar({
  product,
  productId,
  title,
  hasChanges,
  onSave,
  onDiscard,
}: {
  product: { id: string };
  productId: string;
  title: string;
  hasChanges: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const handleDuplicate = React.useCallback(() => {}, []);
  const handleView = React.useCallback(() => {}, []);
  const handleShare = React.useCallback(() => {}, []);
  const handleMore = React.useCallback(() => {}, []);
  const currentProductIndex = productIndexById.get(product.id) ?? -1;
  const previousProduct = products[currentProductIndex - 1];
  const nextProduct = products[currentProductIndex + 1];

  useToolbar({
    title,
    breadcrumbs: [
      {
        variant: 'button',
        url: '/store/products',
        label: 'Products',
        icon: <ProductsIcon />,
      },
    ],
    actions: [
      {
        type: 'group',
        actions: [
          {
            type: 'secondary',
            icon: 'Duplicate',
            label: 'Duplicate',
            onClick: handleDuplicate,
          },
          {
            type: 'secondary',
            icon: 'Eye',
            label: 'View',
            onClick: handleView,
          },
          {
            type: 'secondary',
            icon: 'Share',
            label: 'Share',
            onClick: handleShare,
          },
          {
            type: 'secondary',
            icon: 'Dots',
            label: 'More',
            onClick: handleMore,
          },
        ],
      },
      {
        type: 'previousNext',
        previous: {
          label: 'Previous product',
          url: previousProduct
            ? `/store/products/${previousProduct.id}`
            : undefined,
        },
        next: {
          label: 'Next product',
          url: nextProduct ? `/store/products/${nextProduct.id}` : undefined,
        },
      },
    ],
    resource: {
      type: 'product',
      id: productId,
      hasChanges,
      onSave,
      onDiscard,
    },
  });

  return null;
}
