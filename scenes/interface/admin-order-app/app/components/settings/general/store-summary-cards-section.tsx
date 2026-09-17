import { Section } from '~/ui/components/section/section';
import { Icon } from '~/ui/components/icon/icon';
import { ProgressiveBlur } from '~/ui/components/progressive-blur/progressive-blur';
import { Map } from '~/ui/components/map/map';
import { Avatar } from '~/ui/components/avatar/avatar';
import { currentStore, currentStoreLocation } from '~/data/stores';

function StoreDetailsCard() {
  return (
    <Section href="#">
      <div className="relative flex h-full flex-col justify-between rounded-inherit">
        <div className="absolute -inset-5 overflow-hidden rounded-inherit">
          <Map
            center={currentStoreLocation}
            markerClassName="top-1/2 right-5 -translate-y-1/2"
            markerPlacement="overlay"
            markerSizeClassName="size-20"
            zoom={1}
          />
        </div>
        <div className="absolute -inset-y-5 -left-5 w-3/4 rounded-inherit">
          <ProgressiveBlur
            side="left"
            className="absolute inset-0 w-full rounded-inherit"
          />
        </div>
        <p className="z-1 font-medium">Store contact</p>
        <div className="z-1 flex flex-col gap-1">
          <StoreDetail icon="Pin">80 Spadina Ave, Toronto, ON</StoreDetail>
          <StoreDetail icon="Envelope">hello@mvse.com</StoreDetail>
          <StoreDetail icon="Phone">888-798-0202</StoreDetail>
        </div>
      </div>
    </Section>
  );
}

function BusinessDetailsCard() {
  return (
    <Section href="#">
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <p
            className="flex items-center font-medium"
            aria-label="Business · MVSE Global Inc"
          >
            <span>Business</span>
            <span className="mr-2 ml-1">·</span>
            <span>MVSE Global Inc</span>
          </p>
          <Avatar
            initials={currentStore.name.slice(0, 2)}
            name={currentStore.name}
            size="lg"
            src={currentStore.logo}
          />
        </div>
        <div className="flex flex-col gap-1">
          <StoreDetail icon="Office">LLC</StoreDetail>
          <StoreDetail icon="Pin">
            25 Average St, San Francisco, United States
          </StoreDetail>
          <StoreDetail icon="Envelope">business@mvse.com</StoreDetail>
        </div>
      </div>
    </Section>
  );
}

function StoreDetail({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: 'Envelope' | 'Globe' | 'Office' | 'Phone' | 'Pin';
}) {
  return (
    <div className="flex items-center gap-3 text-secondary">
      <Icon name={icon} />
      {children}
    </div>
  );
}

function StoreSummaryCardsSection() {
  return (
    <div className="grid h-[160px] grid-cols-2 gap-5">
      <StoreDetailsCard />
      <BusinessDetailsCard />
    </div>
  );
}

export { StoreSummaryCardsSection };
