import { useState } from 'react';
import { shippingLabels } from '~/data/shipping-labels';
import { Badge, Checkbox, SearchBar, Table } from '~/ui';

export function ShippingLabelsTable() {
  const [selectedLabelIds, setSelectedLabelIds] = useState<Set<string>>(
    () => new Set(),
  );
  const hasSelectedLabels = selectedLabelIds.size > 0;
  const allLabelsSelected = selectedLabelIds.size === shippingLabels.length;
  const someLabelsSelected = hasSelectedLabels && !allLabelsSelected;

  function setAllLabelsSelected(checked: boolean) {
    setSelectedLabelIds(
      checked ? new Set(shippingLabels.map((label) => label.id)) : new Set(),
    );
  }

  function setLabelSelected(labelId: string, checked: boolean) {
    setSelectedLabelIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (checked) {
        nextIds.add(labelId);
      } else {
        nextIds.delete(labelId);
      }

      return nextIds;
    });
  }

  return (
    <section>
      <div className="flex flex-col gap-3">
        <SearchBar
          aria-label="Search shipping labels"
          className="mx-3"
          placeholder="Search and filter"
        />

        <Table.Root bleed dense stickyHeader={false}>
          <Table.Head>
            <Table.Row>
              <Table.Header type="checkbox">
                <Checkbox.Root
                  aria-label="Select all shipping labels"
                  aria-checked={someLabelsSelected ? 'mixed' : undefined}
                  checked={hasSelectedLabels}
                  onCheckedChange={() =>
                    setAllLabelsSelected(!allLabelsSelected)
                  }
                >
                  <Checkbox.Indicator
                    variant={someLabelsSelected ? 'indeterminate' : 'check'}
                  />
                </Checkbox.Root>
              </Table.Header>
              <Table.Header>Order</Table.Header>
              <Table.Header>Items</Table.Header>
              <Table.Header>Package</Table.Header>
              <Table.Header>Weight</Table.Header>
              <Table.Header>Cost</Table.Header>
              <Table.Header>Shipping service</Table.Header>
              <Table.Header type="picker">Document status</Table.Header>
              <Table.Header type="picker">Delivery status</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {shippingLabels.map((label) => (
              <Table.Row
                key={label.id}
                href={`/store/orders/${label.id}`}
                title={label.orderNumber}
              >
                <Table.Cell type="checkbox">
                  <Checkbox.Root
                    aria-label={`Select ${label.orderNumber}`}
                    checked={selectedLabelIds.has(label.id)}
                    onCheckedChange={(checked) =>
                      setLabelSelected(label.id, checked === true)
                    }
                  >
                    <Checkbox.Indicator />
                  </Checkbox.Root>
                </Table.Cell>
                <Table.Cell link>
                  <span className="flex gap-1 text-primary">
                    <span className="font-medium">{label.orderNumber}</span>
                    <span className="mr-1 font-medium">·</span>
                    <span className="font-book">{label.customer}</span>
                  </span>
                  <p className="font-book text-secondary">
                    {label.destination}
                  </p>
                </Table.Cell>
                <Table.Cell>
                  <span className="inline-flex items-center gap-2">
                    <Badge>{label.itemCount}</Badge>
                    {label.items}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  {label.packageName}
                  <p className="font-book text-secondary">{label.dimensions}</p>
                </Table.Cell>
                <Table.Cell>{label.weight}</Table.Cell>
                <Table.Cell>{label.cost}</Table.Cell>
                <Table.Cell>
                  <span className="inline-flex items-center gap-3">
                    <img
                      src={label.carrier.imageSrc}
                      alt={label.carrier.name}
                      className="mt-0.5 size-4 shrink-0"
                    />
                    <span>
                      {label.shippingService}
                      <p className="font-book text-secondary">
                        {label.trackingNumber}
                      </p>
                    </span>
                  </span>
                </Table.Cell>
                <Table.Cell type="picker">
                  <Badge>{label.documentStatus}</Badge>
                </Table.Cell>
                <Table.Cell type="picker">
                  <Badge
                    variant={
                      label.deliveryStatus === 'Delivered' ? 'success' : 'info'
                    }
                  >
                    {label.deliveryStatus}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </div>
    </section>
  );
}
