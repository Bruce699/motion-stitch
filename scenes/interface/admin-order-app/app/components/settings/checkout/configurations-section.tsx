import { Badge, Button, Icon, Menu, Section } from '~/ui';

function ConfigurationsSection() {
  return (
    <Section
      title="Configurations"
      subtitle="Customize checkout and customer accounts."
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <p className="font-medium">Checkout configuration</p>
            <Badge variant="success">Live</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Sep 12 at 12:55 pm</p>
        </div>
        <div className="flex items-center gap-2">
          <Menu
            trigger={
              <Button
                onClick={() => {}}
                aria-label="Configuration actions"
                size="icon"
                variant="plain"
              >
                <Icon name="Dots" />
              </Button>
            }
            options={[
              { label: 'Rename' },
              { label: 'Duplicate' },
              { type: 'separator' },
              { label: 'View activity' },
            ]}
          />
          <Button onClick={() => {}} variant="secondary">
            Duplicate
          </Button>
          <Button onClick={() => {}} variant="secondary">
            Customize
          </Button>
        </div>
      </div>
    </Section>
  );
}

export { ConfigurationsSection };
