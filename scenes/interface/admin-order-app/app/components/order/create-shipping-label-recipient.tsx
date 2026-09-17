import { Button, Map, Section } from '~/ui';
import type { Order } from '~/data/orders';

export function CreateShippingLabelRecipient({ order }: { order: Order }) {
  return (
    <Section
      title="Recipient"
      bleed
      action={
        <Button onClick={() => {}} variant="secondary">
          Edit
        </Button>
      }
    >
      <div className="relative h-24 overflow-hidden rounded-3xl">
        <Map
          center={order.customerDetails.coordinates}
          markerSizeClassName="size-20"
          markerPlacement="overlay"
          className="absolute inset-0"
        />
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-88 bg-linear-to-r from-background/68 via-background/36 to-transparent"
        />
        <div className="absolute inset-y-0 left-0 flex w-68 flex-col p-4 px-5">
          <p className="mt-auto font-medium text-primary">{order.customer}</p>
          <p className="text-muted-foreground">
            {order.customerDetails.address}
          </p>
        </div>
      </div>
    </Section>
  );
}
