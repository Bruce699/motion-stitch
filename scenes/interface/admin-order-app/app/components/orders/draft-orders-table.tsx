import { useState } from 'react';
import { getCustomer } from '~/data/customers';
import type { OrderPaymentStatus } from '~/data/orders';
import { orders } from '~/data/orders';
import { Badge, Checkbox, Icon, ResourcePreview, SearchBar, Table } from '~/ui';
import { clsx } from 'clsx';

function statusVariant(status: OrderPaymentStatus) {
  if (status === 'Payment pending') return 'caution';

  return 'default';
}

function isOrderComplete(order: (typeof orders)[number]) {
  return (
    order.paymentStatus !== 'Payment pending' &&
    order.fulfillmentStatus === 'Fulfilled'
  );
}

export function DraftOrdersTable() {
  const [selectedDraftOrderIds, setSelectedDraftOrderIds] = useState<
    Set<string>
  >(() => new Set());
  const hasSelectedDraftOrders = selectedDraftOrderIds.size > 0;
  const allDraftOrdersSelected = selectedDraftOrderIds.size === orders.length;
  const someDraftOrdersSelected =
    hasSelectedDraftOrders && !allDraftOrdersSelected;

  function setAllDraftOrdersSelected(checked: boolean) {
    setSelectedDraftOrderIds(
      checked ? new Set(orders.map((draftOrder) => draftOrder.id)) : new Set(),
    );
  }

  function setDraftOrderSelected(draftOrderId: string, checked: boolean) {
    setSelectedDraftOrderIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (checked) {
        nextIds.add(draftOrderId);
      } else {
        nextIds.delete(draftOrderId);
      }

      return nextIds;
    });
  }

  return (
    <section>
      <div className="flex flex-col gap-3">
        <SearchBar
          aria-label="Search draft orders"
          className="mx-3"
          placeholder="Search and filter"
        />

        <Table.Root bleed dense stickyHeader={false}>
          <Table.Head>
            <Table.Row>
              <Table.Header type="checkbox">
                <Checkbox.Root
                  aria-label="Select all draft orders"
                  aria-checked={someDraftOrdersSelected ? 'mixed' : undefined}
                  checked={hasSelectedDraftOrders}
                  onCheckedChange={() =>
                    setAllDraftOrdersSelected(!allDraftOrdersSelected)
                  }
                >
                  <Checkbox.Indicator
                    variant={
                      someDraftOrdersSelected ? 'indeterminate' : 'check'
                    }
                  />
                </Checkbox.Root>
              </Table.Header>
              <Table.Header>Draft order</Table.Header>
              <Table.Header>PO number</Table.Header>
              <Table.Header>
                <span className="inline-flex items-center gap-1">
                  Date
                  <Icon name="ChevronDown" size={12} />
                </span>
              </Table.Header>
              <Table.Header>Customer</Table.Header>
              <Table.Header type="picker">Status</Table.Header>
              <Table.Header className="text-right">Total</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {orders.map((draftOrder) => {
              const customer = getCustomer(draftOrder.customerId);

              return (
                <Table.Row
                  key={draftOrder.id}
                  href={`/store/orders/${draftOrder.id}`}
                  muted={isOrderComplete(draftOrder)}
                  title={draftOrder.orderNumber}
                >
                  <Table.Cell type="checkbox">
                    <Checkbox.Root
                      aria-label={`Select ${draftOrder.orderNumber}`}
                      checked={selectedDraftOrderIds.has(draftOrder.id)}
                      onCheckedChange={(checked) =>
                        setDraftOrderSelected(draftOrder.id, checked === true)
                      }
                    >
                      <Checkbox.Indicator />
                    </Checkbox.Root>
                  </Table.Cell>
                  <Table.Cell link>
                    <span className="font-medium text-foreground">
                      {draftOrder.orderNumber}
                    </span>
                  </Table.Cell>
                  <Table.Cell />
                  <Table.Cell>{draftOrder.placedAt}</Table.Cell>
                  <Table.Cell>
                    {customer ? (
                      <ResourcePreview
                        type="customer"
                        resource={customer}
                        trigger={<span>{draftOrder.customer}</span>}
                      />
                    ) : (
                      draftOrder.customer
                    )}
                    {draftOrder.customerNote ? (
                      <p className="truncate font-book text-secondary">
                        {draftOrder.customerNote}
                      </p>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell type="picker">
                    <Badge
                      variant={statusVariant(draftOrder.paymentStatus)}
                      className={clsx(
                        'gap-1',
                        statusVariant(draftOrder.paymentStatus) === 'default' &&
                          'border-transparent bg-gray-100 text-gray-600 shadow-none',
                      )}
                    >
                      {draftOrder.paymentStatus}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {draftOrder.total}
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
