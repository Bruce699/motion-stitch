import { discountPurchaseTypeOptions } from '~/data/discounts';
import { InputButton, InputCombo, Section, Select } from '~/ui';

export function UsageSection({
  oncePerCustomer,
  purchaseType,
  totalUses,
  totalUsesAmount,
  minPurchaseType,
  minPurchaseAmount,
  onOncePerCustomerChange,
  onPurchaseTypeChange,
  onTotalUsesChange,
  onTotalUsesAmountChange,
  onMinPurchaseTypeChange,
  onMinPurchaseAmountChange,
}: {
  oncePerCustomer: boolean;
  purchaseType: string;
  totalUses: string;
  totalUsesAmount: string;
  minPurchaseType: string;
  minPurchaseAmount: string;
  onOncePerCustomerChange: (checked: boolean) => void;
  onPurchaseTypeChange: (value: string) => void;
  onTotalUsesChange: (value: string) => void;
  onTotalUsesAmountChange: (value: string) => void;
  onMinPurchaseTypeChange: (value: string) => void;
  onMinPurchaseAmountChange: (value: string) => void;
}) {
  return (
    <Section title="Usage">
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <InputCombo
              label="Total uses"
              select={{
                value: totalUses,
                onValueChange: (value) => onTotalUsesChange(String(value)),
                options: [
                  { value: 'No limit', label: 'No limit' },
                  {
                    value: 'Limit total usages',
                    label: 'Limit total usages',
                  },
                ],
              }}
              input={
                totalUses === 'No limit'
                  ? undefined
                  : {
                      value: totalUsesAmount,
                      onChange: (event) =>
                        onTotalUsesAmountChange(event.currentTarget.value),
                      placeholder: 'Usage limit',
                    }
              }
            />
          </div>
          <div className="flex-1">
            <InputCombo
              label="Minimum purchase amount"
              select={{
                value: minPurchaseType,
                onValueChange: (value) =>
                  onMinPurchaseTypeChange(String(value)),
                options: [
                  { value: 'None', label: 'None' },
                  { value: 'Minimum amount', label: 'Minimum amount' },
                  { value: 'Minimum quantity', label: 'Minimum quantity' },
                ],
              }}
              input={
                minPurchaseType === 'None'
                  ? undefined
                  : {
                      value: minPurchaseAmount,
                      onChange: (event) =>
                        onMinPurchaseAmountChange(event.currentTarget.value),
                      placeholder:
                        minPurchaseType === 'Minimum quantity' ? '0' : '0.00',
                      prefix:
                        minPurchaseType === 'Minimum amount' ? '$' : undefined,
                      suffix:
                        minPurchaseType === 'Minimum amount'
                          ? 'USD'
                          : undefined,
                    }
              }
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={purchaseType}
            onValueChange={(value) => onPurchaseTypeChange(String(value))}
            options={discountPurchaseTypeOptions}
            trigger={(value) => (
              <InputButton.Picker label="Purchase type" value={value} />
            )}
          />
          <InputButton.Switch
            label="Once per customer"
            value={oncePerCustomer}
            onValueChange={onOncePerCustomerChange}
          />
        </div>
      </div>
    </Section>
  );
}
