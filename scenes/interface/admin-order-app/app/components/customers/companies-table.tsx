import { useState } from 'react';
import { companies } from '~/data/companies';
import { Badge, Checkbox, SearchBar, Table } from '~/ui';

function locationLabel(locationCount: number) {
  return `${locationCount} ${locationCount === 1 ? 'location' : 'locations'}`;
}

function orderLabel(orderCount: number) {
  return `${orderCount} ${orderCount === 1 ? 'order' : 'orders'}`;
}

export function CompaniesTable() {
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(
    () => new Set(),
  );
  const hasSelectedCompanies = selectedCompanyIds.size > 0;
  const allCompaniesSelected = selectedCompanyIds.size === companies.length;
  const someCompaniesSelected = hasSelectedCompanies && !allCompaniesSelected;

  function setAllCompaniesSelected(checked: boolean) {
    setSelectedCompanyIds(
      checked ? new Set(companies.map((company) => company.id)) : new Set(),
    );
  }

  function setCompanySelected(companyId: string, checked: boolean) {
    setSelectedCompanyIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (checked) {
        nextIds.add(companyId);
      } else {
        nextIds.delete(companyId);
      }

      return nextIds;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <SearchBar
        aria-label="Search companies"
        className="mx-3"
        placeholder="Search and filter"
      />

      <Table.Root bleed dense stickyHeader={false}>
        <Table.Head>
          <Table.Row>
            <Table.Header type="checkbox">
              <Checkbox
                aria-label="Select all companies"
                checked={hasSelectedCompanies}
                indeterminate={someCompaniesSelected}
                onCheckedChange={() =>
                  setAllCompaniesSelected(!allCompaniesSelected)
                }
              />
            </Table.Header>
            <Table.Header className="w-1/4">Company</Table.Header>
            <Table.Header type="picker">Ordering</Table.Header>
            <Table.Header>Locations</Table.Header>
            <Table.Header>Main contact</Table.Header>
            <Table.Header>Total orders</Table.Header>
            <Table.Header className="text-right">Total sales</Table.Header>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {companies.map((company) => (
            <Table.Row key={company.id}>
              <Table.Cell type="checkbox">
                <Checkbox
                  aria-label={`Select ${company.name}`}
                  checked={selectedCompanyIds.has(company.id)}
                  onCheckedChange={(checked) =>
                    setCompanySelected(company.id, checked === true)
                  }
                />
              </Table.Cell>
              <Table.Cell>
                <span className="font-medium text-foreground">
                  {company.name}
                </span>
              </Table.Cell>
              <Table.Cell type="picker">
                <Badge variant="success" className="gap-1">
                  <span className="size-1.5 rounded-full bg-current" />
                  {company.orderingStatus}
                </Badge>
              </Table.Cell>
              <Table.Cell>{locationLabel(company.locationCount)}</Table.Cell>
              <Table.Cell>
                {company.mainContact ?? 'No main contact'}
              </Table.Cell>
              <Table.Cell>{orderLabel(company.orderCount)}</Table.Cell>
              <Table.Cell className="text-right tabular-nums">
                {company.totalSales}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </div>
  );
}
