import { Button } from '~/ui/components/button/button';
import { Icon } from '~/ui/components/icon/icon';
import { Menu } from '~/ui/components/menu/menu';

function RulesetActions({
  deleteOnly = false,
  hasConditionRules,
  hasRules,
  limit,
  manualProductCount,
  positionedProductCount,
  onAddInclusion,
  onAddExclusion,
  onAddLimit,
  onAddManualProducts,
  onAddPositioning,
  onRemove,
}: {
  deleteOnly?: boolean;
  hasConditionRules: boolean;
  hasRules: boolean;
  limit?: number;
  manualProductCount: number;
  positionedProductCount: number;
  onAddInclusion: () => void;
  onAddExclusion: () => void;
  onAddLimit: () => void;
  onAddManualProducts: () => void;
  onAddPositioning: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex min-h-7.5 shrink-0 items-center justify-end">
      <div className="mr-0.5 flex gap-1.5">
        {limit !== undefined ? (
          <RuleCountButton
            icon="FilterMinus"
            label={`Limit ${limit}`}
            value={limit}
          />
        ) : null}
        {positionedProductCount > 0 ? (
          <RuleCountButton
            icon="SortObjTopToBottom"
            label={`${positionedProductCount} positioned products`}
            value={positionedProductCount}
          />
        ) : null}
        <RuleCountButton
          icon="TagPlus"
          label={
            manualProductCount > 0
              ? `${manualProductCount} manual products`
              : 'Add products'
          }
          value={manualProductCount}
          onClick={onAddManualProducts}
        />
      </div>
      <RuleActionMenu
        deleteOnly={deleteOnly}
        hasConditionRules={hasConditionRules}
        hasRules={hasRules}
        onAddInclusion={onAddInclusion}
        onAddExclusion={onAddExclusion}
        onAddLimit={onAddLimit}
        onAddPositioning={onAddPositioning}
        onRemove={onRemove}
      />
    </div>
  );
}

function RuleActionMenu({
  deleteOnly,
  hasConditionRules,
  hasRules,
  onAddInclusion,
  onAddExclusion,
  onAddLimit,
  onAddPositioning,
  onRemove,
}: {
  deleteOnly: boolean;
  hasConditionRules: boolean;
  hasRules: boolean;
  onAddInclusion: () => void;
  onAddExclusion: () => void;
  onAddLimit: () => void;
  onAddPositioning: () => void;
  onRemove: () => void;
}) {
  return (
    <Menu
      align="end"
      trigger={
        <Button
          onClick={() => {}}
          type="button"
          variant="plain"
          size="icon"
          aria-label="Add collection rule"
        >
          <span className="text-muted-foreground">
            <Icon name="Dots" />
          </span>
        </Button>
      }
      options={
        deleteOnly
          ? [getRemoveOption(onRemove)]
          : [
              {
                id: 'include',
                label: 'Include',
                prefix: <Icon name="SquareDashedPlus" />,
                onSelect: onAddInclusion,
              },
              {
                id: 'exclude',
                label: 'Exclude',
                prefix: <Icon name="SquareDashedMinus" />,
                onSelect: onAddExclusion,
              },
              ...(hasConditionRules
                ? [
                    {
                      id: 'limit',
                      label: 'Limit',
                      prefix: <Icon name="FilterMinus" />,
                      onSelect: onAddLimit,
                    },
                    {
                      id: 'position',
                      label: 'Position',
                      prefix: <Icon name="SortObjTopToBottom" />,
                      onSelect: onAddPositioning,
                    },
                  ]
                : []),
              ...(hasRules
                ? [
                    { type: 'separator' as const, id: 'separator' },
                    getRemoveOption(onRemove),
                  ]
                : []),
            ]
      }
    />
  );
}

function getRemoveOption(onRemove: () => void) {
  return {
    id: 'remove',
    label: <span className="text-red-600">Remove</span>,
    prefix: (
      <span className="text-red-600">
        <Icon name="Trash" />
      </span>
    ),
    onSelect: onRemove,
  };
}

function RuleCountButton({
  icon,
  label,
  onClick,
  value,
}: {
  icon: 'FilterMinus' | 'SortObjTopToBottom' | 'TagPlus';
  label: string;
  onClick?: () => void;
  value: number;
}) {
  return (
    <Button
      type="button"
      variant={value > 0 ? 'elevated' : 'plain'}
      size={value > 0 ? 'sm' : 'icon'}
      aria-label={label}
      onClick={onClick}
      prefix={
        <span className="text-muted-foreground">
          <Icon name={icon} size={14} />
        </span>
      }
    >
      {value > 0 && (
        <span className="-mr-1.75 ml-1 flex h-5 min-w-6 items-center justify-center rounded-full bg-gray-100 text-sm text-primary">
          {value}
        </span>
      )}
    </Button>
  );
}

export { RulesetActions };
