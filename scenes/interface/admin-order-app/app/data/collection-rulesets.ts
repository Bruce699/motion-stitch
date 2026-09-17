import { productCategories } from './categories';
import { countries } from './countries';
import type { CollectionRuleCondition } from './collections';
import { collections } from './collections';
import { products, productTypes } from './products';
import { tags } from './tags';

type CollectionRuleInputType = 'picker' | 'text';

type CollectionConditionTypeBase = {
  value: string;
  label: string;
  operators: readonly string[];
  input: CollectionRuleInputType;
  options?: readonly string[];
  selectionMode?: 'single' | 'multiple';
  supportsAndOrWithinValues?: boolean;
  availability?: string;
  units?: readonly string[];
};

const collectionRuleVendorOptions = [
  'MVSE',
  'North Yard Supply',
  'Studio Atlas',
  'Deckworks',
  'Common Goods',
];

export const collectionConditionTypes = [
  {
    value: 'barcode',
    label: 'Barcode',
    operators: ['equals', 'does not equal'],
    input: 'picker',
    selectionMode: 'multiple',
  },
  {
    value: 'bundle-product',
    label: 'Bundle product',
    operators: ['is'],
    input: 'picker',
    options: [
      'sold as bundle',
      'sold as part of bundle',
      'not sold as bundle',
    ],
  },
  {
    value: 'category',
    label: 'Category',
    operators: ['equals', 'does not equal'],
    input: 'picker',
    selectionMode: 'multiple',
    supportsAndOrWithinValues: true,
  },
  {
    value: 'compare-at-price',
    label: 'Compare-at price',
    operators: [
      'equals',
      'does not equal',
      'is greater than',
      'is less than',
      'is not empty',
      'is empty',
    ],
    input: 'text',
  },
  {
    value: 'country-of-origin',
    label: 'Country of origin',
    operators: ['equals', 'does not equal'],
    input: 'picker',
  },
  {
    value: 'inventory-stock',
    label: 'Inventory stock',
    operators: ['equals', 'is greater than', 'is less than'],
    input: 'text',
  },
  {
    value: 'metafield',
    label: 'Metafield',
    operators: ['equals', 'does not equal'],
    input: 'picker',
    selectionMode: 'multiple',
    supportsAndOrWithinValues: true,
  },
  {
    value: 'price',
    label: 'Price',
    operators: ['equals', 'does not equal', 'is greater than', 'is less than'],
    input: 'text',
  },
  {
    value: 'product-status',
    label: 'Product status',
    operators: ['is', 'is not'],
    input: 'picker',
    selectionMode: 'multiple',
    options: ['Active', 'Draft', 'Unlisted', 'Archived'],
    availability:
      'Only shown for product matching, not variant matching or exclude conditions.',
  },
  {
    value: 'selling-plan',
    label: 'Selling plan',
    operators: [
      'equals',
      'does not equal',
      'starts with',
      'ends with',
      'contains',
      'does not contain',
    ],
    input: 'picker',
  },
  {
    value: 'tag',
    label: 'Tag',
    operators: ['equals', 'does not equal'],
    input: 'picker',
    selectionMode: 'multiple',
    supportsAndOrWithinValues: true,
  },
  {
    value: 'title',
    label: 'Title',
    operators: [
      'equals',
      'does not equal',
      'starts with',
      'ends with',
      'contains',
      'does not contain',
    ],
    input: 'text',
  },
  {
    value: 'type',
    label: 'Type',
    operators: [
      'equals',
      'does not equal',
      'starts with',
      'ends with',
      'contains',
      'does not contain',
    ],
    input: 'picker',
  },
  {
    value: 'variant-title',
    label: "Variant's title",
    operators: [
      'equals',
      'does not equal',
      'starts with',
      'ends with',
      'contains',
      'does not contain',
    ],
    input: 'text',
    availability: 'Only shown when matching target is products, not variants.',
  },
  {
    value: 'vendor',
    label: 'Vendor',
    operators: [
      'equals',
      'does not equal',
      'starts with',
      'ends with',
      'contains',
      'does not contain',
    ],
    input: 'picker',
  },
  {
    value: 'weight',
    label: 'Weight',
    operators: ['equals', 'does not equal', 'is greater than', 'is less than'],
    input: 'text',
    units: ['g', 'kg', 'oz', 'lb'],
  },
] as const satisfies readonly CollectionConditionTypeBase[];

