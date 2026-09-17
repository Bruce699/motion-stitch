import type {
  CollectionRuleCondition,
  CollectionRuleMatch,
  CollectionRuleSet,
} from './collections';
import { products, type Product } from './products';

function getProductsForCollectionRuleSets({
  allProducts = products,
  ruleSets,
}: {
  allProducts?: Product[];
  ruleSets: CollectionRuleSet[];
}) {
  const matchedProductsById = new Map<string, Product>();

  for (const ruleSet of ruleSets) {
    const ruleSetProducts = getProductsForRuleSet(ruleSet, allProducts);

    for (const product of ruleSetProducts) {
      matchedProductsById.set(product.id, product);
    }
  }

  return allProducts.filter((product) => matchedProductsById.has(product.id));
}

function getProductsForRuleSet(
  ruleSet: CollectionRuleSet,
  allProducts: Product[],
) {
  const inclusionRules = ruleSet.inclusions.filter(hasConditionField);
  const exclusionRules = ruleSet.exclusions.filter(hasConditionField);
  const manualProductIds = new Set(ruleSet.manualProductIds);
  const matchedProductIds = new Set<string>();

  if (inclusionRules.length > 0) {
    for (const product of allProducts) {
      if (matchesRuleGroup(product, inclusionRules, ruleSet.match, allProducts)) {
        matchedProductIds.add(product.id);
      }
    }
  }

  for (const productId of manualProductIds) {
    matchedProductIds.add(productId);
  }

  for (const product of allProducts) {
    if (!matchedProductIds.has(product.id)) continue;

    if (matchesRuleGroup(product, exclusionRules, getRuleMatch(exclusionRules), allProducts)) {
      matchedProductIds.delete(product.id);
    }
  }

  const positionedIds = ruleSet.positioning.flatMap(
    (positioning) => positioning.productIds,
  );
  const positionedProducts = positionedIds
    .filter((productId) => matchedProductIds.has(productId))
    .map((productId) => allProducts.find((product) => product.id === productId))
    .filter((product): product is Product => Boolean(product));
  const remainingProducts = allProducts.filter(
    (product) =>
      matchedProductIds.has(product.id) &&
      !positionedIds.includes(product.id),
  );
  const products = [...positionedProducts, ...remainingProducts];

  return ruleSet.limit === undefined ? products : products.slice(0, ruleSet.limit);
}

function hasConditionField(rule: CollectionRuleCondition) {
  return Boolean(rule.field);
}

function getRuleMatch(rules: CollectionRuleCondition[]): CollectionRuleMatch {
  return rules.find((rule) => rule.match)?.match ?? 'all';
}

function matchesRuleGroup(
  product: Product,
  rules: CollectionRuleCondition[],
  match: CollectionRuleMatch,
  allProducts: Product[],
) {
  if (rules.length === 0) return false;

  return match === 'all'
    ? rules.every((rule) => matchesRule(product, rule, allProducts))
    : rules.some((rule) => matchesRule(product, rule, allProducts));
}

function matchesRule(
  product: Product,
  rule: CollectionRuleCondition,
  allProducts: Product[],
) {
  if (!rule.field) return false;

  switch (rule.field) {
    case 'barcode':
      return matchesStringList(
        product.variants.map((variant) => variant.sku),
        rule,
      );
    case 'bundle-product':
      return matchesStringValue(getBundleProductValue(product), rule);
    case 'category':
      return matchesStringList([product.category], rule);
    case 'compare-at-price':
    case 'price':
      return matchesNumberValue(getProductPrice(product), rule);
    case 'country-of-origin':
      return false;
    case 'inventory-stock':
      return matchesNumberValue(getProductInventory(product), rule);
    case 'metafield':
      return matchesStringList(getProductMetafieldValues(product), rule);
    case 'product-status':
      return matchesStringList([getProductStatusLabel(product)], rule);
    case 'selling-plan':
      return matchesStringList(getProductSellingPlanValues(product), rule);
    case 'tag':
      return matchesStringList(product.tagIds, rule);
    case 'title':
      return matchesStringValue(product.title, rule);
    case 'type':
      return matchesStringValue(product.productType, rule);
    case 'variant-title':
      return matchesStringList(getProductVariantTitleValues(product), rule);
    case 'vendor':
      return matchesStringValue(getProductVendor(product, allProducts), rule);
    case 'weight':
      return false;
    default:
      return false;
  }
}

