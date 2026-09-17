import { Aside, Button } from '~/ui';
import { Switch } from '~/ui/components/switch/switch';

export function CreateShippingLabelAside() {
  return (
    <Aside.Root>
      <Aside.Group>
        <div className="flex items-center justify-between">
          <span>Total</span>
          <span className="font-medium tabular-nums">$35 USD</span>
        </div>
        <div className="my-4 border-t border-dashed border-border mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]" />
        <Aside.Item type="info" spaceBetween>
          <span className="text-muted-foreground">Shipping date</span>
          <span className="font-medium">Today</span>
        </Aside.Item>
        <Aside.Item type="info" spaceBetween>
          <span className="text-muted-foreground">Email confirmation now</span>
          <Switch
            ariaLabel="Email confirmation now"
            defaultChecked
            onCheckedChange={() => {}}
          />
        </Aside.Item>
        <div className="mt-4 grid">
          <Button onClick={() => {}} type="button">
            Buy shipping label
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          By buying this shipping label, I certify that all customs information
          provided is correct and true.
        </p>
      </Aside.Group>
    </Aside.Root>
  );
}
