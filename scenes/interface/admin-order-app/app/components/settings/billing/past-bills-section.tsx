import React from 'react';
import { Badge } from '~/ui/components/badge/badge';
import { Checkbox } from '~/ui/components/checkbox/checkbox';
import { SearchBar } from '~/ui/components/search-bar/search-bar';
import { Section } from '~/ui/components/section/section';
import * as Table from '~/ui/components/table/table';

const pastBills = [
  {
    id: 'bill-448895349-1',
    bill: '448895349',
    dateIssued: 'Nov 22, 2025',
    reason: 'Billing Cycle Ended',
    total: '$39.99',
    status: 'Paid',
  },
  {
    id: 'bill-448895349-2',
    bill: '448895349',
    dateIssued: 'Oct 22, 2025',
    reason: 'Billing Cycle Ended',
    total: '$39.99',
    status: 'Paid',
  },
  {
    id: 'bill-448895349-3',
    bill: '448895349',
    dateIssued: 'Sep 22, 2025',
    reason: 'Billing Cycle Ended',
    total: '$39.99',
    status: 'Paid',
  },
  {
    id: 'bill-448895349-4',
    bill: '448895349',
    dateIssued: 'Aug 22, 2025',
    reason: 'Billing Cycle Ended',
    total: '$39.99',
    status: 'Paid',
  },
];

const pastBillIds = pastBills.map((bill) => bill.id);

export function PastBillsSection() {
  const [selectedBillIds, setSelectedBillIds] = React.useState(
    () => new Set<string>(),
  );
  const hasSelectedBills = selectedBillIds.size > 0;
  const allBillsSelected = selectedBillIds.size === pastBills.length;
  const someBillsSelected = hasSelectedBills && !allBillsSelected;

  function setAllBillsSelected(checked: boolean) {
    setSelectedBillIds(checked ? new Set(pastBillIds) : new Set());
  }

  function setBillSelected(id: string, checked: boolean) {
    setSelectedBillIds((currentBillIds) => {
      const nextBillIds = new Set(currentBillIds);

      if (checked) {
        nextBillIds.add(id);
      } else {
        nextBillIds.delete(id);
      }

      return nextBillIds;
    });
  }

  return (
    <Section title="Past bills" bleed>
      <div className="flex flex-col gap-2 py-2">
        <SearchBar
          aria-label="Search past bills"
          bleed
          placeholder="Search"
          className="pr-3 pl-2"
        />
        <div className="px-2">
          <Table.Root stickyHeader={false}>
            <Table.Head>
              <Table.Row>
                <Table.Header type="checkbox">
                  <Checkbox.Root
                    aria-label="Select all past bills"
                    aria-checked={someBillsSelected ? 'mixed' : undefined}
                    checked={hasSelectedBills}
                    onCheckedChange={() =>
                      setAllBillsSelected(!allBillsSelected)
                    }
                  >
                    <Checkbox.Indicator
                      variant={someBillsSelected ? 'indeterminate' : 'check'}
                    />
                  </Checkbox.Root>
                </Table.Header>
                <Table.Header>Bill</Table.Header>
                <Table.Header>Date issued</Table.Header>
                <Table.Header>Reason</Table.Header>
                <Table.Header>Total</Table.Header>
                <Table.Header>Status</Table.Header>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {pastBills.map((bill) => (
                <Table.Row key={bill.id}>
                  <Table.Cell type="checkbox">
                    <Checkbox.Root
                      aria-label={`Select bill ${bill.bill}`}
                      checked={selectedBillIds.has(bill.id)}
                      onCheckedChange={(checked) =>
                        setBillSelected(bill.id, Boolean(checked))
                      }
                    >
                      <Checkbox.Indicator />
                    </Checkbox.Root>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-medium">{bill.bill}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-secondary">{bill.dateIssued}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-secondary">{bill.reason}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-secondary tabular-nums">
                      {bill.total}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="success">{bill.status}</Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </div>
      </div>
    </Section>
  );
}
