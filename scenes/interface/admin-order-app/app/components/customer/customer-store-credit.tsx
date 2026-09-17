import { Input, Section, Select } from '~/ui';

export function CustomerStoreCredit({
  amount,
  expiryDate,
  onAmountChange,
  onExpiryDateChange,
}: {
  amount: string;
  expiryDate: string;
  onAmountChange: (value: string) => void;
  onExpiryDateChange: (value: string) => void;
}) {
  return (
    <Section title="Store credit">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Amount"
          prefix="$"
          value={amount}
          suffix="USD"
          onChange={(event) => onAmountChange(event.currentTarget.value)}
        />
        <Select
          label="Expiry date"
          value={expiryDate}
          onValueChange={(value) => {
            if (typeof value === 'string') onExpiryDateChange(value);
          }}
          options={[
            { value: '2027-06-30', label: 'June 30, 2027' },
            { value: '2028-01-01', label: 'January 1, 2028' },
            { value: '2029-12-31', label: 'December 31, 2029' },
          ]}
        />
      </div>
    </Section>
  );
}
