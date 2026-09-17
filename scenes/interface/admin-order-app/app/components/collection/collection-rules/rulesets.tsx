import { clsx } from 'clsx';
import { Children, type ComponentProps, type ReactNode } from 'react';
import {
  createRuleForConditionType,
  getCollectionRuleInputButtons,
  type CollectionConditionType,
} from '~/data/collection-rulesets';
import type {
  CollectionRuleCondition,
  CollectionRuleMatch,
  CollectionRuleSet,
} from '~/data/collections';
import type { CollectionRuleSetEditor } from '~/hooks/collections/use-collection-rules';
import { Combobox } from '~/ui/components/combobox/combobox';
import { Icon } from '~/ui/components/icon/icon';
import { InputButton } from '~/ui/components/input-button/input-button';
import { Select } from '~/ui/components/select/select';
import { RulesetActions } from './ruleset-actions';

type IconName = ComponentProps<typeof Icon>['name'];

function Rulesets({
  conditionTypes,
  editor,
  ruleSet,
}: {
  conditionTypes: readonly CollectionConditionType[];
  editor: CollectionRuleSetEditor;
  ruleSet: CollectionRuleSet;
}) {
  const isEmptyRuleSet = !editor.hasRules;
  const actions = (
    <RulesetActions
      deleteOnly={isEmptyRuleSet || editor.hasEmptyConditionRule}
      hasConditionRules={editor.hasConditionRules}
      hasRules={editor.hasRules}
      limit={ruleSet.limit}
      manualProductCount={editor.manualProductCount}
      positionedProductCount={editor.positionedProductCount}
      onAddInclusion={editor.addInclusion}
      onAddExclusion={editor.addExclusion}
      onAddLimit={editor.addLimit}
      onAddManualProducts={editor.addManualProducts}
      onAddPositioning={editor.addPositioning}
      onRemove={editor.removeRuleSetDetails}
    />
  );

  return (
    <div className="flex w-full flex-col items-start gap-2">
      {editor.groups.map((group, groupIndex) => {
        const groupActions = groupIndex === 0 ? actions : undefined;
        const isEmpty = group.rules.length === 0;
        const showGroupHeader =
          !isEmpty && (group.rules.length > 1 || group.intent === 'exclude');
        const iconName =
          group.intent === 'exclude' ? 'SquareDashedMinus' : 'SquareDashedPlus';

        return (
          <div
            key={group.id}
            className="flex w-full flex-col items-start gap-2"
          >
            {showGroupHeader ? (
              <RuleRow icon={iconName} actions={groupActions}>
                <span className="text-muted-foreground">
                  {group.intent === 'exclude'
                    ? 'Collections matching'
                    : 'Match'}
                </span>
                <InputButton.Picker
                  label="Match conditions"
                  value={group.match}
                  aria-label="Toggle condition match"
                  onClick={() => group.onMatchChange(getNextMatch(group.match))}
                  squared
                />
                <span className="text-muted-foreground">conditions</span>
              </RuleRow>
            ) : null}
            <RuleRow
              actions={!showGroupHeader ? groupActions : undefined}
              border={showGroupHeader}
              contentLayout={isEmpty ? 'inline' : 'stack'}
              icon={showGroupHeader ? undefined : iconName}
            >
              {isEmpty && group.intent === 'include' ? (
                <EmptyRulePicker
                  conditionTypes={conditionTypes}
                  onSelect={group.onAddRule}
                />
              ) : isEmpty ? null : (
                group.rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex flex-wrap items-center gap-2"
                  >
                    {rule.field ? (
                      <RuleItem
                        conditionTypes={conditionTypes}
                        rule={rule}
                        onChange={group.onRuleChange}
                      />
                    ) : (
                      <EmptyRulePicker
                        conditionTypes={conditionTypes}
                        onSelect={(conditionType) =>
                          group.onRuleChange(
                            createRuleForConditionType({
                              conditionType,
                              id: rule.id,
                            }),
                          )
                        }
                      />
                    )}
                  </div>
                ))
              )}
            </RuleRow>
          </div>
        );
      })}
    </div>
  );
}

