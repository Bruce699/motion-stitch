import type { ProductVariant } from '~/data/products';

export type ProductVariantGroupBy = string;

export type ProductVariantOptionGroup = {
  id: string;
  name: string;
  values: string[];
};

export function getVariantOptionGroups(variants: ProductVariant[]) {
  if (variants.length <= 1) return [];

  const optionGroups: ProductVariantOptionGroup[] = [];
  const optionGroupsByName = new Map<string, ProductVariantOptionGroup>();
  const optionValuesByName = new Map<string, Set<string>>();

  for (const variant of variants) {
    for (const option of variant.options) {
      let optionGroup = optionGroupsByName.get(option.name);
      let optionValues = optionValuesByName.get(option.name);

      if (!optionGroup || !optionValues) {
        optionGroup = {
          id: getOptionGroupId(option.name, optionGroups.length),
          name: option.name,
          values: [],
        };
        optionValues = new Set();
        optionGroups.push(optionGroup);
        optionGroupsByName.set(option.name, optionGroup);
        optionValuesByName.set(option.name, optionValues);
      }

      if (!optionValues.has(option.value)) {
        optionValues.add(option.value);
        optionGroup.values.push(option.value);
      }
    }
  }

  return optionGroups;
}

export function createProductVariantsFromOptions({
  keyScope,
  options,
  previousVariants,
  fallbackVariant,
}: {
  keyScope: string;
  options: ProductVariantOptionGroup[];
  previousVariants: ProductVariant[];
  fallbackVariant: ProductVariant | undefined;
}) {
  const activeOptions = options.filter(
    (option) => option.name.trim() && option.values.length > 0,
  );

  if (activeOptions.length === 0) return [];

  const previousVariantsBySignature = new Map(
    previousVariants.map((variant) => [
      getVariantOptionSignature(variant),
      variant,
    ]),
  );
  const combinations = getOptionCombinations(activeOptions);

  return combinations.map((combination, index) => {
    const options = combination.map(({ name, value }) => ({ name, value }));
    const option = options.map((item) => item.value).join(' / ');
    const signature = getOptionSignature(options);
    const previousVariant = previousVariantsBySignature.get(signature);

    if (previousVariant) {
      return {
        ...previousVariant,
        option,
        options,
        title: activeOptions.length > 1 ? 'Options' : activeOptions[0].name,
      };
    }

    return {
      id: `${keyScope}-variant-${slugify(signature) || index + 1}`,
      title: activeOptions.length > 1 ? 'Options' : activeOptions[0].name,
      option,
      options,
      price: fallbackVariant?.price ?? '$48',
      inventory: fallbackVariant?.inventory ?? 542,
      sku: getGeneratedSku(keyScope, index),
      image: fallbackVariant?.image,
    };
  });
}

export function getOptionGroupId(name: string, index: number) {
  return `option-${slugify(name) || index + 1}`;
}

function getVariantOptionSignature(variant: ProductVariant) {
  return getOptionSignature(variant.options);
}

function getOptionSignature(options: { name: string; value: string }[]) {
  return options.map((option) => `${option.name}:${option.value}`).join('|');
}

function getOptionCombinations(options: ProductVariantOptionGroup[]) {
  return options.reduce<Array<Array<{ name: string; value: string }>>>(
    (combinations, option) =>
      combinations.flatMap((combination) =>
        option.values.map((value) => [
          ...combination,
          { name: option.name, value },
        ]),
      ),
    [[]],
  );
}

function getGeneratedSku(keyScope: string, index: number) {
  const seed = Array.from(keyScope).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return String(1000 + ((seed * 31 + index * 7919) % 9000));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