export type CollectionConditionType = CollectionConditionTypeBase;

export type CollectionRuleInputOption = {
  value: string;
  label: string;
};

export type CollectionRuleInputButton =
  | {
      type: 'picker';
      label: string;
      value: string;
      options: CollectionRuleInputOption[];
      ariaLabel?: string;
      selectionMode?: 'single' | 'multiple';
      placeholder?: string;
      onValueChange: (value: string | string[]) => CollectionRuleCondition;
    }
  | {
      type: 'text';
      label: string;
      prefix?: string;
      value: string;
      onValueChange: (value: string) => CollectionRuleCondition;
    }
  | {
      type: 'static';
      value: string;
    };

function getConditionType(
  field: CollectionRuleCondition['field'],
  conditionTypes: readonly CollectionConditionType[] = collectionConditionTypes,
): CollectionConditionType | undefined {
  return conditionTypes.find((type) => type.value === field);
}

function getConditionLabel(
  field: CollectionRuleCondition['field'],
  conditionTypes: readonly CollectionConditionType[],
) {
  return (
    getConditionType(field, conditionTypes)?.label ??
    (field === 'collection' ? 'Collections' : field)
  );
}

function getOperator(rule: CollectionRuleCondition) {
  return rule.operator || 'equals';
}

function getValues(rule: CollectionRuleCondition) {
  return rule.values ?? [];
}

function optionsFromValues(
  values: readonly string[],
): CollectionRuleInputOption[] {
  return values.map((value) => ({ value, label: value }));
}

