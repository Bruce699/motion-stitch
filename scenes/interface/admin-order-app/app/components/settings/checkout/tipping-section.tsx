import { Icon, Section } from '~/ui';
import { Switch } from '~/ui/components/switch/switch';

function TippingSection() {
  return (
    <Section title="Tipping">
      <div className="flex items-center justify-between gap-5 pt-0.5">
        <div className="flex flex-1 items-center gap-3">
          <span className="text-muted-foreground">
            <Icon name="CircleDollar" />
          </span>
          <p className="font-medium">Show tipping options at checkout</p>
        </div>
        <Switch
          ariaLabel="Show tipping options at checkout"
          onCheckedChange={() => {}}
        />
      </div>
    </Section>
  );
}

export { TippingSection };
