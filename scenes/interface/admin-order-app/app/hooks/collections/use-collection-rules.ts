import type {
  CollectionRuleCondition,
  CollectionRuleMatch,
  CollectionRuleSet,
} from '~/data/collections';
import {
  createRuleForConditionType,
  type CollectionConditionType,
} from '~/data/collection-rulesets';
import { products } from '~/data/products';

type CollectionRuleGroup =
  | {
      id: 'include';
      intent: 'include';
      match: CollectionRuleMatch;
      rules: CollectionRuleCondition[];
      onAddRule: (conditionType: CollectionConditionType) => void;
      onAddManualProducts: () => void;
      onMatchChange: (match: CollectionRuleMatch) => void;
      onRuleChange: (rule: CollectionRuleCondition) => void;
    }
  | {
      id: 'exclude';
      intent: 'exclude';
      match: CollectionRuleMatch;
      rules: CollectionRuleCondition[];
      onMatchChange: (match: CollectionRuleMatch) => void;
      onRuleChange: (rule: CollectionRuleCondition) => void;
    };

function useCollectionRules({
  ruleSets,
  onRuleSetsChange,
}: {
  ruleSets: CollectionRuleSet[];
  onRuleSetsChange: (ruleSets: CollectionRuleSet[]) => void;
}) {
  const visibleRuleSets =
    ruleSets.length > 0 ? ruleSets : [createEmptyRuleSet('products')];

  function updateRuleSet(
    ruleSetId: string,
    updater: (ruleSet: CollectionRuleSet) => CollectionRuleSet,
  ) {
    onRuleSetsChange(
      visibleRuleSets.map((ruleSet) =>
        ruleSet.id === ruleSetId ? updater(ruleSet) : ruleSet,
      ),
    );
  }

  function getRuleSetEditor(ruleSet: CollectionRuleSet) {
    return getCollectionRuleSetEditor({
      ruleSet,
      canRemoveRuleSet: visibleRuleSets.length > 1,
      onChange: (updater) => updateRuleSet(ruleSet.id, updater),
      onRemove: () => removeRuleSet(ruleSet.id),
    });
  }

  function addRuleSet() {
    onRuleSetsChange([
      ...visibleRuleSets,
      createEmptyRuleSet(getNewRuleSetId(visibleRuleSets)),
    ]);
  }

  function removeRuleSet(ruleSetId: string) {
    const nextRuleSets = visibleRuleSets.filter(
      (ruleSet) => ruleSet.id !== ruleSetId,
    );

    onRuleSetsChange(
      nextRuleSets.length > 0 ? nextRuleSets : [createEmptyRuleSet('products')],
    );
  }

  return { addRuleSet, getRuleSetEditor, visibleRuleSets };
}

