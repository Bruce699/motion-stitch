import { useState } from 'react';
import {
  type CustomerSegment,
  customerSegments,
} from '~/data/customer-segments';
import {
  Avatar,
  Button,
  Checkbox,
  Icon,
  Menu,
  SearchBar,
  ShopifyLogo,
  Table,
} from '~/ui';

function CreatorCell({
  createdBy,
}: {
  createdBy: CustomerSegment['createdBy'];
}) {
  if (createdBy.type === 'shopify') {
    return (
      <span className="inline-flex items-center gap-2">
        <ShopifyLogo className="mx-0.5 size-5" />
        {createdBy.name}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Avatar
        initials={createdBy.initials}
        name={createdBy.name}
        size="md"
        rounded
      />
      {createdBy.name}
    </span>
  );
}

export function CustomerSegmentsTable() {
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const hasSelectedSegments = selectedSegmentIds.size > 0;
  const allSegmentsSelected =
    selectedSegmentIds.size === customerSegments.length;
  const someSegmentsSelected = hasSelectedSegments && !allSegmentsSelected;

  function setAllSegmentsSelected(checked: boolean) {
    setSelectedSegmentIds(
      checked
        ? new Set(customerSegments.map((segment) => segment.id))
        : new Set(),
    );
  }

  function setSegmentSelected(segmentId: string, checked: boolean) {
    setSelectedSegmentIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (checked) {
        nextIds.add(segmentId);
      } else {
        nextIds.delete(segmentId);
      }

      return nextIds;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <SearchBar
        aria-label="Search segments"
        className="mx-3"
        placeholder="Search segments"
      />

      <Table.Root bleed dense stickyHeader={false}>
        <Table.Head>
          <Table.Row>
            <Table.Header type="checkbox">
              <Checkbox.Root
                aria-label="Select all segments"
                aria-checked={someSegmentsSelected ? 'mixed' : undefined}
                checked={hasSelectedSegments}
                onCheckedChange={() =>
                  setAllSegmentsSelected(!allSegmentsSelected)
                }
              >
                <Checkbox.Indicator
                  variant={someSegmentsSelected ? 'indeterminate' : 'check'}
                />
              </Checkbox.Root>
            </Table.Header>
            <Table.Header className="w-[46%]">Name</Table.Header>
            <Table.Header className="text-right">% of customers</Table.Header>
            <Table.Header>
              <span className="inline-flex items-center gap-1">
                Last activity
                <Icon name="ChevronExpandY" size={12} />
              </span>
            </Table.Header>
            <Table.Header>Created by</Table.Header>
            <Table.Header aria-label="Actions" className="w-px" />
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {customerSegments.map((segment) => (
            <Table.Row key={segment.id}>
              <Table.Cell type="checkbox">
                <Checkbox.Root
                  aria-label={`Select ${segment.name}`}
                  checked={selectedSegmentIds.has(segment.id)}
                  onCheckedChange={(checked) =>
                    setSegmentSelected(segment.id, checked === true)
                  }
                >
                  <Checkbox.Indicator />
                </Checkbox.Root>
              </Table.Cell>
              <Table.Cell>
                <span className="font-medium text-foreground">
                  {segment.name}
                </span>
              </Table.Cell>
              <Table.Cell className="text-right tabular-nums">
                {segment.customerPercentage}%
              </Table.Cell>
              <Table.Cell>{segment.activity}</Table.Cell>
              <Table.Cell>
                <CreatorCell createdBy={segment.createdBy} />
              </Table.Cell>
              <Table.Cell className="pr-1">
                <Menu
                  trigger={
                    <Button
                      onClick={() => {}}
                      aria-label={`${segment.name} actions`}
                      size="sm-icon"
                      variant="plain"
                    >
                      <Icon name="Dots" size={14} />
                    </Button>
                  }
                  options={[
                    { label: 'Edit segment' },
                    { label: 'Duplicate' },
                    { type: 'separator' },
                    {
                      label: 'Delete segment',
                      disabled: segment.createdBy.type === 'shopify',
                    },
                  ]}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </div>
  );
}
