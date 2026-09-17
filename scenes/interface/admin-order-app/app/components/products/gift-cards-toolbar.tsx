import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { GiftCardsIcon } from '~/icons/navigation/gift-cards';

export function GiftCardsToolbar() {
  useToolbar({
    title: 'Gift cards',
    icon: <GiftCardsIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Gift cards',
        icon: <GiftCardsIcon />,
        variant: 'title',
      },
    ],
    actions: [
      {
        type: 'secondary',
        icon: 'Export',
        label: 'Export',
        onClick: () => {},
      },
    ],
  });

  return null;
}
