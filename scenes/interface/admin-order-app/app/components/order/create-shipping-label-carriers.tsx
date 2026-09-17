import {
  shippingServices,
  type ShippingService,
} from '~/data/shipping-services';
import { Badge, Button, Icon } from '~/ui';

const emphasizedHighlights = new Set(['Fastest', 'Cheapest']);
const carrierToneClasses: Record<ShippingService['tone'], string> = {
  yellow: 'bg-[#ffcc00] text-[#7a4f00]',
  brown: 'bg-[#4d3426] text-white',
  red: 'bg-[#e21b2d] text-white',
  gold: 'bg-[#caa04a] text-white',
};

function CarrierMark({ service }: { service: ShippingService }) {
  return (
    <span
      className={`flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-md text-[8px] font-bold ${carrierToneClasses[service.tone]}`}
    >
      {service.carrier ? (
        <img
          src={service.carrier.imageSrc}
          alt=""
          className="size-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="size-1.5 rounded-full bg-white" />
      )}
    </span>
  );
}

function ServiceHighlights({ service }: { service: ShippingService }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      {service.highlights.map((highlight) => (
        <span
          key={highlight.label}
          className={`inline-flex items-center gap-1 ${
            emphasizedHighlights.has(highlight.label)
              ? 'font-medium text-info'
              : ''
          }`}
        >
          <Icon name={highlight.iconName} size={14} />
          {highlight.label}
        </span>
      ))}
    </div>
  );
}

export function CreateShippingLabelCarriers() {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Shipping carrier</h2>
        <Button
          onClick={() => {}}
          variant="secondary"
          prefix={<Icon name="Sorting" />}
          suffix={
            <span className="text-muted-foreground">
              <Icon name="ChevronExpandY" size={14} />
            </span>
          }
        >
          Recommended
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        {shippingServices.map((service) => (
          <button
            key={service.id}
            type="button"
            className={`bg-background text-left transition-colors ${
              service.selected
                ? 'rounded-3xl border border-primary shadow-sm'
                : 'rounded-3xl shadow-sm hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div className="flex gap-3">
                <CarrierMark service={service} />
                <div className="">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {service.carrier ? `${service.carrier.name} ` : ''}
                      {service.name}
                    </p>
                    {service.badge ? <Badge>{service.badge}</Badge> : null}
                  </div>
                  <div className="mt-2">
                    <ServiceHighlights service={service} />
                  </div>
                </div>
              </div>
              <span className="shrink-0 font-medium tabular-nums">
                {service.price}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
