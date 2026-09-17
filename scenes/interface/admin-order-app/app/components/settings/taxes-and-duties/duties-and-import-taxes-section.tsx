import { Button } from '~/ui/components/button/button';
import { Icon } from '~/ui/components/icon/icon';
import { Link } from '~/ui/components/link/link';
import { Section } from '~/ui/components/section/section';

export function DutiesAndImportTaxesSection() {
  return (
    <Section
      title="Duties and import taxes"
      wrapperBg="bg-blue-200"
      wrapperContent={
        <div className="flex items-center gap-2 px-5 py-3 text-blue-900">
          <Icon name="CircleWarning" size={14} />
          <p className="text-sm">
            <Link
              to="/store/orders/shipping-labels"
              className="font-medium underline underline-offset-2"
            >
              Delivered duty paid (DDP)
            </Link>{' '}
            shipping labels are available to all of your fulfillment locations
          </p>
        </div>
      }
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <p className="font-medium">
            Collect duties and import taxes at checkout
          </p>
          <p className="text-muted-foreground">
            Prevent surprise fees for international customers at delivery · 0.5%
            transaction fee
          </p>
        </div>
        <Button onClick={() => {}} variant="secondary">
          Set up
        </Button>
      </div>
    </Section>
  );
}
