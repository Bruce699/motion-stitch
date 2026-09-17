import { Combobox, Icon, InputButton, InputCombo, Section } from '~/ui';
import type { Collection } from '~/data/collections';
import { discountCustomerSegmentOptions } from '~/data/discounts';
import { SegmentsIcon } from '~/icons/navigation/segments';
import { DiscountPreview } from './discount-preview';

export function DiscountDetailsSection({
  collections,
  customerSegments,
  discountValueType,
  discountValueAmount,
  appliesTo,
  onCustomerSegmentsChange,
  onDiscountValueTypeChange,
  onDiscountValueAmountChange,
  onAppliesToChange,
}: {
  collections: Collection[];
  customerSegments: string[];
  discountValueType: string;
  discountValueAmount: string;
  appliesTo: string[];
  onCustomerSegmentsChange: (value: string[]) => void;
  onDiscountValueTypeChange: (value: string) => void;
  onDiscountValueAmountChange: (value: string) => void;
  onAppliesToChange: (value: string[]) => void;
}) {
  const collectionsByImage = new Map(
    collections.map((collection) => [collection.image, collection]),
  );
  const selectedCollections: Collection[] = [];
  const customerSegmentValue = getCustomerSegmentValue(customerSegments);

  for (const image of appliesTo) {
    const collection = collectionsByImage.get(image);
    if (collection) selectedCollections.push(collection);
  }

  const handleAppliesToChange = (value: string[]) => {
    const addedValues = value.filter((item) => !appliesTo.includes(item));
    const existingValues = appliesTo.filter((item) => value.includes(item));

    onAppliesToChange([...addedValues, ...existingValues]);
  };

  return (
    <Section bleed title="Amount off products">
      <div className="flex flex-col">
        <div className="grid grid-cols-[240px_minmax(0,1fr)] gap-4">
          <div className="flex flex-col gap-4 p-5 pe-0">
            <InputCombo
              label="Discount value"
              select={{
                value: discountValueType,
                onValueChange: (value) =>
                  onDiscountValueTypeChange(String(value)),
                options: [
                  { value: 'Percentage', label: 'Percentage' },
                  { value: 'Amount', label: 'Amount' },
                ],
              }}
              input={{
                value: discountValueAmount,
                onChange: (event) =>
                  onDiscountValueAmountChange(event.currentTarget.value),
                prefix: discountValueType === 'Amount' ? '$' : undefined,
                suffix: discountValueType === 'Percentage' ? '%' : 'USD',
              }}
            />
            <Combobox
              label="Applies to"
              value={appliesTo}
              onValueChange={(value) => handleAppliesToChange(value ?? [])}
              placeholder="Select collections"
              options={collections.map((collection) => ({
                value: collection.image,
                label: collection.title,
              }))}
            />
          </div>
          <DiscountPreview collections={selectedCollections} />
        </div>
        <div className="flex flex-col gap-4 p-5 pt-0">
          <hr className="bg-border h-px w-full shrink-0 rounded-full border-0" />
          <div className="flex flex-wrap gap-2">
            <InputButton.Picker
              label="Starts today"
              icon={
                <span className="text-muted-foreground">
                  <Icon name="Clock" />
                </span>
              }
              value="Today, 3:45 PM"
            />
            <Combobox
              value={customerSegments}
              onValueChange={(value) => onCustomerSegmentsChange(value ?? [])}
              placeholder="Select segments"
              options={discountCustomerSegmentOptions}
              multipleSelectionLabel={(count) => `${count} segments`}
              trigger={() => (
                <InputButton.Picker
                  label="All customers"
                  icon={<SegmentsIcon />}
                  value={customerSegmentValue}
                />
              )}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

function getCustomerSegmentValue(value: string[]) {
  if (value.length === 0) return undefined;

  if (value.length === 1) {
    return (
      discountCustomerSegmentOptions.find((option) => option.value === value[0])
        ?.label ?? value[0]
    );
  }

  return `${value.length} segments`;
}
