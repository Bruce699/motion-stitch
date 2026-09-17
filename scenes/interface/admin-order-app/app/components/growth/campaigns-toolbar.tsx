import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { CampaignsIcon } from '~/icons/navigation/campaigns';

export function CampaignsToolbar() {
  useToolbar({
    title: 'Campaigns',
    icon: <CampaignsIcon />,
    showTitleOnScroll: false,
    breadcrumbs: [
      {
        label: 'Campaigns',
        icon: <CampaignsIcon />,
        variant: 'title',
      },
    ],
    actions: [
      {
        type: 'primary',
        icon: 'Plus',
        label: 'Campaign',
        onClick: () => {},
      },
    ],
  });

  return null;
}