function EmptyRulePicker({
  conditionTypes,
  onSelect,
}: {
  conditionTypes: readonly CollectionConditionType[];
  onSelect: (conditionType: CollectionConditionType) => void;
}) {
  return (
    <Select
      options={conditionTypes.map((conditionType) => ({
        value: conditionType.value,
        label: conditionType.label,
      }))}
      onValueChange={(value) => {
        if (typeof value !== 'string') return;

        const conditionType = conditionTypes.find(
          (candidate) => candidate.value === value,
        );
        if (conditionType) onSelect(conditionType);
      }}
      trigger={() => (
        <InputButton.Picker
          icon={<Icon name="DependencyLink" />}
          label="Add rule"
          value="Add rule"
          squared
        />
      )}
    />
  );
}

function RuleRow({
  actions,
  border = false,
  children,
  contentLayout = 'inline',
  icon,
}: {
  actions?: ReactNode;
  border?: boolean;
  children: ReactNode;
  contentLayout?: 'inline' | 'stack';
  icon?: IconName;
}) {
  const content =
    border && contentLayout === 'stack'
      ? Children.map(children, (child) => (
          <div
            className={clsx(
              'relative before:absolute before:top-0 before:-left-5 before:h-4 before:w-3 before:rounded-bl-md before:border-b before:border-l before:border-border',
              'after:absolute after:-top-7.5 after:-left-5 after:h-9.5 after:border-l after:border-border',
            )}
          >
            {child}
          </div>
        ))
      : children;

  return (
    <div
      className={clsx(
        'relative flex w-full items-start gap-2',
        border && 'pl-7',
      )}
    >
      {icon ? (
        <span className="relative z-2 mt-1.75 shrink-0 text-muted-foreground after:absolute after:-inset-1 after:-z-1 after:rounded-full after:bg-background">
          <Icon name={icon} />
        </span>
      ) : null}
      <div
        className={clsx(
          'flex flex-1 gap-2',
          contentLayout === 'stack'
            ? 'flex-col items-start'
            : 'flex-wrap items-center',
        )}
      >
        {content}
      </div>
      {actions}
    </div>
  );
}

function RuleItem({
  conditionTypes,
  rule,
  onChange,
}: {
  conditionTypes: readonly CollectionConditionType[];
  rule: CollectionRuleCondition;
  onChange: (rule: CollectionRuleCondition) => void;
}) {
  return (
    <>
      {getCollectionRuleInputButtons(rule, conditionTypes).map((button) => {
        if (button.type === 'text') {
          return (
            <InputButton.Text
              key={button.label}
              label={button.label}
              prefix={button.prefix}
              showPill={false}
              value={button.value}
              onValueChange={(value) => onChange(button.onValueChange(value))}
              squared
            />
          );
        }

        if (button.type === 'static') {
          return (
            <span
              key={button.value}
              className="flex h-7.5 items-center text-base text-muted-foreground"
            >
              {button.value}
            </span>
          );
        }

        if (button.selectionMode === 'multiple') {
          const selectedValues = Array.isArray(rule.values) ? rule.values : [];

          return (
            <Combobox
              key={button.label}
              value={selectedValues}
              options={button.options}
              selectionMode="multiple"
              placeholder={button.placeholder}
              onValueChange={(value) => onChange(button.onValueChange(value))}
              trigger={() => (
                <InputButton.Picker
                  aria-label={button.ariaLabel}
                  label={button.value || button.placeholder || button.label}
                  value={button.value}
                  squared
                />
              )}
            />
          );
        }

        return (
          <Select
            key={button.label}
            value={getSelectedValue(button.options, button.value)}
            options={button.options}
            onValueChange={(value) => {
              if (typeof value === 'string') {
                onChange(button.onValueChange(value));
              }
            }}
            trigger={() => (
              <InputButton.Picker
                aria-label={button.ariaLabel}
                label={button.value || button.placeholder || button.label}
                value={button.value}
                squared
              />
            )}
          />
        );
      })}
    </>
  );
}

function getSelectedValue(
  options: { value: string; label: string }[],
  valueLabel: string,
) {
  return (
    options.find((option) => option.label === valueLabel)?.value ??
    options.find((option) => option.value === valueLabel)?.value
  );
}

function getNextMatch(match: CollectionRuleMatch): CollectionRuleMatch {
  return match === 'all' ? 'any' : 'all';
}

export { Rulesets };
