import { Button, Radio, Section } from '~/ui';

function CustomerInformationSection() {
  return (
    <Section
      title="Customer information"
      action={
        <Button onClick={() => {}} variant="secondary">
          Customize labels
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-5">
          <p className="font-medium">Last name</p>
          <Radio.Group
            direction="row"
            defaultValue="optional"
            aria-label="Last name"
          >
            <Radio.Root value="hidden" label="Hidden" />
            <Radio.Root value="optional" label="Optional" />
          </Radio.Group>
        </div>
        <hr className="h-px w-full shrink-0 rounded-full border-0 bg-border" />
        <div className="flex items-center justify-between gap-5">
          <p className="font-medium">Company name</p>
          <Radio.Group
            direction="row"
            defaultValue="hidden"
            aria-label="Company name"
          >
            <Radio.Root value="hidden" label="Hidden" />
            <Radio.Root value="optional" label="Optional" />
            <Radio.Root value="required" label="Required" />
          </Radio.Group>
        </div>
        <hr className="h-px w-full shrink-0 rounded-full border-0 bg-border" />
        <div className="flex items-center justify-between gap-5">
          <p className="font-medium">Address Line 2 (Apt, unit, etc.)</p>
          <Radio.Group
            direction="row"
            defaultValue="optional"
            aria-label="Address Line 2"
          >
            <Radio.Root value="hidden" label="Hidden" />
            <Radio.Root value="optional" label="Optional" />
            <Radio.Root value="required" label="Required" />
          </Radio.Group>
        </div>
        <hr className="h-px w-full shrink-0 rounded-full border-0 bg-border" />
        <div className="flex items-center justify-between gap-5">
          <p className="font-medium">Shipping address phone number</p>
          <Radio.Group
            direction="row"
            defaultValue="hidden"
            aria-label="Shipping address phone number"
          >
            <Radio.Root value="hidden" label="Hidden" />
            <Radio.Root value="optional" label="Optional" />
            <Radio.Root value="required" label="Required" />
          </Radio.Group>
        </div>
      </div>
    </Section>
  );
}

export { CustomerInformationSection };
