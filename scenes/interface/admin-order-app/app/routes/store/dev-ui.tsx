import React from 'react';

import { DevUiToolbar } from '~/components/dev-ui/dev-ui-toolbar';
import { MainContentLayout } from '~/components/main-content-layout';
import { Button } from '~/ui/components/button/button';
import { Dialog } from '~/ui/components/dialog/dialog';
import { Icon } from '~/ui/components/icon/icon';
import { Intent } from '~/ui/components/intent';
import { SegmentedControl } from '~/ui/components/segmented-control/segmented-control';
import { Switch } from '~/ui/components/switch/switch';
import { Toast } from '~/ui/components/toast/toast';
import { useFeatureFlags } from '~/feature-flags';
import { useSystemAlertsStore } from '~/stores/use-system-alerts-store';
import { useViewAsStore } from '~/stores/use-view-as-store';

const sidekickIconVariantSegments = [
  { value: 'classic', label: 'Classic' },
  { value: 'shader', label: 'Shader' },
  { value: 'orb', label: 'Orb' },
];

function DevUiItem({
  iconName,
  title,
  subtitle,
  children,
}: {
  iconName: React.ComponentProps<typeof Icon>['name'];
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-4">
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground">
          <Icon name={iconName} />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="font-medium">{title}</p>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function DevUiPage() {
  const flags = useFeatureFlags((state) => state.flags);
  const setFlag = useFeatureFlags((state) => state.setFlag);
  const isPaymentsTestModeEnabled = useSystemAlertsStore(
    (state) => state.paymentsTestMode.enabled,
  );
  const isPayoutsPaused = useSystemAlertsStore(
    (state) => state.payoutsPaused.enabled,
  );
  const setPaymentsTestModeEnabled = useSystemAlertsStore(
    (state) => state.setPaymentsTestModeEnabled,
  );
  const setPayoutsPaused = useSystemAlertsStore(
    (state) => state.setPayoutsPaused,
  );
  const toggleViewAsMode = useViewAsStore((state) => state.toggleViewAsMode);

  return (
    <>
      <DevUiToolbar />
      <MainContentLayout>
        <div className="divide-y divide-border">
          <DevUiItem
            iconName="FaceGrin"
            title="Sidekick icon"
            subtitle="Choose which Sidekick icon renderer is used."
          >
            <SegmentedControl
              ariaLabel="Sidekick icon"
              value={flags.sidekickIconVariant}
              segments={sidekickIconVariantSegments}
              onValueChange={(value) => {
                if (
                  value === 'orb' ||
                  value === 'shader' ||
                  value === 'classic'
                ) {
                  setFlag('sidekickIconVariant', value);
                }
              }}
            />
          </DevUiItem>

          <DevUiItem
            iconName="PuzzlePiece"
            title="Design system"
            subtitle="Browse components and usage examples."
          >
            <Button href="/design-system" variant="secondary">
              Open design system
            </Button>
          </DevUiItem>

          <DevUiItem
            iconName="WindowAlert"
            title="Dialog"
            subtitle="Open a dialog surface."
          >
            <Dialog>
              <Dialog.Trigger>
                <Button onClick={() => {}} variant="secondary">
                  Open dialog
                </Button>
              </Dialog.Trigger>
              <Dialog.Content type="intent">
                <Dialog.Close>
                  <button
                    type="button"
                    className="size-full text-xl text-tertiary"
                  >
                    Close dialog
                  </button>
                </Dialog.Close>
              </Dialog.Content>
            </Dialog>
          </DevUiItem>

          <DevUiItem
            iconName="WindowFullScreen"
            title="Intent"
            subtitle="Open a full sized intent surface."
          >
            <Intent>
              <Intent.Trigger>
                <Button onClick={() => {}} variant="secondary">
                  Open intent
                </Button>
              </Intent.Trigger>
              <Intent.Content type="intent">
                <Intent.Close>
                  <button
                    type="button"
                    className="size-full text-xl text-tertiary"
                  >
                    Close intent
                  </button>
                </Intent.Close>
              </Intent.Content>
            </Intent>
          </DevUiItem>

          <DevUiItem
            iconName="Megaphone"
            title="Toast"
            subtitle="Show a transient notification."
          >
            <Toast>
              <Toast.Trigger>
                <Button onClick={() => {}} variant="secondary">
                  Show toast
                </Button>
              </Toast.Trigger>
              <Toast.Content
                label="Product saved"
                actionLabel="Undo"
                onActionClick={() => {}}
              />
            </Toast>
          </DevUiItem>

          <DevUiItem
            iconName="Eye"
            title="View as"
            subtitle="Toggle the View As toolbar."
          >
            <Button variant="secondary" onClick={toggleViewAsMode}>
              Toggle View As
            </Button>
          </DevUiItem>

          <DevUiItem
            iconName="Pointer"
            title="Dark tooltips"
            subtitle="Render tooltips with dark theme colors."
          >
            <Switch
              ariaLabel="Dark tooltips"
              checked={flags.darkTooltips}
              onCheckedChange={(checked) => setFlag('darkTooltips', checked)}
            />
          </DevUiItem>

          <DevUiItem
            iconName="CartAlert"
            title="Payments test mode"
            subtitle="Toggle the payments test mode banner in the nav."
          >
            <Switch
              ariaLabel="Payments test mode"
              checked={isPaymentsTestModeEnabled}
              onCheckedChange={setPaymentsTestModeEnabled}
            />
          </DevUiItem>

          <DevUiItem
            iconName="WalletContent"
            title="Payouts paused"
            subtitle="Toggle the payouts paused banner in the nav."
          >
            <Switch
              ariaLabel="Payouts paused"
              checked={isPayoutsPaused}
              onCheckedChange={setPayoutsPaused}
            />
          </DevUiItem>
        </div>
      </MainContentLayout>
    </>
  );
}
