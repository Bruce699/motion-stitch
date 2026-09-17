import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import {
  getSuggestedProductVariantOptions,
  type ProductVariant,
} from '~/data/products';
import { Section } from '~/ui';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';
import {
  ProductVariantDetails,
  type ProductVariantDetailsValues,
} from './product-variant-details';
import { ProductVariantList } from './product-variant-list';
import {
  createProductVariantsFromOptions,
  type ProductVariantGroupBy,
  type ProductVariantOptionGroup,
} from './product-variant-options';
import { ProductVariantPicker } from './product-variant-picker';

export type { ProductVariantDetailsValues } from './product-variant-details';

export type ProductDetailsFormValues = {
  hasMultipleVariants: boolean;
  options: ProductVariantOptionGroup[];
  singleVariant: ProductVariantDetailsValues;
  generatedVariants: ProductVariant[];
  variants: Record<string, ProductVariantDetailsValues>;
};

const variantListPresenceHidden = {
  opacity: 0,
  x: -32,
  scale: 0.95,
  filter: 'blur(2px)',
} as const;

const variantListPresenceVisible = {
  opacity: 1,
  x: 0,
  scale: 1,
  filter: 'blur(0px)',
} as const;

const variantListPresenceTransition = {
  duration: motionDurations.fast,
  ease: motionEasings.easeOut,
} as const;

