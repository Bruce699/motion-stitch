import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { TaxesAndDutiesIcon } from '~/icons/navigation/settings/taxes-and-duties';

export function TaxesAndDutiesToolbar() {
  useToolbar({
    title: 'Taxes and duties',
    icon: <TaxesAndDutiesIcon />,
  });

  return null;
}