function getCollectionRuleSetEditor({
  canRemoveRuleSet,
  ruleSet,
  onChange,
  onRemove,
}: {
  canRemoveRuleSet: boolean;
  ruleSet: CollectionRuleSet;
  onChange: (updater: (ruleSet: CollectionRuleSet) => CollectionRuleSet) => void;
  onRemove: () => void;
}) {
  const hasRules =
    ruleSet.inclusions.length > 0 ||
    ruleSet.exclusions.length > 0 ||
    ruleSet.manualProductIds.length > 0 ||
    ruleSet.limit !== undefined ||
    ruleSet.positioning.length > 0;
  const hasConditionRules =
    ruleSet.inclusions.some(hasConditionField) ||
    ruleSet.exclusions.some(hasConditionField);
  const hasEmptyConditionRule =
    ruleSet.inclusions.some(isEmptyConditionRule) ||
    ruleSet.exclusions.some(isEmptyConditionRule);
  const manualProductCount = ruleSet.manualProductIds.length;
  const positionedProductCount = ruleSet.positioning.reduce(
    (count, positioning) => count + positioning.productIds.length,
    0,
  );
  const exclusionMatch = getExclusionMatch(ruleSet);

  function addRule(conditionType: CollectionConditionType) {
    onChange((currentRuleSet) => ({
      ...currentRuleSet,
      inclusions: [
        ...currentRuleSet.inclusions,
        createRuleForConditionType({
          conditionType,
          id: `${currentRuleSet.id}:${conditionType.value}:${
            currentRuleSet.inclusions.length + 1
          }`,
        }),
      ],
    }));
  }

  function addInclusion() {
    onChange((currentRuleSet) => ({
      ...currentRuleSet,
      inclusions: [
        ...currentRuleSet.inclusions,
        createEmptyConditionRule(
          `${currentRuleSet.id}:include:${currentRuleSet.inclusions.length + 1}`,
        ),
      ],
    }));
  }

  function addManualProducts() {
    onChange((currentRuleSet) => ({
      ...currentRuleSet,
      manualProductIds: uniqueStrings([
        ...currentRuleSet.manualProductIds,
        ...products.slice(0, 2).map((product) => product.id),
      ]),
    }));
  }

  function addExclusion() {
    onChange((currentRuleSet) => ({
      ...currentRuleSet,
      exclusions: [
        ...currentRuleSet.exclusions,
        createEmptyConditionRule(
          `${currentRuleSet.id}:exclude:${currentRuleSet.exclusions.length + 1}`,
        ),
      ],
    }));
  }

  function addLimit() {
    onChange((currentRuleSet) => ({
      ...currentRuleSet,
      limit: currentRuleSet.limit ?? 50,
    }));
  }

  function addPositioning() {
    onChange((currentRuleSet) => ({
      ...currentRuleSet,
      positioning:
        currentRuleSet.positioning.length > 0
          ? currentRuleSet.positioning
          : [
              {
                id: `${currentRuleSet.id}:positioning`,
                productIds: products.slice(0, 5).map((product) => product.id),
              },
            ],
    }));
  }

  function removeRuleSetDetails() {
    if (canRemoveRuleSet) {
      onRemove();
      return;
    }

    onChange((currentRuleSet) => ({
      ...currentRuleSet,
      inclusions: [],
      exclusions: [],
      manualProductIds: [],
      limit: undefined,
      positioning: [],
    }));
  }

  function setMatch(match: CollectionRuleMatch) {
    onChange((currentRuleSet) => ({ ...currentRuleSet, match }));
  }

  function updateInclusion(rule: CollectionRuleCondition) {
    onChange((currentRuleSet) => ({
      ...currentRuleSet,
      inclusions: currentRuleSet.inclusions.map((candidate) =>
        candidate.id === rule.id ? rule : candidate,
      ),
    }));
  }

  function setExclusionMatch(match: CollectionRuleMatch) {
    onChange((currentRuleSet) => ({
      ...currentRuleSet,
      exclusions: currentRuleSet.exclusions.map((rule) =>
        rule.field === 'collection' ? { ...rule, match } : rule,
      ),
    }));
  }

  function updateExclusion(rule: CollectionRuleCondition) {
    onChange((currentRuleSet) => ({
      ...currentRuleSet,
      exclusions: currentRuleSet.exclusions.map((candidate) =>
        candidate.id === rule.id ? rule : candidate,
      ),
    }));
  }

  const groups: CollectionRuleGroup[] = [
    {
      id: 'include',
      intent: 'include',
      match: ruleSet.match,
      rules: ruleSet.inclusions,
      onAddRule: addRule,
      onAddManualProducts: addManualProducts,
      onMatchChange: setMatch,
      onRuleChange: updateInclusion,
    },
  ];

  if (ruleSet.exclusions.length > 0) {
    groups.push({
      id: 'exclude',
      intent: 'exclude',
      match: exclusionMatch,
      rules: ruleSet.exclusions,
      onMatchChange: setExclusionMatch,
      onRuleChange: updateExclusion,
    });
  }

  return {
    addInclusion,
    addRule,
    addExclusion,
    addLimit,
    addManualProducts,
    addPositioning,
    exclusionMatch,
    groups,
    hasConditionRules,
    hasEmptyConditionRule,
    hasRules,
    manualProductCount,
    positionedProductCount,
    removeRuleSetDetails,
    setExclusionMatch,
    setMatch,
    updateExclusion,
    updateInclusion,
  };
}

function createEmptyConditionRule(id: string): CollectionRuleCondition {
  return {
    id,
    field: '',
    operator: '',
  };
}

function createEmptyRuleSet(id: string): CollectionRuleSet {
  return {
    id,
    resource: 'products',
    match: 'all',
    inclusions: [],
    exclusions: [],
    manualProductIds: [],
    positioning: [],
  };
}

function getNewRuleSetId(ruleSets: CollectionRuleSet[]) {
  const usedIds = new Set(ruleSets.map((ruleSet) => ruleSet.id));

  for (let index = ruleSets.length + 1; ; index += 1) {
    const id = `products:${index}`;

    if (!usedIds.has(id)) return id;
  }
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function hasConditionField(rule: CollectionRuleCondition) {
  return Boolean(rule.field);
}

function isEmptyConditionRule(rule: CollectionRuleCondition) {
  return !rule.field;
}

function getExclusionMatch(ruleSet: CollectionRuleSet): CollectionRuleMatch {
  const collectionRule = ruleSet.exclusions.find(
    (rule) => rule.field === 'collection',
  );

  return collectionRule?.match ?? 'all';
}

type CollectionRuleSetEditor = ReturnType<typeof getCollectionRuleSetEditor>;

export {
  useCollectionRules,
  type CollectionRuleGroup,
  type CollectionRuleSetEditor,
};
