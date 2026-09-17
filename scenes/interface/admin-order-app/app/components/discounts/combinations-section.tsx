import { Button, Icon, Section } from '~/ui';

export function CombinationsSection() {
  return (
    <Section title="Combinations" dashed>
      <div className="flex flex-col items-center justify-center gap-3">
        <Button
          onClick={() => {}}
          variant="plain"
          prefix={<Icon name="Plus" />}
        >
          Add combinations
        </Button>
      </div>
    </Section>
  );
}
