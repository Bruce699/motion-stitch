import { createShippingLabelPackages } from '~/data/packages';
import { Button, Icon, InputButton, Section, Select } from '~/ui';

export function CreateShippingLabelPackage() {
  const packageOptions = createShippingLabelPackages.map((shippingPackage) => ({
    value: shippingPackage.id,
    label: shippingPackage.name,
  }));

  return (
    <Section
      title="Package"
      action={
        <Button
          onClick={() => {}}
          variant="secondary"
          prefix={<Icon name="Plus" />}
        >
          Package
        </Button>
      }
    >
      <div className="mb-4 flex-1">
        <Select
          aria-label="Package"
          prefix={<Icon name="Box" />}
          options={packageOptions}
          value="clothing-box"
          onValueChange={() => {}}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <InputButton.Text
          label="Total weight"
          value="9"
          suffix="kg"
          onValueChange={() => {}}
        />
      </div>
    </Section>
  );
}
