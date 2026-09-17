import { memo } from 'react';
import { countries } from '~/data/countries';
import { packages } from '~/data/packages';
import { productWeightUnitOptions } from '~/data/products';
import {
  Collapsible,
  Icon,
  InputButton,
  InputCombo,
  Select,
} from '~/ui';
import { Switch } from '~/ui/components/switch/switch';
import type { ProductVariantDetailsValues } from './product-variant-details';

type ProductVariantShippingSectionProps = Pick<
  ProductVariantDetailsValues,
  | 'requiresShipping'
  | 'selectedPackage'
  | 'weight'
  | 'weightUnit'
  | 'origin'
  | 'hsCode'
> & {
  keyScope: string;
  onValueChange: <K extends keyof ProductVariantDetailsValues>(
    key: K,
    value: ProductVariantDetailsValues[K],
  ) => void;
};

const packageOptions = packages.map((shippingPackage) => ({
  value: shippingPackage.id,
  label: shippingPackage.name,
}));

const countryOptions = countries.map((country) => ({
  value: country.code,
  label: country.name,
}));

const ProductVariantShippingSection = memo(
  function ProductVariantShippingSection({
    hsCode,
    keyScope,
    onValueChange,
    origin,
    requiresShipping,
    selectedPackage,
    weight,
    weightUnit,
  }: ProductVariantShippingSectionProps) {
    const action = (
      <Switch
        ariaLabel="Requires shipping"
        checked={requiresShipping}
        onCheckedChange={(value) => onValueChange('requiresShipping', value)}
      />
    );

    return (
      <section className="flex flex-col p-5">
        <div className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              <Icon name="TruckFast" />
            </span>
            <h2 className="text-md font-medium">Shipping</h2>
          </div>
          {action}
        </div>
        <Collapsible.Root open={requiresShipping}>
          <Collapsible.Panel
            keepMounted
            className="-mx-2 px-2"
            contentClassName="flex flex-col gap-4 pt-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Package"
                value={selectedPackage}
                options={packageOptions}
                onValueChange={(value) => {
                  if (typeof value === 'string') {
                    onValueChange('selectedPackage', value);
                  }
                }}
              />
              <InputCombo
                label="Weight"
                input={{
                  'aria-label': 'Package weight',
                  value: weight,
                  onChange: (event) =>
                    onValueChange('weight', event.currentTarget.value),
                }}
                select={{
                  value: weightUnit,
                  options: productWeightUnitOptions,
                  onValueChange: (value) => {
                    if (typeof value === 'string') {
                      onValueChange('weightUnit', value);
                    }
                  },
                }}
                selectPosition="suffix"
              />
            </div>
            <div key={`${keyScope}:shipping`} className="flex flex-wrap gap-2">
              <Select
                value={origin}
                options={countryOptions}
                onValueChange={(value) => {
                  if (typeof value === 'string') onValueChange('origin', value);
                }}
                trigger={(value) => (
                  <InputButton.Picker label="Origin" value={value} />
                )}
              />
              <InputButton.Text
                label="HS code"
                placeholder="Code"
                value={hsCode}
                onValueChange={(value) => onValueChange('hsCode', value)}
              />
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
      </section>
    );
  },
);

export { ProductVariantShippingSection };
