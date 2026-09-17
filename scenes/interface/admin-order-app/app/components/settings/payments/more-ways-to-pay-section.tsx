import { Button, Icon, Image, Section } from '~/ui';

const moreWaysToPayLineItems = [
  {
    name: 'PayPal',
    icons: ['/images/payment-settings/paypal-card.svg'],
  },
  {
    name: 'BitPay',
    icons: [
      '/images/payment-settings/other-ways-to-pay/bitcoin.svg',
      '/images/payment-settings/other-ways-to-pay/ethereum.svg',
      '/images/payment-settings/other-ways-to-pay/bitcoin-cash.svg',
    ],
  },
];

function MoreWaysToPaySection() {
  return (
    <Section
      title="More ways to pay"
      action={
        <Button
          href="/store/settings/payments/more-ways-to-pay"
          prefix={<Icon name="Plus" />}
          variant="secondary"
        >
          Add
        </Button>
      }
      bleed
    >
      <div className="p-2">
        <style>
          {`
            .more-ways-to-pay-item:has(.more-ways-to-pay-row:hover) .more-ways-to-pay-divider hr,
            .more-ways-to-pay-item:has(+ .more-ways-to-pay-item .more-ways-to-pay-row:hover) .more-ways-to-pay-divider hr {
              border-color: transparent;
            }
          `}
        </style>
        {moreWaysToPayLineItems.map((item, index) => (
          <div key={item.name} className="more-ways-to-pay-item">
            <div className="more-ways-to-pay-row flex cursor-pointer items-center justify-between gap-5 rounded-lg p-3 transition-colors ease-out hover:bg-gray-50">
              <div className="flex flex-col gap-0.5">
                <p className="font-medium">{item.name}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {item.icons.map((icon) => (
                  <Image
                    key={icon}
                    alt=""
                    borderRadius="none"
                    className="h-6 w-[35px]"
                    objectFit="contain"
                    src={icon}
                  />
                ))}
              </div>
            </div>
            {index < moreWaysToPayLineItems.length - 1 ? (
              <div className="more-ways-to-pay-divider px-3">
                <hr className="border-t border-border transition-colors ease-out" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Section>
  );
}

export { MoreWaysToPaySection };
