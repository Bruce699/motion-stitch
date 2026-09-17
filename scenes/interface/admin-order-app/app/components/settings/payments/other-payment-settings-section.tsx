import { SettingsActionList, type SettingsActionListItem, Section } from '~/ui';

const otherPaymentSettings: SettingsActionListItem[] = [
  { title: 'Payment capture', icon: 'CreditCard', value: 'Manually' },
  { title: 'Gift card expiration', icon: 'Gift', value: "Don't expire" },
  { title: 'Payment customization apps', icon: 'GridSquareCirclePlus' },
  { title: 'Apple Wallet passes', icon: 'WalletContent' },
];

function OtherPaymentSettingsSection() {
  return (
    <Section title="Other" bleed noBg>
      <SettingsActionList items={otherPaymentSettings} />
    </Section>
  );
}

export { OtherPaymentSettingsSection };
