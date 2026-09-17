import type { Product } from '~/data/products';
import {
  Badge,
  Button,
  Icon,
  Image,
  Section,
  SegmentedControl,
  Table,
} from '~/ui';

function CollectionProducts({
  collectionProducts,
}: {
  collectionProducts: Product[];
}) {
  return (
    <Section
      title={
        <span className="inline-flex items-baseline gap-2">
          <span>Products</span>
          <span className="text-lg text-secondary">
            {collectionProducts.length}
          </span>
        </span>
      }
      action={
        <div className="flex items-center gap-2">
          <SegmentedControl
            ariaLabel="Product view"
            defaultValue="list"
            segments={[
              {
                icon: 'Grid',
                value: 'grid',
                ariaLabel: 'Grid view',
              },
              {
                icon: 'TableRows2',
                value: 'list',
                ariaLabel: 'List view',
              },
            ]}
          />
          <Button
            onClick={() => {}}
            variant="secondary"
            type="button"
            prefix={<Icon name="Sorting" />}
            suffix={
              <span className="text-muted-foreground">
                <Icon name="ChevronExpandY" size={14} />
              </span>
            }
          >
            Most relevant
          </Button>
        </div>
      }
      bleed
    >
      <div className="p-3">
        <Table.Root stickyHeader={false}>
          <Table.Head>
            <Table.Row>
              <Table.Header>Product</Table.Header>
              <Table.Header className="text-right">Status</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {collectionProducts.map((product) => (
              <Table.Row
                key={product.id}
                href={`/store/products/${product.id}`}
                title={product.title}
              >
                <Table.Cell link>
                  <div className="flex items-center gap-3">
                    <Image
                      src={product.images[0] ?? ''}
                      alt=""
                      size={40}
                      borderRadius="lg"
                      shadow="sm"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-foreground">
                        {product.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {product.variants[0] ? (
                          <Badge>
                            <span className="text-muted-foreground">
                              {product.variants[0].title}
                            </span>
                            <span className="ml-1 font-book text-primary">
                              {product.variants[0].option}
                            </span>
                          </Badge>
                        ) : null}
                        {product.variants[0]?.sku ? (
                          <Badge>
                            <span className="text-muted-foreground">SKU</span>
                            <span className="ml-1 font-book text-primary tabular-nums">
                              {product.variants[0].sku}
                            </span>
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell className="text-right">
                  <Badge
                    variant={
                      product.status === 'active' ? 'success' : 'default'
                    }
                  >
                    {product.status === 'active' ? 'Active' : 'Draft'}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </div>
    </Section>
  );
}

export { CollectionProducts };
