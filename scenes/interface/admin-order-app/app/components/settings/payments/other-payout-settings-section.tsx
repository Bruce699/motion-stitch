import { SettingsActionList, type SettingsActionListItem, Section } from '~/ui';

const otherPayoutSettings: SettingsActionListItem[] = [
  { title: 'Payout schedule', icon: 'Calendar', value: 'Daily' },
  {
    title: 'Payout email confirmation',
    icon: 'Envelope',
    control: 'switch',
  },
];

function OtherPayoutSettingsSection() {
  return (
    <Section title="Other" bleed noBg>
      <SettingsActionList items={otherPayoutSettings} />
    </Section>
  );
}

export { OtherPayoutSettingsSection };
