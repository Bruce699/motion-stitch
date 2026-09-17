import { Radio, Section } from '~/ui';

function CryptoTransactionsSection() {
  return (
    <div className="flex flex-col gap-4">
      <Section title="Crypto transactions">
        <Radio.Group
          defaultValue="bank"
          aria-label="Crypto transaction payout destination"
        >
          <Radio.Root
            value="bank"
            label="Receive USD payouts daily in your default bank account"
          />
          <Radio.Root
            value="wallet"
            label="Receive USDC payouts to a connected wallet"
          />
        </Radio.Group>
      </Section>
      <p className="text-secondary">Only applies to orders paid in USDC</p>
    </div>
  );
}

export { CryptoTransactionsSection };
