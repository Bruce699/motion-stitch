import { Button } from '~/ui/components/button/button';
import { Icon } from '~/ui/components/icon/icon';
import { Menu } from '~/ui/components/menu/menu';
import { Section } from '~/ui/components/section/section';
import { StatusIndicator } from '~/ui/components/status-indicator/status-indicator';
import { paymentMethods } from '~/data/payment-methods';
import { useSystemAlertsStore } from '~/stores/use-system-alerts-store';
import { SystemAlertStripes } from '~/components/components/system-alerts/system-alert-stripes';
import type { CSSProperties } from 'react';

const displayedPaymentMethods = [...paymentMethods, ...paymentMethods];
const paymentMethodMarqueeDistance = paymentMethods.length * 100;

function ShopifyPaymentsSection() {
  const isPaymentsTestModeEnabled = useSystemAlertsStore(
    (state) => state.paymentsTestMode.enabled,
  );

  return (
    <Section
      noBg
      bleed
      title="Shopify Payments"
      subtitle="Get improved rates by upgrading your plan"
      action={
        <Menu
          align="end"
          trigger={
            <Button
              onClick={() => {}}
              aria-label="Shopify Payments actions"
              size="icon"
              variant="secondary"
            >
              <Icon name="Dots" />
            </Button>
          }
          options={[
            { label: 'Switch providers' },
            {
              label: (
                <span className="text-destructive-foreground">Deactivate</span>
              ),
            },
          ]}
        />
      }
    >
      <div className="grid h-43 grid-cols-2 gap-4">
        <Section href="/store/settings/payments/methods" bleed>
          <div className="relative flex h-full flex-col overflow-hidden rounded-inherit">
            {isPaymentsTestModeEnabled && (
              <div
                aria-hidden
                className="absolute inset-0 mask-[radial-gradient(ellipse_92%_96%_at_100%_0%,black_0%,black_28%,transparent_66%)]"
              >
                <SystemAlertStripes className="text-yellow-300" />
              </div>
            )}
            <div className="p-5">
              <PaymentMethodHeader
                title="Methods"
                description={
                  isPaymentsTestModeEnabled
                    ? 'Accepting test orders only'
                    : `Accepting ${paymentMethods.length} of ${paymentMethods.length}`
                }
                status={isPaymentsTestModeEnabled ? 'Test mode' : 'Active'}
              />
            </div>
            <PaymentMethodMarquee />
          </div>
        </Section>
        <Section href="/store/settings/payments/payouts">
          <div className="flex h-full flex-col overflow-hidden">
            <PaymentMethodHeader
              title="Payouts"
              description="Next payout June 2"
              status="Active"
            />
            <div className="mt-auto flex items-center gap-3">
              <img
                alt=""
                className="size-8 rounded-lg"
                src="/images/payment-settings/bank.svg"
              />
              <p className="tabular-nums">
                Tangerine Bank{' '}
                <span aria-hidden>{'\u2022\u2022\u2022\u2022'}</span> 5678
              </p>
            </div>
          </div>
        </Section>
      </div>
    </Section>
  );
}

function PaymentMethodHeader({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: 'Active' | 'Test mode';
}) {
  return (
    <div className="relative flex items-start justify-between gap-5">
      <div className="flex flex-col gap-0.5">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1">
        <StatusIndicator status={status === 'Active' ? 'active' : 'caution'} />
        <span>{status}</span>
      </span>
    </div>
  );
}

function PaymentMethodMarquee() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 mt-auto overflow-hidden rounded-inherit rounded-t-none">
      <style>
        {`
          @keyframes payment-method-marquee {
            to {
              transform: translateX(calc(-1 * var(--payment-method-marquee-distance)));
            }
          }
        `}
      </style>
      <div
        className="relative -left-6 flex h-9 w-max gap-1 will-change-transform"
        style={
          {
            '--payment-method-marquee-distance': `${paymentMethodMarqueeDistance}px`,
            animation: 'payment-method-marquee 500s linear infinite',
          } as CSSProperties
        }
      >
        {displayedPaymentMethods.map((method, index) => (
          <img
            key={`${method.id}-${index}`}
            alt={index < paymentMethods.length ? method.name : ''}
            aria-hidden={index >= paymentMethods.length}
            className="h-12 object-contain"
            src={method.icon}
          />
        ))}
      </div>
    </div>
  );
}

export { ShopifyPaymentsSection };
