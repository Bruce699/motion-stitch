import { Input } from '~/ui/components/input/input';
import { Section } from '~/ui/components/section/section';

function OrderIdSection() {
  return (
    <div className="flex flex-col gap-3">
      <Section title="Order ID">
        <div className="flex gap-4">
          <Input label="Prefix" defaultValue="#" />
          <Input label="Suffix" />
        </div>
      </Section>
      <p className="px-0.5 text-muted-foreground">
        Order IDs will appear as #1001, #1002, #1003...
      </p>
    </div>
  );
}

export { OrderIdSection };
