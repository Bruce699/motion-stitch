import { SettingsActionList, type SettingsActionListItem, Section } from '~/ui';

const advancedSettings: SettingsActionListItem[] = [
  { title: 'Address collection', icon: 'Pin' },
  {
    title: 'Add to cart limit',
    description:
      'Protects your available inventory quantities from being revealed.',
    icon: 'CartShopping',
    control: 'switch',
  },
];

function AdvancedSection() {
  return (
    <Section title="Advanced" bleed noBg>
      <SettingsActionList items={advancedSettings} />
    </Section>
  );
}

export { AdvancedSection };
