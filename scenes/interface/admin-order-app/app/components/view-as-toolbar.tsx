import React from 'react';
import { m } from 'motion/react';
import { useLocation } from 'react-router';
import { useViewAsStore } from '../stores/use-view-as-store';
import { countries } from '~/data/countries';
import { Icon } from '~/ui/components/icon/icon';
import { Image } from '~/ui/components/image/image';
import { Button } from '~/ui/components/button/button';
import { Select } from '~/ui/components/select/select';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';

const countryOptions = countries.map((country) => ({
  value: country.code,
  label: (
    <span className="flex items-center gap-2">
      <Image
        alt=""
        borderRadius="sm"
        className="shrink-0"
        objectFit="cover"
        size="full"
        src={`/images/flags/${country.code.toLowerCase()}.svg`}
        style={{ width: 20, height: 15 }}
      />
      <span>{country.name}</span>
    </span>
  ),
}));

export function ViewAsToolbar() {
  const { pathname } = useLocation();
  const isViewAsModeActive = useViewAsStore(
    (state) => state.isViewAsModeActive,
  );
  const closeViewAsMode = useViewAsStore((state) => state.closeViewAsMode);
  const [selectedCountry, setSelectedCountry] = React.useState('US');
  const selectedCountryDetails =
    countries.find((country) => country.code === selectedCountry) ??
    countries[0];

  React.useEffect(() => {
    if (pathname !== '/store/products') {
      closeViewAsMode();
    }
  }, [pathname, closeViewAsMode]);

  return (
    <m.div
      initial={false}
      animate={{ height: isViewAsModeActive ? 62 : 4 }}
      transition={{
        duration: motionDurations.slow,
        ease: motionEasings.easeOut,
      }}
      className="dark relative shrink-0 overflow-hidden"
    >
      {isViewAsModeActive && (
        <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-1">
          <span className="justify-self-start font-medium">View as</span>
          <div className="flex items-center gap-1 justify-self-center">
            <Select
              value={selectedCountry}
              options={countryOptions}
              onValueChange={(value) => {
                if (typeof value === 'string') setSelectedCountry(value);
              }}
              trigger={() => (
                <Button
                  onClick={() => {}}
                  variant="plain"
                  suffix={
                    <span className="text-muted-foreground">
                      <Icon name="ChevronExpandY" size={14} />
                    </span>
                  }
                >
                  <span className="flex items-center gap-2">
                    <Image
                      alt=""
                      borderRadius="sm"
                      className="shrink-0"
                      objectFit="cover"
                      size="full"
                      src={`/images/flags/${selectedCountryDetails.code.toLowerCase()}.svg`}
                      style={{ width: 20, height: 15 }}
                    />
                    <span>{selectedCountryDetails.name}</span>
                  </span>
                </Button>
              )}
            />

            <span className="text-xl text-muted-foreground/40">/</span>

            <Button
              onClick={() => {}}
              variant="plain"
              prefix={<Icon name="CartShopping" />}
              suffix={
                <span className="text-muted-foreground">
                  <Icon name="ChevronExpandY" size={14} />
                </span>
              }
            >
              Online Store
            </Button>

            <span className="text-xl text-muted-foreground/40">/</span>

            <Button
              onClick={() => {}}
              variant="plain"
              prefix={
                <span className="text-muted-foreground">
                  <Icon name="Plus" size={14} />
                </span>
              }
            >
              <span className="text-muted-foreground">Company location</span>
            </Button>
          </div>

          <div className="justify-self-end pr-4">
            <Button variant="plain" size="icon" onClick={closeViewAsMode}>
              <span className="text-muted-foreground">
                <Icon name="Xmark" />
              </span>
            </Button>
          </div>
        </div>
      )}
    </m.div>
  );
}
