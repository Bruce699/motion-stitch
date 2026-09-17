import { MainContentLayout } from '~/components/main-content-layout';
import { CustomerBillingStatementSection } from '~/components/settings/payments/customer-billing-statement-section';
import { PaymentMethodsSection } from '~/components/settings/payments/payment-methods-section';
import { PaymentsMethodsToolbar } from '~/components/settings/payments/payments-methods-toolbar';
import { SystemAlertStripes } from '~/components/components/system-alerts/system-alert-stripes';
import { useSystemAlertsStore } from '~/stores/use-system-alerts-store';
import { Banner } from '~/ui/components/banner/banner';
import { Icon } from '~/ui/components/icon/icon';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';
import { AnimatePresence, m } from 'motion/react';
import { clsx } from 'clsx';

export default function PaymentMethodsPage() {
  const isPaymentsTestModeEnabled = useSystemAlertsStore(
    (state) => state.paymentsTestMode.enabled,
  );
  const setPaymentsTestModeEnabled = useSystemAlertsStore(
    (state) => state.setPaymentsTestModeEnabled,
  );

  return (
    <>
      <PaymentsMethodsToolbar
        isPaymentsTestModeEnabled={isPaymentsTestModeEnabled}
        setPaymentsTestModeEnabled={setPaymentsTestModeEnabled}
      />
      <div className="relative">
        <div
          className={clsx(
            'absolute inset-x-0 -top-(--toolbar-height) h-64',
            'transition-opacity ease-out',
            'mask-[radial-gradient(ellipse_45%_36%_at_50%_0%,black_0%,black_24%,rgb(0_0_0/0.62)_72%,transparent_100%)]',
            isPaymentsTestModeEnabled ? 'opacity-100' : 'opacity-0',
          )}
        >
          <SystemAlertStripes className="text-yellow-300" />
        </div>

        <div className="relative">
          <MainContentLayout>
            <div className="flex flex-col gap-8 pb-16">
              <div
                data-breadcrumb-title-target
                className="flex grow items-center"
              >
                <p className="text-3xl font-medium">Payment methods</p>
              </div>

              <AnimatePresence initial={false}>
                {isPaymentsTestModeEnabled && (
                  <m.div
                    className="overflow-hidden"
                    initial={{
                      height: 0,
                      marginBottom: -32,
                      translateY: -8,
                      opacity: 0,
                    }}
                    animate={{
                      height: 'auto',
                      marginBottom: 0,
                      translateY: 0,
                      opacity: 1,
                    }}
                    exit={{
                      height: 0,
                      marginBottom: -32,
                      translateY: -8,
                      opacity: 0,
                    }}
                    transition={{
                      duration: motionDurations.slow,
                      ease: motionEasings.easeOut,
                    }}
                  >
                    <Banner
                      variant="caution"
                      icon={<Icon name="CartAlert" />}
                      actionLabel="Place test order"
                      onActionClick={() => {}}
                    >
                      Place test orders on checkout without processing real
                      payments
                    </Banner>
                  </m.div>
                )}
              </AnimatePresence>

              <PaymentMethodsSection />

              <CustomerBillingStatementSection />
            </div>
          </MainContentLayout>
        </div>
      </div>
    </>
  );
}
