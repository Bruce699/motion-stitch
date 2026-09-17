import { memo } from 'react';
import { Collapsible, Icon, Input, InputButton } from '~/ui';
import { Switch } from '~/ui/components/switch/switch';
import type { ProductVariantDetailsValues } from './product-variant-details';

type ProductVariantInventorySectionProps = Pick<
  ProductVariantDetailsValues,
  | 'trackInventory'
  | 'inventoryQuantity'
  | 'sku'
  | 'barcode'
  | 'sellWhenOutOfStock'
> & {
  keyScope: string;
  onValueChange: <K extends keyof ProductVariantDetailsValues>(
    key: K,
    value: ProductVariantDetailsValues[K],
  ) => void;
};

const ProductVariantInventorySection = memo(
  function ProductVariantInventorySection({
    barcode,
    inventoryQuantity,
    keyScope,
    onValueChange,
    sellWhenOutOfStock,
    sku,
    trackInventory,
  }: ProductVariantInventorySectionProps) {
    const action = (
      <Switch
        ariaLabel="Track inventory"
        checked={trackInventory}
        onCheckedChange={(value) => onValueChange('trackInventory', value)}
      />
    );

    return (
      <section className="flex flex-col p-5">
        <div className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              <Icon name="PalletPackage" />
            </span>
            <h2 className="text-md font-medium">Inventory</h2>
          </div>
          {action}
        </div>
        <Collapsible.Root open={trackInventory}>
          <Collapsible.Panel
            keepMounted
            className="-mx-2 px-2"
            contentClassName="flex flex-col gap-4 pt-4"
          >
            <Input
              aria-label="Inventory quantity"
              value={inventoryQuantity}
              onChange={(event) =>
                onValueChange('inventoryQuantity', event.currentTarget.value)
              }
            />
            <div key={`${keyScope}:inventory`} className="flex flex-wrap gap-2">
              <InputButton.Text
                label="SKU"
                placeholder="ABC-123"
                value={sku}
                onValueChange={(value) => onValueChange('sku', value)}
              />
              <InputButton.Text
                label="Barcode"
                placeholder="UPC"
                value={barcode}
                onValueChange={(value) => onValueChange('barcode', value)}
              />
              <InputButton.Checkbox
                label="Sell when out of stock"
                value={sellWhenOutOfStock}
                onValueChange={(value) =>
                  onValueChange('sellWhenOutOfStock', value)
                }
              />
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
      </section>
    );
  },
);

export { ProductVariantInventorySection };
