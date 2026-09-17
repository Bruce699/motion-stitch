# InputCombo — select and input combo field

import { InputCombo } from '~/ui'
Props: label, select, optional input, selectPosition, className

Use for: mixed controls where a select scopes or qualifies text entry.
Do: use without input for a select-only combo; use selectPosition="prefix" or "suffix" when text entry is present.
Don't: place multiple text inputs in one combo.

The rounded-lg wrapper owns the shared hover and focus shadow. Nested Select and Input controls use their borderless style.

Example:
<InputCombo
label="Minimum purchase"
select={{
      value: type,
      onValueChange: setType,
      options: [
        { value: 'amount', label: 'Amount' },
        { value: 'quantity', label: 'Quantity' },
      ],
    }}
input={{
      value,
      onChange: (event) => setValue(event.currentTarget.value),
      placeholder: '0.00',
      prefix: '$',
      suffix: 'USD',
    }}
/>
