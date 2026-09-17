import { useState } from 'react';
import { Icon, InputButton, Select } from '~/ui';

function InputButtonPreview() {
  const [startsAt, setStartsAt] = useState('today');
  const [code, setCode] = useState('SPRING25');
  const [oncePerCustomer, setOncePerCustomer] = useState(true);
  const [combineDiscounts, setCombineDiscounts] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={startsAt}
        onValueChange={(value) => setStartsAt(String(value))}
        options={[
          { value: 'today', label: 'Today, 3:45 PM' },
          { value: 'tomorrow', label: 'Tomorrow, 9:00 AM' },
          { value: 'next-week', label: 'Next week' },
        ]}
        trigger={(value) => (
          <InputButton.Picker
            label="Starts"
            value={value}
            icon={<Icon name="Clock" />}
          />
        )}
      />
      <InputButton.Text
        label="Code"
        value={code}
        onValueChange={setCode}
        icon={<Icon name="Pen" />}
      />
      <InputButton.Switch
        label="Once per customer"
        value={oncePerCustomer}
        onValueChange={setOncePerCustomer}
      />
      <InputButton.Checkbox
        label="Combine discounts"
        value={combineDiscounts}
        onValueChange={setCombineDiscounts}
      />
    </div>
  );
}

export { InputButtonPreview };
