import { Button, Checkbox, Icon, Section } from '~/ui';
import type { ProductPurchaseOptionGroup } from '~/data/products';

function ProductPurchaseOptions({
  groups,
  onlySellWithPurchaseOptions,
  onOnlySellWithPurchaseOptionsChange,
}: {
  groups: ProductPurchaseOptionGroup[];
  onlySellWithPurchaseOptions: boolean;
  onOnlySellWithPurchaseOptionsChange: (value: boolean) => void;
}) {
  if (groups.length === 0) return null;

  return (
    <Section
      title="Purchase options"
      action={
        <Button
          onClick={() => {}}
          prefix={<Icon name="Plus" size={16} />}
          type="button"
          variant="secondary"
        >
          Option
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <article key={group.id}>
            <div className="group flex items-start gap-2">
              <div className="bg-teal-100 text-teal-700 flex size-6 shrink-0 items-center justify-center rounded-lg">
                <Icon name={group.iconName} size={16} />
              </div>
              <div className="flex-1">
                <h3 className="text-md font-medium text-primary">
                  {group.name}
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-3 text-secondary">
                  {group.options.map((option) => (
                    <li key={option.id}>{option.title}</li>
                  ))}
                </ul>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    onClick={() => {}}
                    aria-label={`Edit ${group.name}`}
                    size="sm-icon"
                    type="button"
                    variant="plain"
                  >
                    <Icon name="Pen" />
                  </Button>
                </span>
              </div>
            </div>
          </article>
        ))}
        <hr className="h-px w-full shrink-0 rounded-full border-0 bg-border" />
        <Checkbox
          checked={onlySellWithPurchaseOptions}
          label="Only sell with this purchase option"
          labelClassName="ml-1 text-primary text-md gap-2"
          onCheckedChange={(checked) =>
            onOnlySellWithPurchaseOptionsChange(checked === true)
          }
        />
      </div>
    </Section>
  );
}

export { ProductPurchaseOptions };
