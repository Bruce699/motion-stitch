import { useState } from 'react';
import { customers } from '~/data/customers';
import { Badge, Checkbox, SearchBar, Table } from '~/ui';

export function CustomersTable() {
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(
    () => new Set(),
  );
  const hasSelectedCustomers = selectedCustomerIds.size > 0;
  const allCustomersSelected = selectedCustomerIds.size === customers.length;
  const someCustomersSelected = hasSelectedCustomers && !allCustomersSelected;

  function setAllCustomersSelected(checked: boolean) {
    setSelectedCustomerIds(
      checked ? new Set(customers.map((customer) => customer.id)) : new Set(),
    );
  }

  function setCustomerSelected(customerId: string, checked: boolean) {
    setSelectedCustomerIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (checked) {
        nextIds.add(customerId);
      } else {
        nextIds.delete(customerId);
      }

      return nextIds;
    });
  }

  return (
    <section>
      <div className="flex flex-col gap-3">
        <SearchBar
          aria-label="Search customers"
          className="mx-3"
          placeholder="Search customers"
        />

        <Table.Root bleed stickyHeader={false}>
          <Table.Head>
            <Table.Row>
              <Table.Header type="checkbox">
                <Checkbox.Root
                  aria-label="Select all customers"
                  aria-checked={someCustomersSelected ? 'mixed' : undefined}
                  checked={hasSelectedCustomers}
                  onCheckedChange={() =>
                    setAllCustomersSelected(!allCustomersSelected)
                  }
                >
                  <Checkbox.Indicator
                    variant={someCustomersSelected ? 'indeterminate' : 'check'}
                  />
                </Checkbox.Root>
              </Table.Header>
              <Table.Header className="w-1/3">Customer name</Table.Header>
              <Table.Header>Email subscription</Table.Header>
              <Table.Header>Location</Table.Header>
              <Table.Header className="text-right">Orders</Table.Header>
              <Table.Header className="text-right">Amount spent</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {customers.map((customer) => {
              return (
                <Table.Row
                  key={customer.id}
                  href={`/store/customers/${customer.id}`}
                  title={customer.name}
                >
                  <Table.Cell type="checkbox">
                    <Checkbox.Root
                      aria-label={`Select ${customer.name}`}
                      checked={selectedCustomerIds.has(customer.id)}
                      onCheckedChange={(checked) =>
                        setCustomerSelected(customer.id, checked === true)
                      }
                    >
                      <Checkbox.Indicator />
                    </Checkbox.Root>
                  </Table.Cell>
                  <Table.Cell link>
                    <span className="font-medium text-foreground">
                      {customer.name}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    {customer.emailSubscribed ? (
                      <Badge variant="success">Subscribed</Badge>
                    ) : (
                      <Badge>Not subscribed</Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>{customer.country}</Table.Cell>
                  <Table.Cell className="text-right tabular-nums">
                    {customer.orderCount}
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums">
                    {customer.lifetimeSpend}
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
