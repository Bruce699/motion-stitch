import { memo } from 'react';
import { Icon, Input, InputButton } from '~/ui';
import type { ProductVariantDetailsValues } from './product-variant-details';

type ProductVariantPriceSectionProps = Pick<
  ProductVariantDetailsValues,
  'price' | 'compareAt' | 'chargeTax' | 'unitPrice'
> & {
  keyScope: string;
  onValueChange: <K extends keyof ProductVariantDetailsValues>(
    key: K,
    value: ProductVariantDetailsValues[K],
  ) => void;
};

const ProductVariantPriceSection = memo(function ProductVariantPriceSection({
  compareAt,
  chargeTax,
  keyScope,
  onValueChange,
  price,
  unitPrice,
}: ProductVariantPriceSectionProps) {
  return (
    <section className="flex flex-col p-5">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">
          <Icon name="CircleDollar" />
        </span>
        <h2 className="text-md font-medium">Price</h2>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        <Input
          aria-label="Price"
          value={price}
          onChange={(event) =>
            onValueChange('price', event.currentTarget.value)
          }
          prefix={<span className="text-muted-foreground">$</span>}
        />
        <div key={`${keyScope}:price`} className="flex flex-wrap gap-2">
          <InputButton.Text
            label="Compare at"
            placeholder="0.00"
            prefix="$"
            value={compareAt}
            onValueChange={(value) => onValueChange('compareAt', value)}
          />
          <InputButton.Text
            label="Unit price"
            placeholder="0.00"
            prefix="$"
            value={unitPrice}
            onValueChange={(value) => onValueChange('unitPrice', value)}
          />
          <InputButton.Checkbox
            label="Charge tax"
            value={chargeTax}
            onValueChange={(value) => onValueChange('chargeTax', value)}
          />
        </div>
      </div>
    </section>
  );
});

export { ProductVariantPriceSection };
