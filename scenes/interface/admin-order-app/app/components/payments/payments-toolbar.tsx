import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { PaymentsIcon } from '~/icons/navigation/payments';

export function PaymentsToolbar() {
  useToolbar({
    title: 'Payments',
    icon: <PaymentsIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Payments',
        icon: <PaymentsIcon />,
        variant: 'title',
      },
    ],
    actions: [
      {
        type: 'secondary',
        icon: 'File',
        label: 'Documents',
        onClick: () => {},
      },
      {
        type: 'secondary',
        icon: 'InvoiceIn',
        label: 'Pay bills',
        onClick: () => {},
      },
      {
        type: 'primary',
        icon: 'InstantMoney',
        label: 'Transfer funds',
        onClick: () => {},
      },
    ],
  });

  return null;
}