const ProductDetails = memo(function ProductDetails({
  category,
  keyScope,
  onChange,
  values,
  variants,
}: {
  category: string;
  keyScope: string;
  onChange: (value: ProductDetailsFormValues) => void;
  values: ProductDetailsFormValues;
  variants: ProductVariant[];
}) {
  const { generatedVariants, hasMultipleVariants, options, singleVariant } =
    values;
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const [variantGroupBy, setVariantGroupBy] =
    useState<ProductVariantGroupBy>('none');
  const [selectedVariantId, setSelectedVariantId] = useState(
    generatedVariants[0]?.id ?? '',
  );
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(
    () => new Set(),
  );
  const variantGroupByOptions = useMemo(
    () =>
      options.flatMap((option) =>
        option.values.length > 0 ? [option.name] : [],
      ),
    [options],
  );
  const suggestedOptions = useMemo(
    () => getSuggestedProductVariantOptions(category),
    [category],
  );
  const selectedVariantGroupBy =
    variantGroupByOptions.length > 1 &&
    variantGroupByOptions.includes(variantGroupBy)
      ? variantGroupBy
      : 'none';
  const showVariantList = hasMultipleVariants && generatedVariants.length > 0;
  const selectedVariant = useMemo(
    () =>
      generatedVariants.find((variant) => variant.id === selectedVariantId) ??
      generatedVariants[0],
    [generatedVariants, selectedVariantId],
  );
  const selectedVariantValues = selectedVariant
    ? values.variants[selectedVariant.id]
    : undefined;
  const selectedVariantIdsInGeneratedVariants = useMemo(() => {
    const generatedVariantIds = new Set(
      generatedVariants.map((variant) => variant.id),
    );

    return new Set(
      Array.from(selectedVariantIds).filter((variantId) =>
        generatedVariantIds.has(variantId),
      ),
    );
  }, [generatedVariants, selectedVariantIds]);
  const detailValues = showVariantList ? selectedVariantValues : singleVariant;
  const detailKeyScope =
    showVariantList && selectedVariant
      ? `${keyScope}:variant:${selectedVariant.id}`
      : keyScope;

  const updateOptions = useCallback(
    (nextOptions: ProductVariantOptionGroup[]) => {
      const currentValues = valuesRef.current;
      const currentGeneratedVariants = currentValues.generatedVariants;
      const currentSingleVariant = currentValues.singleVariant;
      const nextGeneratedVariants = createProductVariantsFromOptions({
        keyScope,
        options: nextOptions,
        previousVariants:
          currentGeneratedVariants.length > 0
            ? currentGeneratedVariants
            : variants,
        fallbackVariant: getFallbackVariant(variants[0], currentSingleVariant),
      });

      onChange({
        ...currentValues,
        hasMultipleVariants: nextOptions.length > 0,
        options: nextOptions,
        generatedVariants: nextGeneratedVariants,
        variants:
          nextGeneratedVariants.length > 0
            ? syncVariantDetails(
                currentValues.variants,
                nextGeneratedVariants,
                currentSingleVariant,
              )
            : currentValues.variants,
      });
    },
    [keyScope, onChange, variants],
  );

  const updateSingleVariant = useCallback(
    <K extends keyof ProductVariantDetailsValues>(
      key: K,
      value: ProductVariantDetailsValues[K],
    ) => {
      const currentValues = valuesRef.current;

      onChange({
        ...currentValues,
        singleVariant: {
          ...currentValues.singleVariant,
          [key]: value,
        },
      });
    },
    [onChange],
  );

  const updateVariant = useCallback(
    (variantId: string, nextValues: ProductVariantDetailsValues) => {
      const currentValues = valuesRef.current;

      onChange({
        ...currentValues,
        variants: {
          ...currentValues.variants,
          [variantId]: nextValues,
        },
      });
    },
    [onChange],
  );

  const updateSelectedVariant = useCallback(
    <K extends keyof ProductVariantDetailsValues>(
      key: K,
      value: ProductVariantDetailsValues[K],
    ) => {
      if (!selectedVariant || !selectedVariantValues) return;

      updateVariant(selectedVariant.id, {
        ...selectedVariantValues,
        [key]: value,
      });
    },
    [selectedVariant, selectedVariantValues, updateVariant],
  );

  const setAllVariantsSelected = useCallback(
    (checked: boolean) => {
      setSelectedVariantIds(
        checked
          ? new Set(generatedVariants.map((variant) => variant.id))
          : new Set(),
      );
    },
    [generatedVariants],
  );

  const setVariantSelected = useCallback(
    (variantId: string, checked: boolean) => {
      setSelectedVariantIds((currentIds) => {
        const nextIds = new Set(currentIds);

        if (checked) {
          nextIds.add(variantId);
        } else {
          nextIds.delete(variantId);
        }

        return nextIds;
      });
    },
    [],
  );

  return (
    <Section
      bleed
      noBg
      wrapperContentPosition="top"
      wrapperContent={
        <ProductVariantPicker
          groupBy={selectedVariantGroupBy}
          groupByOptions={variantGroupByOptions}
          hasMultipleVariants={hasMultipleVariants}
          options={options}
          suggestedOptions={suggestedOptions}
          onGroupByChange={setVariantGroupBy}
          onOptionsChange={updateOptions}
        />
      }
    >
      <div
        className={clsx(
          'relative isolate grid items-stretch gap-0.5 p-0.5 pt-0 transition-[grid-template-columns] ease-out',
          showVariantList
            ? 'grid-cols-[260px_minmax(0,1fr)]'
            : 'grid-cols-[0px_minmax(0,1fr)]',
        )}
      >
        <AnimatePresence initial={false}>
          {showVariantList && selectedVariant ? (
            <m.div
              key="product-variant-list"
              className="h-full origin-left will-change-[opacity,transform,filter]"
              initial={variantListPresenceHidden}
              animate={variantListPresenceVisible}
              exit={variantListPresenceHidden}
              transition={variantListPresenceTransition}
            >
              <ProductVariantList
                groupBy={selectedVariantGroupBy}
                variants={generatedVariants}
                selectedVariantId={selectedVariant.id}
                selectedVariantIds={selectedVariantIdsInGeneratedVariants}
                onSelectAllVariants={setAllVariantsSelected}
                onSelectedVariantChange={setSelectedVariantId}
                onVariantSelectedChange={setVariantSelected}
              />
            </m.div>
          ) : null}
        </AnimatePresence>
        {detailValues ? (
          <div className="col-start-2">
            <ProductVariantDetails
              keyScope={detailKeyScope}
              hasVariantList={showVariantList}
              values={detailValues}
              onValueChange={
                showVariantList ? updateSelectedVariant : updateSingleVariant
              }
            />
          </div>
        ) : null}
      </div>
    </Section>
  );
});

function syncVariantDetails(
  currentDetails: Record<string, ProductVariantDetailsValues>,
  nextVariants: ProductVariant[],
  fallbackDetails: ProductVariantDetailsValues,
) {
  return Object.fromEntries(
    nextVariants.map((variant) => [
      variant.id,
      currentDetails[variant.id] ?? {
        ...fallbackDetails,
        inventoryQuantity: String(variant.inventory),
        price: variant.price.replace(/^\$/, ''),
        sku: variant.sku,
      },
    ]),
  );
}

function getFallbackVariant(
  variant: ProductVariant | undefined,
  details: ProductVariantDetailsValues,
) {
  if (!variant) return undefined;

  return {
    ...variant,
    inventory: Number(details.inventoryQuantity) || variant.inventory,
    price: `$${details.price}`,
    sku: details.sku || variant.sku,
  };
}

export { ProductDetails };
