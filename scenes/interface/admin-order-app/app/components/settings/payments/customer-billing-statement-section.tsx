import { Input, Section } from '~/ui';

function CustomerBillingStatementSection() {
  return (
    <Section
      title="Customer billing statement"
      subtitle="The way your store name and phone number appear on your customers bank statements"
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Statement name"
          defaultValue="MVSE"
          prefix="SP"
          suffix="4/19"
          helper="Must include your shop name, legal entity name, DBA name, or URL"
        />
        <Input label="Phone number" defaultValue="800-333-1234" prefix="🇺🇸" />
      </div>
    </Section>
  );
}

export { CustomerBillingStatementSection };
