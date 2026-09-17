import { useState } from 'react';
import { collections } from '~/data/collections';
import { Checkbox, Image, SearchBar, Table } from '~/ui';

const visibleCollections = collections.filter(
  (collection) => collection.id !== 'beanies',
);

function conditionLabel(title: string) {
  const normalizedTitle = title.toLowerCase();
  const singularTitle = normalizedTitle.endsWith('ies')
    ? `${normalizedTitle.slice(0, -3)}y`
    : normalizedTitle.endsWith('s')
      ? normalizedTitle.slice(0, -1)
      : normalizedTitle;

  return `Product title contains ${singularTitle}`;
}

export function CollectionsTable() {
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<
    Set<string>
  >(() => new Set());
  const hasSelectedCollections = selectedCollectionIds.size > 0;
  const allCollectionsSelected =
    selectedCollectionIds.size === visibleCollections.length;
  const someCollectionsSelected =
    hasSelectedCollections && !allCollectionsSelected;

  function setAllCollectionsSelected(checked: boolean) {
    setSelectedCollectionIds(
      checked
        ? new Set(visibleCollections.map((collection) => collection.id))
        : new Set(),
    );
  }

  function setCollectionSelected(collectionId: string, checked: boolean) {
    setSelectedCollectionIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (checked) {
        nextIds.add(collectionId);
      } else {
        nextIds.delete(collectionId);
      }

      return nextIds;
    });
  }

  return (
    <section>
      <div className="flex flex-col gap-3">
        <SearchBar
          aria-label="Search collections"
          className="mx-3"
          placeholder="Search and filter"
        />

        <Table.Root bleed stickyHeader={false}>
          <Table.Head>
            <Table.Row>
              <Table.Header type="checkbox">
                <Checkbox.Root
                  aria-label="Select all collections"
                  aria-checked={someCollectionsSelected ? 'mixed' : undefined}
                  checked={hasSelectedCollections}
                  onCheckedChange={() =>
                    setAllCollectionsSelected(!allCollectionsSelected)
                  }
                >
                  <Checkbox.Indicator
                    variant={
                      someCollectionsSelected ? 'indeterminate' : 'check'
                    }
                  />
                </Checkbox.Root>
              </Table.Header>
              <Table.Header className="w-full">Title</Table.Header>
              <Table.Header className="text-right">Products</Table.Header>
              <Table.Header>Product conditions</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {visibleCollections.map((collection) => (
              <Table.Row
                key={collection.id}
                href={`/store/products/collections/${collection.id}`}
                title={collection.title}
              >
                <Table.Cell type="checkbox">
                  <Checkbox.Root
                    aria-label={`Select ${collection.title}`}
                    checked={selectedCollectionIds.has(collection.id)}
                    onCheckedChange={(checked) =>
                      setCollectionSelected(collection.id, checked === true)
                    }
                  >
                    <Checkbox.Indicator />
                  </Checkbox.Root>
                </Table.Cell>
                <Table.Cell link className="w-84">
                  <span className="inline-flex items-center justify-center gap-3">
                    <Image
                      src={`/images/${collection.image}`}
                      alt=""
                      size={36}
                      borderRadius="lg"
                      shadow="sm"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="font-medium">{collection.title}</span>
                  </span>
                </Table.Cell>
                <Table.Cell className="text-right">
                  {collection.productCount}
                </Table.Cell>
                <Table.Cell>
                  <span className="inline-flex items-center gap-2 text-secondary">
                    <span>{conditionLabel(collection.title)}</span>
                  </span>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </div>
    </section>
  );
}
