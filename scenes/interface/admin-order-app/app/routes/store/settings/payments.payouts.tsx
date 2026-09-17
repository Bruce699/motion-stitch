import { MainContentLayout } from '~/components/main-content-layout';
import { CryptoTransactionsSection } from '~/components/settings/payments/crypto-transactions-section';
import { OtherPayoutSettingsSection } from '~/components/settings/payments/other-payout-settings-section';
import { PayoutAccountSection } from '~/components/settings/payments/payout-account-section';
import { PaymentsPayoutsToolbar } from '~/components/settings/payments/payments-payouts-toolbar';

export default function PayoutsPage() {
  return (
    <>
      <PaymentsPayoutsToolbar />
      <MainContentLayout>
        <div className="flex flex-col gap-8 pb-16">
          <div data-breadcrumb-title-target className="grow">
            <p className="text-3xl font-medium">Payouts</p>
          </div>
          <PayoutAccountSection />
          <CryptoTransactionsSection />
          <OtherPayoutSettingsSection />
        </div>
      </MainContentLayout>
    </>
  );
}
