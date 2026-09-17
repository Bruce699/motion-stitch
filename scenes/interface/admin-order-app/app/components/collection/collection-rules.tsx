import type { CollectionRuleSet } from '~/data/collections';
import { collectionConditionTypes } from '~/data/collection-rulesets';
import { Button } from '~/ui/components/button/button';
import { Icon } from '~/ui/components/icon/icon';
import { Section } from '~/ui/components/section/section';
import { useCollectionRules } from '~/hooks/collections/use-collection-rules';
import { Rulesets } from './collection-rules/rulesets';

function CollectionRules({
  ruleSets,
  onRuleSetsChange,
}: {
  ruleSets: CollectionRuleSet[];
  onRuleSetsChange: (ruleSets: CollectionRuleSet[]) => void;
}) {
  const { addRuleSet, getRuleSetEditor, visibleRuleSets } = useCollectionRules({
    ruleSets,
    onRuleSetsChange,
  });

  return (
    <Section
      title="Rules"
      bleed
      action={
        <Button
          prefix={<Icon name="Plus" />}
          type="button"
          variant="secondary"
          onClick={addRuleSet}
        >
          Rule
        </Button>
      }
    >
      <div className="divide-y divide-border px-5 py-4.5">
        {visibleRuleSets.map((ruleSet) => {
          const editor = getRuleSetEditor(ruleSet);

          return (
            <div
              key={ruleSet.id}
              className="grid grid-cols-[160px_1fr] items-start gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="-ml-1.5">
                <Button
                  onClick={() => {}}
                  type="button"
                  variant="plain"
                  prefix={<Icon name="Tag" />}
                  suffix={
                    <span className="text-muted-foreground">
                      <Icon name="ChevronExpandY" size={12} />
                    </span>
                  }
                >
                  Products
                </Button>
              </div>
              <div>
                <Rulesets
                  conditionTypes={collectionConditionTypes}
                  ruleSet={ruleSet}
                  editor={editor}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export { CollectionRules };
