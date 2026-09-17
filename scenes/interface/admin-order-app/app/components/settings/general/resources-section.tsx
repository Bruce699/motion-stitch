import {
  SettingsActionList,
  type SettingsActionListItem,
} from '~/ui/components/settings-action-list/settings-action-list';
import { Section } from '~/ui/components/section/section';

const resourceItems: SettingsActionListItem[] = [
  { title: 'Changelog', icon: 'Swap' },
  { title: 'Shopify Help Center', icon: 'CircleQuestion' },
  { title: 'Hire a Shopify Partner', icon: 'Code2' },
  { title: 'Keyboard shortcuts', icon: 'Keyboard2' },
  { title: 'Store activity log', icon: 'TimelineVertical2' },
];

function ResourcesSection() {
  return (
    <Section title="Resources" bleed noBg>
      <SettingsActionList items={resourceItems} />
    </Section>
  );
}

export { ResourcesSection };
