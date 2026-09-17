import { moreWaysToPayMethods } from '~/data/payment-methods';
import { Image, SearchBar, Section, Table } from '~/ui';

function MoreWaysToPayMethodsSection() {
  return (
    <Section bleed>
      <SearchBar
        bleed
        aria-label="Search payment providers"
        placeholder="Search"
        className="px-3 py-2"
      />
      <hr className="border-border" />
      <div className="px-3 py-2">
        <Table.Root stickyHeader={false}>
          <Table.Body>
            {moreWaysToPayMethods.map((method) => (
              <Table.Row
                key={method.name}
                title={`${method.name} payment method`}
              >
                <Table.Cell className="w-0">
                  <Image
                    alt=""
                    borderRadius="none"
                    className="h-6 w-[35px]"
                    objectFit="contain"
                    src={method.icon}
                  />
                </Table.Cell>
                <Table.Cell>
                  <span className="font-medium">{method.name}</span>
                </Table.Cell>
                <Table.Cell className="text-right text-muted-foreground">
                  {method.category}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </div>
    </Section>
  );
}

export { MoreWaysToPayMethodsSection };
