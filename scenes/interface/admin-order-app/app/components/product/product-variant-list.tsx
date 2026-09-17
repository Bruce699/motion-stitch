import { memo, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { clsx } from 'clsx';
import type { ProductVariant } from '~/data/products';
import { Checkbox, Icon, Image } from '~/ui';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';
import type { ProductVariantGroupBy } from './product-variant-options';

const variantListTransition = {
  duration: motionDurations.base,
  ease: motionEasings.easeOut,
} as const;

const variantListHidden = {
  opacity: 0,
  y: 8,
  filter: 'blur(2px)',
} as const;

const ProductVariantList = memo(function ProductVariantList({
  groupBy,
  onSelectAllVariants,
  onSelectedVariantChange,
  onVariantSelectedChange,
  selectedVariantId,
  selectedVariantIds,
  variants,
}: {
  groupBy: ProductVariantGroupBy;
  onSelectAllVariants: (checked: boolean) => void;
  onSelectedVariantChange: (variantId: string) => void;
  onVariantSelectedChange: (variantId: string, checked: boolean) => void;
  selectedVariantId: string;
  selectedVariantIds: Set<string>;
  variants: ProductVariant[];
}) {
  const selectedVariantCount = selectedVariantIds.size;
  const hasSelectedVariants = selectedVariantCount > 0;
  const allVariantsSelected = selectedVariantCount === variants.length;
  const someVariantsSelected = hasSelectedVariants && !allVariantsSelected;
  const [openGroupIds, setOpenGroupIds] = useState<Set<string>>(
    () => new Set(),
  );
  const variantGroups = useMemo(
    () => (groupBy === 'none' ? [] : groupVariants(variants, groupBy)),
    [groupBy, variants],
  );

  useEffect(() => {
    setOpenGroupIds(new Set());
  }, [groupBy]);

  function toggleGroup(groupId: string) {
    setOpenGroupIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(groupId)) {
        nextIds.delete(groupId);
      } else {
        nextIds.add(groupId);
      }

      return nextIds;
    });
  }

  function setGroupSelected(groupVariants: ProductVariant[], checked: boolean) {
    for (const variant of groupVariants) {
      onVariantSelectedChange(variant.id, checked);
    }
  }

  return (
    <div
      className={clsx(
        'relative h-full w-[260px] rounded-[19px] rounded-r-lg bg-background',
        'before:absolute before:inset-0 before:-z-1 before:rounded-inherit before:shadow-[0_2px_12px_0_rgba(0,0,0,0.02),0_4px_16px_0_rgba(0,0,0,0.02),0_4px_48px_0_rgba(0,0,0,0.02)]',
      )}
    >
      <div className="sticky top-0 z-10 flex shrink-0 items-center gap-3 rounded-inherit bg-linear-to-b from-white from-60% to-transparent p-4 pbe-3">
        <Checkbox.Root
          aria-label="Select all variants"
          aria-checked={someVariantsSelected ? 'mixed' : undefined}
          checked={hasSelectedVariants}
          onCheckedChange={() => onSelectAllVariants(!allVariantsSelected)}
        >
          <Checkbox.Indicator
            variant={someVariantsSelected ? 'indeterminate' : 'check'}
          />
        </Checkbox.Root>
        <span className="text-sm font-medium text-secondary">
          {hasSelectedVariants
            ? `${selectedVariantCount} of ${variants.length} selected`
            : `${variants.length} variants`}
        </span>
      </div>
      <div className="absolute inset-0 flex flex-col gap-1 overflow-y-auto p-2 pt-12">
        <AnimatePresence initial={false} mode="wait">
          {groupBy === 'none' ? (
            <m.div
              key="flat"
              className="flex flex-col gap-1"
              initial={variantListHidden}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={variantListHidden}
              transition={variantListTransition}
            >
              {variants.map((variant) => (
                <ProductVariantListRow
                  key={variant.id}
                  variant={variant}
                  checked={selectedVariantIds.has(variant.id)}
                  selected={selectedVariantId === variant.id}
                  onSelectedVariantChange={onSelectedVariantChange}
                  onVariantSelectedChange={onVariantSelectedChange}
                />
              ))}
            </m.div>
          ) : (
            <m.div
              key={`grouped:${groupBy}`}
              className="flex shrink-0 flex-col"
              initial={variantListHidden}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={variantListHidden}
              transition={variantListTransition}
            >
              {variantGroups.map((group) => {
                const groupSelectedCount = group.variants.filter((variant) =>
                  selectedVariantIds.has(variant.id),
                ).length;
                const groupHasSelected = groupSelectedCount > 0;
                const groupSelected =
                  groupSelectedCount === group.variants.length;
                const groupIndeterminate = groupHasSelected && !groupSelected;
                const groupOpen = openGroupIds.has(group.id);

                return (
                  <div
                    key={group.id}
                    className="flex shrink-0 flex-col gap-0.5 border-t border-border py-0.5 transition-colors first:border-t-0 hover:border-t-transparent hover:[&+div]:border-t-transparent"
                  >
                    <div className="flex min-h-14 shrink-0 items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-gray-50">
                      <Checkbox.Root
                        aria-label={`Select ${group.title} variants`}
                        aria-checked={groupIndeterminate ? 'mixed' : undefined}
                        checked={groupHasSelected}
                        onCheckedChange={() =>
                          setGroupSelected(group.variants, !groupSelected)
                        }
                      >
                        <Checkbox.Indicator
                          variant={
                            groupIndeterminate ? 'indeterminate' : 'check'
                          }
                        />
                      </Checkbox.Root>
                      <button
                        type="button"
                        aria-expanded={groupOpen}
                        onClick={() => toggleGroup(group.id)}
                        className="flex flex-1 items-center gap-3 text-left"
                      >
                        <span className="flex-1">
                          <span className="block truncate font-medium text-primary">
                            {group.title}
                          </span>
                          <span className="block truncate text-sm text-muted-foreground">
                            {group.variants.length}{' '}
                            {group.variants.length === 1
                              ? 'variant'
                              : 'variants'}
                          </span>
                        </span>
                        <span
                          className={clsx(
                            'text-muted-foreground transition-transform ease-out',
                            groupOpen && 'rotate-180',
                          )}
                        >
                          <span className="text-muted-foreground">
                            <Icon
                              name="ChevronDown"
                              size={12}
                              strokeWidth={1.75}
                            />
                          </span>
                        </span>
                      </button>
                    </div>
                    <AnimatePresence initial={false}>
                      {groupOpen ? (
                        <m.div
                          key={`${group.id}:items`}
                          className="flex shrink-0 flex-col gap-1"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={variantListTransition}
                          style={{ overflow: 'hidden' }}
                        >
                          {group.variants.map((variant) => (
                            <ProductVariantListRow
                              key={variant.id}
                              variant={variant}
                              checked={selectedVariantIds.has(variant.id)}
                              selected={selectedVariantId === variant.id}
                              onSelectedVariantChange={onSelectedVariantChange}
                              onVariantSelectedChange={onVariantSelectedChange}
                            />
                          ))}
                        </m.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

const ProductVariantListRow = memo(function ProductVariantListRow({
  checked,
  onSelectedVariantChange,
  onVariantSelectedChange,
  selected,
  variant,
}: {
  checked: boolean;
  onSelectedVariantChange: (variantId: string) => void;
  onVariantSelectedChange: (variantId: string, checked: boolean) => void;
  selected: boolean;
  variant: ProductVariant;
}) {
  return (
    <div
      className={clsx(
        'flex min-h-14 shrink-0 items-center gap-3 rounded-lg p-2 text-left transition-colors',
        selected ? 'bg-gray-100' : 'hover:bg-gray-50',
      )}
    >
      <Checkbox.Root
        aria-label={`Select ${variant.option}`}
        checked={checked}
        onCheckedChange={(checked) =>
          onVariantSelectedChange(variant.id, checked === true)
        }
      >
        <Checkbox.Indicator />
      </Checkbox.Root>
      <button
        type="button"
        onClick={() => onSelectedVariantChange(variant.id)}
        className="flex flex-1 items-center gap-3 text-left"
      >
        <Image
          src={variant.image}
          alt=""
          size={36}
          borderRadius="md"
          shadow="sm"
          className="shrink-0"
          loading="lazy"
          decoding="async"
        />
        <span className="">
          <span className="block truncate font-medium text-primary">
            {variant.option}
          </span>
          <span className="inline-flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <span className="-mr-0.5">{variant.price}</span>
            <span>·</span>
            <span>{variant.inventory} available</span>
          </span>
        </span>
      </button>
    </div>
  );
});

function groupVariants(
  variants: ProductVariant[],
  groupBy: ProductVariantGroupBy,
) {
  const groups = new Map<string, ProductVariant[]>();

  for (const variant of variants) {
    const title = getVariantOptionValue(variant, groupBy);
    if (!title) continue;

    const groupVariants = groups.get(title);

    if (groupVariants) {
      groupVariants.push(variant);
    } else {
      groups.set(title, [variant]);
    }
  }

  return Array.from(groups, ([title, groupVariants]) => ({
    id: `${groupBy}:${title}`,
    title,
    variants: groupVariants,
  }));
}

function getVariantOptionValue(
  variant: ProductVariant,
  groupBy: ProductVariantGroupBy,
) {
  return variant.options.find((option) => option.name === groupBy)?.value;
}

export { ProductVariantList };
