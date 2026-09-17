import { useState } from 'react';
import { abandonedCheckouts } from '~/data/abandoned-checkouts';
import { getCustomerByName } from '~/data/customers';
import { Badge, Checkbox, Icon, SearchBar, Table } from '~/ui';

export function AbandonedCheckoutsTable() {
  const [selectedCheckoutIds, setSelectedCheckoutIds] = useState<Set<string>>(
    () => new Set(),
  );
  const hasSelectedCheckouts = selectedCheckoutIds.size > 0;
  const allCheckoutsSelected =
    selectedCheckoutIds.size === abandonedCheckouts.length;
  const someCheckoutsSelected = hasSelectedCheckouts && !allCheckoutsSelected;

  function setAllCheckoutsSelected(checked: boolean) {
    setSelectedCheckoutIds(
      checked
        ? new Set(abandonedCheckouts.map((checkout) => checkout.id))
        : new Set(),
    );
  }

  function setCheckoutSelected(checkoutId: string, checked: boolean) {
    setSelectedCheckoutIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (checked) {
        nextIds.add(checkoutId);
      } else {
        nextIds.delete(checkoutId);
      }

      return nextIds;
    });
  }

  return (
    <section>
      <div className="flex flex-col gap-3">
        <SearchBar
          aria-label="Search abandoned checkouts"
          className="mx-3"
          placeholder="Search and filter"
        />

        <Table.Root bleed stickyHeader={false}>
          <Table.Head>
            <Table.Row>
              <Table.Header type="checkbox">
                <Checkbox.Root
                  aria-label="Select all abandoned checkouts"
                  aria-checked={someCheckoutsSelected ? 'mixed' : undefined}
                  checked={hasSelectedCheckouts}
                  onCheckedChange={() =>
                    setAllCheckoutsSelected(!allCheckoutsSelected)
                  }
                >
                  <Checkbox.Indicator
                    variant={someCheckoutsSelected ? 'indeterminate' : 'check'}
                  />
                </Checkbox.Root>
              </Table.Header>
              <Table.Header>Checkout</Table.Header>
              <Table.Header>
                <span className="inline-flex items-center gap-1">
                  Date
                  <Icon name="ChevronExpandY" size={12} />
                </span>
              </Table.Header>
              <Table.Header>Customer</Table.Header>
              <Table.Header>Region</Table.Header>
              <Table.Header type="picker">Recovery Status</Table.Header>
              <Table.Header className="text-right">Total</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {abandonedCheckouts.map((checkout) => {
              const customer = getCustomerByName(checkout.customer);

              return (
                <Table.Row key={checkout.id}>
                  <Table.Cell type="checkbox">
                    <Checkbox.Root
                      aria-label={`Select ${checkout.checkoutNumber}`}
                      checked={selectedCheckoutIds.has(checkout.id)}
                      onCheckedChange={(checked) =>
                        setCheckoutSelected(checkout.id, checked === true)
                      }
                    >
                      <Checkbox.Indicator />
                    </Checkbox.Root>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-medium text-foreground">
                      {checkout.checkoutNumber}
                    </span>
                  </Table.Cell>
                  <Table.Cell>{checkout.placedAt}</Table.Cell>
                  <Table.Cell
                    preview={
                      customer
                        ? { type: 'customer', resource: customer }
                        : undefined
                    }
                  >
                    {checkout.customer}
                  </Table.Cell>
                  <Table.Cell>{checkout.region}</Table.Cell>
                  <Table.Cell type="picker">
                    <Badge variant="caution">{checkout.recoveryStatus}</Badge>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {checkout.total}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </div>
    </section>
  );
}
