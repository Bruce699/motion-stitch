import {
  SettingsActionList,
  type SettingsActionListItem,
} from '~/ui/components/settings-action-list/settings-action-list';
import { Section } from '~/ui/components/section/section';

const organizationItems: SettingsActionListItem[] = [
  { title: 'Group store in an organization', icon: 'Office' },
  { title: 'Transfer store to a new owner', icon: 'OpenRectArrowIn' },
];

function OrganizationsSection() {
  return (
    <Section title="Organizations and store transfers" bleed noBg>
      <SettingsActionList items={organizationItems} />
    </Section>
  );
}

export { OrganizationsSection };