function matchesStringValue(value: string, rule: CollectionRuleCondition) {
  return matchesStringList([value], rule);
}

function matchesStringList(values: string[], rule: CollectionRuleCondition) {
  const expectedValues = rule.values ?? [];
  const operator = normalize(rule.operator);
  const normalizedValues = values.map(normalize);
  const normalizedExpectedValues = expectedValues.map(normalize);
  const hasAnyExpectedValue = normalizedExpectedValues.some((expectedValue) =>
    normalizedValues.includes(expectedValue),
  );

  if (operator === 'equals' || operator === 'is') return hasAnyExpectedValue;
  if (operator === 'does not equal' || operator === 'is not') {
    return normalizedExpectedValues.length > 0 && !hasAnyExpectedValue;
  }

  const textValue = normalizedValues.join(' ');
  const expectedValue = normalize(String(rule.value ?? expectedValues[0] ?? ''));

  if (!expectedValue) return false;
  if (operator === 'starts with') return textValue.startsWith(expectedValue);
  if (operator === 'ends with') return textValue.endsWith(expectedValue);
  if (operator === 'contains') return textValue.includes(expectedValue);
  if (operator === 'does not contain') return !textValue.includes(expectedValue);

  return false;
}

function matchesNumberValue(value: number, rule: CollectionRuleCondition) {
  const operator = normalize(rule.operator);
  const expectedValue = Number(rule.value);

  if (operator === 'is empty') return Number.isNaN(value);
  if (operator === 'is not empty') return !Number.isNaN(value);
  if (Number.isNaN(expectedValue)) return false;

  if (operator === 'equals') return value === expectedValue;
  if (operator === 'does not equal') return value !== expectedValue;
  if (operator === 'is greater than') return value > expectedValue;
  if (operator === 'is less than') return value < expectedValue;

  return false;
}

function getBundleProductValue(product: Product) {
  if (!product.purchaseOptions) return 'not sold as bundle';

  return product.purchaseOptions.onlySellWithPurchaseOptions
    ? 'sold as part of bundle'
    : 'sold as bundle';
}

function getProductPrice(product: Product) {
  return Math.min(...product.variants.map((variant) => parseMoney(variant.price)));
}

function getProductInventory(product: Product) {
  return product.variants.reduce((total, variant) => total + variant.inventory, 0);
}

function getProductMetafieldValues(product: Product) {
  return product.metafields.flatMap((metafield) =>
    metafield.values.map((value) => `${metafield.name}: ${value.label}`),
  );
}

function getProductSellingPlanValues(product: Product) {
  return (
    product.purchaseOptions?.groups.flatMap((group) => [
      group.name,
      ...group.options.map((option) => option.title),
    ]) ?? []
  );
}

function getProductStatusLabel(product: Product) {
  return product.status === 'active' ? 'Active' : 'Draft';
}

function getProductVariantTitleValues(product: Product) {
  return product.variants.flatMap((variant) => [
    variant.title,
    variant.option,
    ...variant.options.flatMap((option) => [option.name, option.value]),
  ]);
}

function getProductVendor(product: Product, allProducts: Product[]) {
  const vendors = [
    'MVSE',
    'North Yard Supply',
    'Studio Atlas',
    'Deckworks',
    'Common Goods',
  ];
  const productIndex = Math.max(
    allProducts.findIndex((candidate) => candidate.id === product.id),
    0,
  );

  return vendors[productIndex % vendors.length] ?? vendors[0];
}

function parseMoney(value: string) {
  return Number(value.replace(/[^0-9.]/g, ''));
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export { getProductsForCollectionRuleSets };
