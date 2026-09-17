import React from 'react';
import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { collections } from '~/data/collections';
import { CollectionsIcon } from '~/icons/navigation/collections';

export function CollectionToolbar({
  collection,
  collectionId,
  title,
  hasChanges,
  onSave,
  onDiscard,
}: {
  collection: { id: string };
  collectionId: string;
  title: string;
  hasChanges: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const handleDuplicate = React.useCallback(() => {}, []);
  const handleView = React.useCallback(() => {}, []);
  const handleDelete = React.useCallback(() => {}, []);
  const currentCollectionIndex = React.useMemo(
    () => collections.findIndex((item) => item.id === collection.id),
    [collection.id],
  );
  const previousCollection = collections[currentCollectionIndex - 1];
  const nextCollection = collections[currentCollectionIndex + 1];

  useToolbar({
    title,
    breadcrumbs: [
      {
        variant: 'button',
        url: '/store/products/collections',
        label: 'Collections',
        icon: <CollectionsIcon />,
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
            icon: 'Trash',
            label: 'Delete',
            onClick: handleDelete,
          },
        ],
      },
      {
        type: 'previousNext',
        previous: {
          label: 'Previous collection',
          url: previousCollection
            ? `/store/products/collections/${previousCollection.id}`
            : undefined,
        },
        next: {
          label: 'Next collection',
          url: nextCollection
            ? `/store/products/collections/${nextCollection.id}`
            : undefined,
        },
      },
    ],
    resource: {
      type: 'collection',
      id: collectionId,
      hasChanges,
      onSave,
      onDiscard,
    },
  });

  return null;
}
