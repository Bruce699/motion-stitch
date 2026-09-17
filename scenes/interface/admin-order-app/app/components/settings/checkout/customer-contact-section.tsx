import { Radio, Section } from '~/ui';
import { Switch } from '~/ui/components/switch/switch';

function CustomerContactSection() {
  return (
    <Section
      title="Customer contact"
      subtitle="The contact method customers enter at checkout will receive order and shipping notifications."
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-5">
          <p className="font-medium">Method</p>
          <div className="shrink-0">
            <Radio.Group
              direction="row"
              defaultValue="email-only"
              aria-label="Contact method"
            >
              <Radio.Root value="email-only" label="Email only" />
              <Radio.Root value="email-or-phone" label="Email or phone" />
            </Radio.Group>
          </div>
        </div>
        <hr className="h-px w-full shrink-0 rounded-full border-0 bg-border" />
        <div className="flex items-center justify-between gap-5">
          <div className="flex flex-col gap-0.5">
            <p className="font-medium">
              Show a link for customers to track their order with Shop
            </p>
            <p className="text-muted-foreground">
              Customers will be able to download the app from the order status
              page.
            </p>
          </div>
          <Switch
            ariaLabel="Track order with Shop"
            defaultChecked
            onCheckedChange={() => {}}
          />
        </div>
        <hr className="h-px w-full shrink-0 rounded-full border-0 bg-border" />
        <div className="flex items-center justify-between gap-5">
          <div className="flex flex-col gap-0.5">
            <p className="font-medium">
              Require customers to sign in to their account before checkout
            </p>
            <p className="text-muted-foreground">
              Customers can only use email when sign-in is required.
            </p>
          </div>
          <Switch
            ariaLabel="Require sign in before checkout"
            onCheckedChange={() => {}}
          />
        </div>
      </div>
    </Section>
  );
}

export { CustomerContactSection };