function uniqueValues(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getValueOptions(conditionType: CollectionConditionType | undefined) {
  if (!conditionType) {
    return collections.map((collection) => ({
      value: collection.id,
      label: collection.title,
    }));
  }

  if (conditionType.value === 'category') {
    return optionsFromValues(productCategories);
  }
  if (conditionType.value === 'barcode') {
    return optionsFromValues(
      uniqueValues(
        products.flatMap((product) =>
          product.variants.map((variant) => variant.sku),
        ),
      ),
    );
  }
  if (conditionType.value === 'country-of-origin') {
    return countries.map((country) => ({
      value: country.code,
      label: country.name,
    }));
  }
  if (conditionType.value === 'metafield') {
    return optionsFromValues(
      uniqueValues(
        products.flatMap((product) =>
          product.metafields.flatMap((metafield) =>
            metafield.values.map(
              (value) => `${metafield.name}: ${value.label}`,
            ),
          ),
        ),
      ),
    );
  }
  if (conditionType.value === 'selling-plan') {
    return optionsFromValues(
      uniqueValues(
        products.flatMap((product) =>
          product.purchaseOptions?.groups.flatMap((group) => [
            group.name,
            ...group.options.map((option) => option.title),
          ]) ?? [],
        ),
      ),
    );
  }
  if (conditionType.value === 'tag') {
    return tags.map((tag) => ({
      value: tag.id,
      label: tag.name,
    }));
  }
  if (conditionType.value === 'type') {
    return optionsFromValues(
      uniqueValues([
        ...productTypes,
        ...products.map((product) => product.productType),
      ]),
    );
  }
  if (conditionType.value === 'vendor') {
    return optionsFromValues(collectionRuleVendorOptions);
  }
  if (conditionType.options) return optionsFromValues(conditionType.options);
  if (conditionType.units) return optionsFromValues(conditionType.units);

  return [];
}

function getValueLabel({
  conditionType,
  rule,
}: {
  conditionType: CollectionConditionType | undefined;
  rule: CollectionRuleCondition;
}) {
  if (conditionType?.input === 'text') return String(rule.value ?? '');

  const options = getValueOptions(conditionType);
  const labels = getValues(rule)
    .map((value) => options.find((option) => option.value === value)?.label)
    .filter((label): label is string => Boolean(label));

  if (labels.length > 0) return getSelectedValuesLabel(labels);

  return '';
}

function getSelectedValuesLabel(labels: string[]) {
  const visibleLabels = labels.slice(0, 3);
  const hiddenCount = labels.length - visibleLabels.length;

  return hiddenCount > 0
    ? `${visibleLabels.join(', ')}, and ${hiddenCount} more`
    : visibleLabels.join(', ');
}

function hasCurrencyPrefix(conditionType: CollectionConditionType | undefined) {
  return ['price', 'compare-at-price'].includes(conditionType?.value ?? '');
}

export function createRuleForConditionType({
  conditionType,
  id,
}: {
  conditionType: CollectionConditionType;
  id: string;
}): CollectionRuleCondition {
  const nextRule: CollectionRuleCondition = {
    id,
    field: conditionType.value,
    operator: conditionType.operators[0] ?? 'equals',
  };

  if (conditionType.input === 'text') {
    return {
      ...nextRule,
      value: hasCurrencyPrefix(conditionType) ? '300' : '',
      unit: conditionType.units?.[0],
    };
  }

  return {
    ...nextRule,
    values: [],
  };
}

function updateRuleOperator(
  rule: CollectionRuleCondition,
  operator: string | string[],
): CollectionRuleCondition {
  return {
    ...rule,
    operator: Array.isArray(operator)
      ? (operator[0] ?? rule.operator)
      : operator,
  };
}

function updateRuleValues(
  rule: CollectionRuleCondition,
  value: string | string[],
): CollectionRuleCondition {
  return {
    ...rule,
    values: Array.isArray(value) ? value : [value],
  };
}

export function getCollectionRuleInputButtons(
  rule: CollectionRuleCondition,
  conditionTypes: readonly CollectionConditionType[] = collectionConditionTypes,
): CollectionRuleInputButton[] {
  const conditionType = getConditionType(rule.field, conditionTypes);
  const operatorOptions = optionsFromValues(
    conditionType?.operators ?? [rule.operator],
  );
  const valueOptions = getValueOptions(conditionType);
  const buttons: CollectionRuleInputButton[] = [
    {
      type: 'picker',
      label: 'Field',
      value: getConditionLabel(rule.field, conditionTypes),
      ariaLabel: 'Change condition field',
      options: conditionTypes.map((type) => ({
        value: type.value,
        label: type.label,
      })),
      onValueChange: (value) => {
        const nextField = Array.isArray(value) ? value[0] : value;
        const nextConditionType = getConditionType(nextField, conditionTypes);

        return nextConditionType
          ? createRuleForConditionType({
              conditionType: nextConditionType,
              id: rule.id,
            })
          : { ...rule, field: nextField };
      },
    },
  ];

  if (operatorOptions.length === 1 && operatorOptions[0]?.value === 'is') {
    buttons.push({ type: 'static', value: 'is' });
  } else {
    buttons.push({
      type: 'picker',
      label: 'Operator',
      value: getOperator(rule),
      ariaLabel: 'Change condition operator',
      options: operatorOptions,
      onValueChange: (value) => updateRuleOperator(rule, value),
    });
  }

  if (!conditionType || conditionType.input === 'picker') {
    buttons.push({
      type: 'picker',
      label: conditionType ? `${conditionType.label} values` : 'Collection values',
      value: getValueLabel({ conditionType, rule }),
      ariaLabel: 'Change condition values',
      selectionMode:
        conditionType?.selectionMode ??
        (conditionType?.supportsAndOrWithinValues ? 'multiple' : 'single'),
      options: valueOptions,
      placeholder: 'Select value',
      onValueChange: (value) => updateRuleValues(rule, value),
    });
    return buttons;
  }

  buttons.push({
    type: 'text',
    label: 'Value',
    prefix: hasCurrencyPrefix(conditionType) ? '$' : undefined,
    value: String(rule.value ?? ''),
    onValueChange: (value) => ({ ...rule, value }),
  });

  if (conditionType.units) {
    buttons.push({
      type: 'picker',
      label: 'Unit',
      value: rule.unit ?? conditionType.units[0] ?? '',
      ariaLabel: 'Change condition unit',
      options: optionsFromValues(conditionType.units),
      onValueChange: (value) => ({
        ...rule,
        unit: Array.isArray(value) ? value[0] : value,
      }),
    });
  }

  return buttons;
}
