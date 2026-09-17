import { Badge, Button, Icon, Image, InputStepper, Section } from '~/ui';
import type { OrderDetailLineItem } from '~/data/order-line-items';

export function CreateShippingLabelItems({
  lineItems,
}: {
  lineItems: OrderDetailLineItem[];
}) {
  return (
    <Section
      title="Items"
      bleed
      wrapperBg="bg-destructive"
      wrapperContent={
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 pe-3 text-destructive-foreground">
          <div className="flex items-center gap-2">
            <Icon name="TriangleWarning" />
            <span>Item value needed to see shipping services</span>
          </div>
          <Button
            onClick={() => {}}
            type="button"
            variant="plain"
            size="sm"
            tone="destructive"
          >
            Add value
          </Button>
        </div>
      }
    >
      <div className="divide-y divide-border px-4">
        {lineItems.map((lineItem, index) => {
          const image =
            lineItem.product?.variants[index]?.image ??
            lineItem.product?.images[0] ??
            '';

          return (
            <div
              key={lineItem.id}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-5 py-3"
            >
              <div className="flex items-center gap-3">
                <Image
                  src={image}
                  alt={lineItem.product?.title}
                  size={36}
                  borderRadius="lg"
                  shadow="sm"
                  loading="lazy"
                  decoding="async"
                />
                <div className="">
                  <p className="truncate font-medium">
                    {lineItem.product?.title ?? 'Unknown product'}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {lineItem.variantOptions.map((option) => (
                      <Badge key={`${lineItem.id}-${option.name}`}>
                        <span className="text-muted-foreground">
                          {option.name}
                        </span>
                        <span className="ml-1 font-book text-primary">
                          {option.value}
                        </span>
                      </Badge>
                    ))}
                    {lineItem.sku ? (
                      <Badge>
                        <span className="text-muted-foreground">SKU</span>
                        <span className="ml-1 font-book text-primary">
                          {lineItem.sku}
                        </span>
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>
              <InputStepper
                defaultValue={lineItem.quantity}
                max={lineItem.quantity}
                inputLabel="Item quantity"
                decrementLabel="Decrease quantity"
                incrementLabel="Increase quantity"
              />
              <span className="min-w-12 text-right tabular-nums">
                <span className="text-primary">{lineItem.weight.value}</span>
                <span className="ml-1 text-muted-foreground">
                  {lineItem.weight.prefix}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
