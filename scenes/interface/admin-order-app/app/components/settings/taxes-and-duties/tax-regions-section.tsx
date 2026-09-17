import { taxRegions } from '~/data/tax-regions';
import { Badge } from '~/ui/components/badge/badge';
import { Button } from '~/ui/components/button/button';
import { Checkbox } from '~/ui/components/checkbox/checkbox';
import { Icon } from '~/ui/components/icon/icon';
import { Link } from '~/ui/components/link/link';
import { SearchBar } from '~/ui/components/search-bar/search-bar';
import { Section } from '~/ui/components/section/section';
import { ShopifyLogo } from '~/ui/components/shopify-logo/shopify-logo';
import * as Table from '~/ui/components/table/table';

export function TaxRegionsSection() {
  return (
    <div className="flex flex-col gap-5">
      <ShopifyTaxServicesCard />
      <TaxRegionsTableSection />
      <GlobalTaxReportCard />
    </div>
  );
}

function ShopifyTaxServicesCard() {
  return (
    <Section>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-green-300/25">
            <ShopifyLogo className="size-7" aria-label="Shopify" />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm text-muted-foreground">Using</p>
            <p className="font-medium">Shopify tax services</p>
          </div>
        </div>
        <Button onClick={() => {}} variant="secondary">
          Manage providers
        </Button>
      </div>
    </Section>
  );
}

function TaxRegionsTableSection() {
  return (
    <Section
      title="Tax regions"
      subtitle={
        <>
          Areas where your customers will pay tax, and where you will collect
          and remit.{' '}
          <Link
            to="/store/settings/shipping-and-delivery"
            className="text-foreground underline underline-offset-2"
          >
            Create a shipping zone
          </Link>{' '}
          to add a new tax region. If you're unsure about your tax liability,
          check with a tax professional.
        </>
      }
      bleed
    >
      <div className="flex flex-col gap-2 py-2">
        <SearchBar
          aria-label="Search tax regions"
          bleed
          placeholder="Search"
          className="pr-3 pl-2"
        />
        <div className="px-2">
          <Table.Root stickyHeader={false}>
            <Table.Head>
              <Table.Row>
                <Table.Header type="checkbox">
                  <Checkbox.Root aria-label="Select all tax regions">
                    <Checkbox.Indicator />
                  </Checkbox.Root>
                </Table.Header>
                <Table.Header className="w-1/3">Region</Table.Header>
                <Table.Header className="w-1/3">Collecting</Table.Header>
                <Table.Header className="w-1/3">Tax service</Table.Header>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {taxRegions.map((region) => (
                <Table.Row key={region.countryCode}>
                  <Table.Cell type="checkbox">
                    <Checkbox.Root aria-label={`Select ${region.region}`}>
                      <Checkbox.Indicator />
                    </Checkbox.Root>
                  </Table.Cell>
                  <Table.Cell className="w-1/3">
                    <span className="inline-flex items-center gap-3">
                      <span aria-hidden className="text-lg leading-none">
                        {region.flag}
                      </span>
                      <span className="font-medium">{region.region}</span>
                    </span>
                  </Table.Cell>
                  <Table.Cell className="w-1/3">
                    {region.collecting ? (
                      <Badge>Taxes</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Table.Cell>
                  <Table.Cell className="w-1/3">
                    <span className="text-secondary">{region.service}</span>
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

function GlobalTaxReportCard() {
  return (
    <Section>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            <Icon name="ReportFile" />
          </span>
          <p>Global collected tax report</p>
        </div>
        <Button onClick={() => {}} variant="secondary">
          View report
        </Button>
      </div>
    </Section>
  );
}
