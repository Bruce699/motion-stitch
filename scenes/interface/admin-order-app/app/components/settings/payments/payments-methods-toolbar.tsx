import React from 'react';
import { useToolbar } from '~/components/toolbar/hooks/use-toolbar';
import { SettingsIcon } from '~/icons/navigation/settings';
import { Button } from '~/ui/components/button/button';
import { Icon } from '~/ui/components/icon/icon';
import { Menu } from '~/ui/components/menu/menu';
import { StatusIndicator } from '~/ui/components/status-indicator/status-indicator';

export function PaymentsMethodsToolbar({
  isPaymentsTestModeEnabled,
  setPaymentsTestModeEnabled,
}: {
  isPaymentsTestModeEnabled: boolean;
  setPaymentsTestModeEnabled: (enabled: boolean) => void;
}) {
  const statusLabel = isPaymentsTestModeEnabled ? 'Test mode' : 'Active';
  const statusAction = React.useMemo(
    () => (
      <Menu
        align="end"
        trigger={
          <Button
            onClick={() => {}}
            aria-label="Payment test mode status"
            variant="elevated"
            prefix={
              <StatusIndicator
                status={isPaymentsTestModeEnabled ? 'caution' : 'active'}
              />
            }
            suffix={
              <span className="text-muted-foreground">
                <Icon name="ChevronExpandY" size={14} />
              </span>
            }
          >
            <span>{statusLabel}</span>
          </Button>
        }
        options={[
          {
            label: 'Active',
            sublabel: 'Process real orders',
            checked: !isPaymentsTestModeEnabled,
            onSelect: () => setPaymentsTestModeEnabled(false),
          },
          {
            label: 'Test mode',
            sublabel: 'Place test orders',
            checked: isPaymentsTestModeEnabled,
            onSelect: () => setPaymentsTestModeEnabled(true),
          },
        ]}
      />
    ),
    [isPaymentsTestModeEnabled, setPaymentsTestModeEnabled, statusLabel],
  );

  useToolbar({
    title: 'Payment methods',
    showTitleOnScroll: false,
    testMode: isPaymentsTestModeEnabled,
    breadcrumbs: [
      {
        url: '/store/settings',
        label: 'Settings',
        icon: <SettingsIcon />,
        hideLabel: true,
      },
      {
        url: '/store/settings/payments',
        label: 'Payments',
      },
    ],
    actions: [
      {
        type: 'custom',
        label: 'Payment test mode status',
        content: statusAction,
      },
    ],
  });

  return null;
}
