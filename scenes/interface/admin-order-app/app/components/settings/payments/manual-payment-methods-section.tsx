import { Button, Icon, Section } from '~/ui';

function ManualPaymentMethodsSection() {
  return (
    <Section title="Manual payment methods" dashed>
      <div className="flex flex-col items-center justify-center gap-3">
        <Button
          onClick={() => {}}
          variant="plain"
          prefix={<Icon name="Plus" />}
        >
          Add payment method
        </Button>
      </div>
    </Section>
  );
}

export { ManualPaymentMethodsSection };
