import type { OrderPaymentSummary } from '~/data/orders';
import { Icon, Section } from '~/ui';
import { clsx } from 'clsx';

export function OrderPayment({ payment }: { payment?: OrderPaymentSummary }) {
  if (!payment) return null;

  const isGiftCardPayment = payment.shipping.method === 'Gift card';

  return (
    <Section
      layerId="payment"
      bleed
      title="Payment"
      wrapperContent={<SummaryRows payment={payment} />}
    >
      <div className="flex flex-col px-5 py-3">
        <PaymentRow
          icon="CartShopping"
          label="Subtotal"
          detail={payment.subtotal.detail}
          value={payment.subtotal.value}
        />
        {isGiftCardPayment ? null : (
          <>
            <PaymentRow
              icon="DiscountCode"
              label="Discount"
              detail={payment.discount.code}
              value={payment.discount.value}
            />
            <PaymentRow
              icon="TruckFast"
              label="Shipping"
              detail={payment.shipping.method}
              value={payment.shipping.value}
            />
          </>
        )}
        <hr className="my-1.5 ml-6.5 border-border" />
        <PaymentRow
          icon="CircleDollar"
          label="Total"
          value={payment.total}
          strong
        />
      </div>
    </Section>
  );
}

function SummaryRows({ payment }: { payment: OrderPaymentSummary }) {
  return (
    <div className="flex flex-col gap-2 px-5 py-4">
      <div className="flex items-center justify-between">
        <img
          src="/images/payment-methods/shop-cash.svg"
          alt="Shop Cash"
          className="h-4.25 w-15"
        />
        <span className="font-medium tabular-nums">{payment.shopCash}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-secondary tabular-nums">
          <img
            src="/images/payment-methods/mastercard.svg"
            alt="Mastercard"
            className="h-4 w-6"
          />
          <span className="tabular-nums">{payment.cardLast4}</span>
        </span>
        <span className="font-medium tabular-nums">{payment.cardTotal}</span>
      </div>
    </div>
  );
}

function PaymentRow({
  detail,
  icon,
  label,
  strong = false,
  value,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  detail?: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-muted-foreground">
        <Icon name={icon} size={14} />
      </span>
      <span className={clsx('flex-1', strong && 'font-bold')}>{label}</span>
      {detail ? (
        <span className="text-secondary tabular-nums">{detail}</span>
      ) : null}
      <span
        className={clsx(
          'min-w-20 text-right tabular-nums',
          strong && 'font-bold',
        )}
      >
        {value}
      </span>
    </div>
  );
}
