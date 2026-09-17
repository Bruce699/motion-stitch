import { memo, type Ref } from 'react';
import clsx from 'clsx';
import { ProductVariantInventorySection } from './product-variant-inventory-section';
import { ProductVariantPriceSection } from './product-variant-price-section';
import { ProductVariantShippingSection } from './product-variant-shipping-section';

export type ProductVariantDetailsValues = {
  price: string;
  compareAt: string;
  chargeTax: boolean;
  unitPrice: string;
  trackInventory: boolean;
  inventoryQuantity: string;
  sku: string;
  barcode: string;
  sellWhenOutOfStock: boolean;
  requiresShipping: boolean;
  selectedPackage: string;
  weight: string;
  weightUnit: string;
  origin: string;
  hsCode: string;
};

const ProductVariantDetails = memo(function ProductVariantDetails({
  hasVariantList,
  keyScope,
  values,
  onValueChange,
  ref,
}: {
  keyScope: string;
  hasVariantList: boolean;
  values: ProductVariantDetailsValues;
  onValueChange: <K extends keyof ProductVariantDetailsValues>(
    key: K,
    value: ProductVariantDetailsValues[K],
  ) => void;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      className={clsx(
        'relative flex flex-col bg-background transition-[border-radius] ease-out',
        'before:absolute before:inset-0 before:-z-1 before:rounded-inherit before:shadow-[0_2px_12px_0_rgba(0,0,0,0.02),0_4px_16px_0_rgba(0,0,0,0.02),0_4px_48px_0_rgba(0,0,0,0.02)]',
        hasVariantList ? 'rounded-l-lg rounded-r-[19px]' : 'rounded-[19px]',
      )}
    >
      <ProductVariantPriceSection
        keyScope={keyScope}
        price={values.price}
        compareAt={values.compareAt}
        chargeTax={values.chargeTax}
        unitPrice={values.unitPrice}
        onValueChange={onValueChange}
      />

      <hr className="mx-5 border-border" />

      <ProductVariantInventorySection
        keyScope={keyScope}
        trackInventory={values.trackInventory}
        inventoryQuantity={values.inventoryQuantity}
        sku={values.sku}
        barcode={values.barcode}
        sellWhenOutOfStock={values.sellWhenOutOfStock}
        onValueChange={onValueChange}
      />

      <hr className="mx-5 border-border" />

      <ProductVariantShippingSection
        keyScope={keyScope}
        requiresShipping={values.requiresShipping}
        selectedPackage={values.selectedPackage}
        weight={values.weight}
        weightUnit={values.weightUnit}
        origin={values.origin}
        hsCode={values.hsCode}
        onValueChange={onValueChange}
      />
    </div>
  );
});

export { ProductVariantDetails };
