import React from 'react';
import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import type { ToolbarAction } from '~/components/toolbar/toolbar';
import { customers } from '~/data/customers';
import { CustomersIcon } from '~/icons/navigation/customers';

export function CustomerToolbar({
  customer,
  name,
  hasChanges,
  onSave,
  onDiscard,
}: {
  customer: { id: string };
  name: string;
  hasChanges: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const currentCustomerIndex = React.useMemo(
    () => customers.findIndex((item) => item.id === customer.id),
    [customer.id],
  );
  const previousCustomer = customers[currentCustomerIndex - 1];
  const nextCustomer = customers[currentCustomerIndex + 1];
  const toolbarActions = React.useMemo<ToolbarAction[]>(
    () => [
      {
        type: 'secondary',
        icon: 'Dots',
        label: 'More',
        iconOnly: true,
        onClick: () => {},
      },
      {
        type: 'previousNext',
        previous: {
          label: 'Previous customer',
          url: previousCustomer
            ? `/store/customers/${previousCustomer.id}`
            : undefined,
        },
        next: {
          label: 'Next customer',
          url: nextCustomer ? `/store/customers/${nextCustomer.id}` : undefined,
        },
      },
    ],
    [nextCustomer, previousCustomer],
  );

  useToolbar({
    title: name,
    breadcrumbs: [
      {
        variant: 'button',
        url: '/store/customers',
        label: 'Customers',
        icon: <CustomersIcon />,
      },
    ],
    actions: toolbarActions,
    resource: {
      type: 'customer',
      id: customer.id,
      hasChanges,
      onSave,
      onDiscard,
    },
  });

  return null;
}
