import { Button } from '~/ui/components/button/button';
import { Section } from '~/ui/components/section/section';

export function UpcomingBillSection() {
  return (
    <Section
      title="Upcoming bill"
      action={
        <Button onClick={() => {}} variant="secondary">
          View bill
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <p className="text-3xl font-medium">
          $49.99{' '}
          <span className="text-base text-muted-foreground uppercase">USD</span>
        </p>
        <p className="text-muted-foreground">
          Next bill in 18 days or when your $400 USD threshold is reached. You
          have $400 remaining.
        </p>
      </div>
    </Section>
  );
}
