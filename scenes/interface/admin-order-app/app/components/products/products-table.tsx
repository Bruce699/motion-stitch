import { useState } from 'react';
import { products, type Product } from '~/data/products';
import { currentStore } from '~/data/stores';
import { Badge, Checkbox, Image, SearchBar, Table } from '~/ui';

function productStatusVariant(status: string) {
  return status === 'active' ? 'success' : 'info';
}

function productStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function inventoryLabel(product: Product) {
  const inventory = product.variants.reduce(
    (total, variant) => total + variant.inventory,
    0,
  );

  if (product.productType === 'Gift card') return 'Inventory not tracked';
  if (inventory === 0) return '0 in stock';
  if (product.variants.length === 1) return `${inventory} in stock`;

  return `${inventory} in stock for ${product.variants.length} variants`;
}

export function ProductsTable() {
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    () => new Set(),
  );
  const hasSelectedProducts = selectedProductIds.size > 0;
  const allProductsSelected = selectedProductIds.size === products.length;
  const someProductsSelected = hasSelectedProducts && !allProductsSelected;

  function setAllProductsSelected(checked: boolean) {
    setSelectedProductIds(
      checked ? new Set(products.map((product) => product.id)) : new Set(),
    );
  }

  function setProductSelected(productId: string, checked: boolean) {
    setSelectedProductIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (checked) {
        nextIds.add(productId);
      } else {
        nextIds.delete(productId);
      }

      return nextIds;
    });
  }

  return (
    <section>
      <div className="flex flex-col gap-3">
        <SearchBar
          aria-label="Search products"
          className="mx-3"
          placeholder="Search and filter"
        />

        <Table.Root bleed stickyHeader={false}>
          <Table.Head>
            <Table.Row>
              <Table.Header type="checkbox">
                <Checkbox.Root
                  aria-label="Select all products"
                  aria-checked={someProductsSelected ? 'mixed' : undefined}
                  checked={hasSelectedProducts}
                  onCheckedChange={() =>
                    setAllProductsSelected(!allProductsSelected)
                  }
                >
                  <Checkbox.Indicator
                    variant={someProductsSelected ? 'indeterminate' : 'check'}
                  />
                </Checkbox.Root>
              </Table.Header>
              <Table.Header className="w-88">Product</Table.Header>
              <Table.Header type="picker">Status</Table.Header>
              <Table.Header>Inventory</Table.Header>
              <Table.Header className="w-40">Category</Table.Header>
              <Table.Header type="picker" className="text-right">
                Channels
              </Table.Header>
              <Table.Header>Vendor</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {products.map((product) => {
              const inventory = inventoryLabel(product);

              return (
                <Table.Row
                  key={product.id}
                  href={`/store/products/${product.id}`}
                  title={product.title}
                >
                  <Table.Cell type="checkbox">
                    <Checkbox.Root
                      aria-label={`Select ${product.title}`}
                      checked={selectedProductIds.has(product.id)}
                      onCheckedChange={(checked) =>
                        setProductSelected(product.id, checked === true)
                      }
                    >
                      <Checkbox.Indicator />
                    </Checkbox.Root>
                  </Table.Cell>
                  <Table.Cell link>
                    <span className="inline-flex items-center gap-3">
                      <Image
                        src={product.images[0]}
                        alt=""
                        size={36}
                        borderRadius="lg"
                        shadow="sm"
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="block truncate font-medium text-foreground">
                        {product.title}
                      </span>
                    </span>
                  </Table.Cell>
                  <Table.Cell type="picker">
                    <Badge variant={productStatusVariant(product.status)}>
                      {productStatusLabel(product.status)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell
                    className={
                      inventory === '0 in stock' ? 'text-red-900' : undefined
                    }
                  >
                    {inventory}
                  </Table.Cell>
                  <Table.Cell className="w-40">{product.category}</Table.Cell>
                  <Table.Cell type="picker" className="text-right tabular-nums">
                    {product.channelIds.length}
                  </Table.Cell>
                  <Table.Cell>{currentStore.name}</Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </div>
    </section>
  );
}
