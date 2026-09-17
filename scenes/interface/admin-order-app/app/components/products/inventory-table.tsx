import { useState } from 'react';
import { products } from '~/data/products';
import { Checkbox, Image, SearchBar, Table } from '~/ui';

type InventoryRow = {
  id: string;
  productId: string;
  productTitle: string;
  variantOption?: string;
  image?: string;
  sku: string;
  unavailable: number;
  committed: number;
  available: number;
  onHand: number;
  incoming: number;
};

function buildInventoryRows(): InventoryRow[] {
  const rows = products.flatMap((product) =>
    product.variants.map((variant) => {
      const onHand = variant.inventory;
      const unavailable = 0;
      const committed = 0;
      const incoming = 0;
      const available = Math.max(onHand - unavailable - committed, 0);
      const hasMultipleVariants = product.variants.length > 1;

      return {
        id: variant.id,
        productId: product.id,
        productTitle: product.title,
        variantOption: hasMultipleVariants ? variant.option : undefined,
        image: variant.image ?? product.images[0],
        sku: variant.sku,
        unavailable,
        committed,
        available,
        onHand,
        incoming,
      };
    }),
  );

  return [...rows].sort((firstRow: InventoryRow, secondRow: InventoryRow) => {
    const productComparison = firstRow.productTitle.localeCompare(
      secondRow.productTitle,
    );

    if (productComparison !== 0) return productComparison;

    return (firstRow.variantOption ?? '').localeCompare(
      secondRow.variantOption ?? '',
    );
  });
}

const inventoryRows = buildInventoryRows();

export function InventoryTable() {
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<Set<string>>(
    () => new Set(),
  );
  const hasSelectedInventory = selectedInventoryIds.size > 0;
  const allInventorySelected =
    selectedInventoryIds.size === inventoryRows.length;
  const someInventorySelected = hasSelectedInventory && !allInventorySelected;

  function setAllInventorySelected(checked: boolean) {
    setSelectedInventoryIds(
      checked ? new Set(inventoryRows.map((row) => row.id)) : new Set(),
    );
  }

  function setInventorySelected(inventoryId: string, checked: boolean) {
    setSelectedInventoryIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (checked) {
        nextIds.add(inventoryId);
      } else {
        nextIds.delete(inventoryId);
      }

      return nextIds;
    });
  }

  return (
    <section>
      <div className="flex flex-col gap-3">
        <SearchBar
          aria-label="Search inventory"
          className="mx-3"
          placeholder="Search and filter"
        />

        <Table.Root bleed stickyHeader={false}>
          <Table.Head>
            <Table.Row>
              <Table.Header type="checkbox">
                <Checkbox.Root
                  aria-label="Select all inventory"
                  aria-checked={someInventorySelected ? 'mixed' : undefined}
                  checked={hasSelectedInventory}
                  onCheckedChange={() =>
                    setAllInventorySelected(!allInventorySelected)
                  }
                >
                  <Checkbox.Indicator
                    variant={someInventorySelected ? 'indeterminate' : 'check'}
                  />
                </Checkbox.Root>
              </Table.Header>
              <Table.Header className="w-[34%]">Product</Table.Header>
              <Table.Header>SKU</Table.Header>
              <Table.Header className="text-right">Unavailable</Table.Header>
              <Table.Header className="text-right">Committed</Table.Header>
              <Table.Header className="text-right">Available</Table.Header>
              <Table.Header className="text-right">On hand</Table.Header>
              <Table.Header className="text-right">Incoming</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {inventoryRows.map((row) => (
              <Table.Row
                key={row.id}
                href={`/store/products/${row.productId}`}
                title={row.productTitle}
              >
                <Table.Cell type="checkbox">
                  <Checkbox.Root
                    aria-label={`Select ${row.productTitle}`}
                    checked={selectedInventoryIds.has(row.id)}
                    onCheckedChange={(checked) =>
                      setInventorySelected(row.id, checked === true)
                    }
                  >
                    <Checkbox.Indicator />
                  </Checkbox.Root>
                </Table.Cell>
                <Table.Cell link>
                  <span className="inline-flex items-center gap-3">
                    <Image
                      src={row.image}
                      alt=""
                      size={36}
                      borderRadius="lg"
                      shadow="sm"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="">
                      <span className="block truncate font-medium text-foreground">
                        {row.productTitle}
                      </span>
                      {row.variantOption ? (
                        <span className="mt-0.5 inline-flex rounded-sm bg-gray-200 px-1 text-sm font-medium text-secondary">
                          {row.variantOption}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </Table.Cell>
                <Table.Cell>{row.sku || 'No SKU'}</Table.Cell>
                <Table.Cell className="text-right tabular-nums">
                  <span>{row.unavailable}</span>
                </Table.Cell>
                <Table.Cell className="text-right tabular-nums">
                  <span>{row.committed}</span>
                </Table.Cell>
                <Table.Cell className="text-right tabular-nums">
                  <span>{row.available}</span>
                </Table.Cell>
                <Table.Cell className="text-right tabular-nums">
                  <span>{row.onHand}</span>
                </Table.Cell>
                <Table.Cell className="text-right tabular-nums">
                  <span>{row.incoming}</span>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </div>
    </section>
  );
}
