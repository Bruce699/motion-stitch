import { Button, Icon, Menu, Section } from '~/ui';

function PayoutAccountSection() {
  return (
    <div className="flex flex-col gap-4">
      <Section
        title="Payout bank account"
        action={
          <Button
            onClick={() => {}}
            variant="secondary"
            prefix={<Icon name="Plus" />}
          >
            Account
          </Button>
        }
      >
        <div className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <img
              alt=""
              className="size-11 shrink-0"
              src="/images/payment-settings/bank-big.svg"
            />
            <div className="flex flex-col gap-0.5">
              <p className="font-medium">Tangerine Bank</p>
              <p className="text-muted-foreground">
                {
                  '•••• 5678 ·\u00a0 Canadian Dollars (CAD $) ·\u00a0 Domestic currency ·\u00a0 No payout fee'
                }
              </p>
            </div>
          </div>
          <Menu
            align="end"
            trigger={
              <Button
                onClick={() => {}}
                aria-label="Payout bank account actions"
                size="icon"
                variant="plain"
              >
                <Icon name="Dots" />
              </Button>
            }
            options={[{ label: 'Replace account' }]}
          />
        </div>
      </Section>
    </div>
  );
}

export { PayoutAccountSection };
