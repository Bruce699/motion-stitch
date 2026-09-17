import { useState } from 'react';
import type { DiscountCombinationType } from '~/data/discounts';
import { discounts } from '~/data/discounts';
import { OrdersIcon } from '~/icons/navigation/orders';
import { ProductsIcon } from '~/icons/navigation/products';
import { SegmentsIcon } from '~/icons/navigation/segments';
import { Badge, Checkbox, Icon, SearchBar, Table } from '~/ui';
import { clsx } from 'clsx';

function CombinationIcon({ type }: { type: DiscountCombinationType }) {
  if (type === 'products') return <ProductsIcon />;
  if (type === 'orders') return <OrdersIcon />;

  return <Icon name="TruckFast" size={14} />;
}

export function DiscountsTable() {
  const [selectedDiscountIds, setSelectedDiscountIds] = useState<Set<string>>(
    () => new Set(),
  );
  const hasSelectedDiscounts = selectedDiscountIds.size > 0;
  const allDiscountsSelected = selectedDiscountIds.size === discounts.length;
  const someDiscountsSelected = hasSelectedDiscounts && !allDiscountsSelected;

  function setAllDiscountsSelected(checked: boolean) {
    setSelectedDiscountIds(
      checked ? new Set(discounts.map((discount) => discount.id)) : new Set(),
    );
  }

  function setDiscountSelected(discountId: string, checked: boolean) {
    setSelectedDiscountIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (checked) {
        nextIds.add(discountId);
      } else {
        nextIds.delete(discountId);
      }

      return nextIds;
    });
  }

  return (
    <section>
      <div className="flex flex-col gap-3">
        <SearchBar
          aria-label="Search discounts"
          className="mx-3"
          placeholder="Search and filter"
        />

        <Table.Root bleed stickyHeader={false}>
          <Table.Head>
            <Table.Row>
              <Table.Header type="checkbox">
                <Checkbox.Root
                  aria-label="Select all discounts"
                  aria-checked={someDiscountsSelected ? 'mixed' : undefined}
                  checked={hasSelectedDiscounts}
                  onCheckedChange={() =>
                    setAllDiscountsSelected(!allDiscountsSelected)
                  }
                >
                  <Checkbox.Indicator
                    variant={someDiscountsSelected ? 'indeterminate' : 'check'}
                  />
                </Checkbox.Root>
              </Table.Header>
              <Table.Header>Title</Table.Header>
              <Table.Header type="picker" className="w-px">
                Status
              </Table.Header>
              <Table.Header>Method</Table.Header>
              <Table.Header>Eligibility</Table.Header>
              <Table.Header>Type</Table.Header>
              <Table.Header>Combinations</Table.Header>
              <Table.Header className="text-right">Used</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {discounts.map((discount) => (
              <Table.Row
                key={discount.id}
                href={`/store/products/discounts/${discount.id}`}
                title={discount.title}
              >
                <Table.Cell type="checkbox">
                  <span className="relative z-10 inline-flex justify-center">
                    <Checkbox.Root
                      aria-label={`Select ${discount.title}`}
                      checked={selectedDiscountIds.has(discount.id)}
                      onCheckedChange={(checked) =>
                        setDiscountSelected(discount.id, checked === true)
                      }
                    >
                      <Checkbox.Indicator />
                    </Checkbox.Root>
                  </span>
                </Table.Cell>
                <Table.Cell link className="w-100">
                  <span className="block font-medium text-foreground">
                    {discount.title}
                    <span className="block truncate font-book text-secondary">
                      {discount.description}
                    </span>
                  </span>
                </Table.Cell>
                <Table.Cell type="picker" className="w-px">
                  <Badge
                    variant={
                      discount.status === 'Active' ? 'success' : 'default'
                    }
                    className={clsx(
                      discount.status === 'Expired' &&
                        'h-5 border-transparent bg-gray-100 px-1.5 text-gray-600 shadow-none',
                    )}
                  >
                    {discount.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{discount.method}</Table.Cell>
                <Table.Cell>
                  <span className="inline-flex items-center gap-2">
                    <SegmentsIcon />
                    {discount.eligibility}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className="inline-flex items-center gap-2">
                    <Icon name={discount.typeIcon} size={14} />
                    {discount.type}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    {discount.combinations.map((combination) => (
                      <span
                        key={combination.type}
                        className={clsx(
                          'inline-flex transition-opacity',
                          combination.active ? 'opacity-100' : 'opacity-50',
                        )}
                      >
                        <CombinationIcon type={combination.type} />
                      </span>
                    ))}
                  </span>
                </Table.Cell>
                <Table.Cell className="text-right">{discount.used}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </div>
    </section>
  );
}
