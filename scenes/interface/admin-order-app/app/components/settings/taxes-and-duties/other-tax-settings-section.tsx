import { Link } from '~/ui/components/link/link';
import { Section } from '~/ui/components/section/section';
import { SettingsActionList } from '~/ui/components/settings-action-list/settings-action-list';

export function OtherTaxSettingsSection() {
  return (
    <Section title="Other tax settings" bleed noBg>
      <SettingsActionList
        items={[
          {
            title: 'Include sales tax in product price and shipping rate',
            icon: 'Percentage',
            control: 'switch',
            defaultChecked: false,
            description: (
              <>
                Assumes a 6% tax rate, which is adjusted to local tax rates in
                markets with{' '}
                <Link
                  to="/store/markets"
                  className="text-secondary underline underline-offset-2"
                >
                  dynamic tax inclusion
                </Link>
              </>
            ),
          },
          {
            title: 'Charge sales tax on shipping',
            icon: 'TruckFast',
            control: 'switch',
            description:
              'Automatically calculated for Canada, European Union, and United States',
          },
          {
            title: 'Charge VAT on digital goods',
            icon: 'MonitorSettings',
            control: 'switch',
            defaultChecked: false,
            description: (
              <>
                Creates a collection of digital goods that will be{' '}
                <Link
                  to="/store/products/collections"
                  className="text-secondary underline underline-offset-2"
                >
                  charged VAT
                </Link>{' '}
                at checkout (for European customers)
              </>
            ),
          },
        ]}
      />
    </Section>
  );
}
