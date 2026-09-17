import { clsx } from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { ProductVariantOptionSuggestion } from '~/data/products';
import { Button, Combobox, Icon, Popover } from '~/ui';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';
import {
  getOptionGroupId,
  type ProductVariantGroupBy,
  type ProductVariantOptionGroup,
} from './product-variant-options';

type ActiveOptionEditor =
  | { type: 'option-name' }
  | { type: 'option-values'; optionId: string }
  | null;

const variantPickerTransition = {
  duration: motionDurations.base,
  ease: motionEasings.easeOut,
} as const;

const variantPickerHidden = {
  opacity: 0,
  y: 8,
  filter: 'blur(2px)',
} as const;

const variantPickerActive = {
  opacity: 1,
  y: 0,
  filter: 'blur(0px)',
} as const;

const variantPickerExit = {
  opacity: 0,
  y: -8,
  filter: 'blur(2px)',
} as const;

const maxVisibleValueChips = 3;
const maxOptionGroups = 3;
const lightSwatchInsetRing = 'inset 0 0 0 1px rgb(0 0 0 / 0.08)';

export function ProductVariantPicker({
  groupBy,
  groupByOptions,
  hasMultipleVariants,
  options,
  suggestedOptions,
  onGroupByChange,
  onOptionsChange,
}: {
  groupBy: ProductVariantGroupBy;
  groupByOptions: string[];
  hasMultipleVariants: boolean;
  options: ProductVariantOptionGroup[];
  suggestedOptions: ProductVariantOptionSuggestion[];
  onGroupByChange: (value: ProductVariantGroupBy) => void;
  onOptionsChange: (value: ProductVariantOptionGroup[]) => void;
}) {
  const [activeEditor, setActiveEditor] = useState<ActiveOptionEditor>(null);
  const pendingEditorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const showGroupBySelection = hasMultipleVariants && groupByOptions.length > 1;
  const optionNameSuggestions = suggestedOptions.map((option) => option.name);
  const availableOptionNameSuggestions = optionNameSuggestions.filter(
    (suggestion) =>
      !options.some(
        (option) => option.name.toLowerCase() === suggestion.toLowerCase(),
      ),
  );

  useEffect(
    () => () => {
      clearPendingEditorTimeout();
    },
    [],
  );

  function clearPendingEditorTimeout() {
    if (!pendingEditorTimeoutRef.current) return;

    clearTimeout(pendingEditorTimeoutRef.current);
    pendingEditorTimeoutRef.current = null;
  }

  function openOptionValuesEditorAfterPillEnter(optionId: string) {
    clearPendingEditorTimeout();
    setActiveEditor(null);

    pendingEditorTimeoutRef.current = setTimeout(() => {
      pendingEditorTimeoutRef.current = null;
      setActiveEditor({ type: 'option-values', optionId });
    }, motionDurations.base * 1000);
  }

  function addOption(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const existingOption = options.find(
      (option) => option.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (existingOption) {
      openOptionValuesEditorAfterPillEnter(existingOption.id);
      return;
    }

    if (options.length >= maxOptionGroups) return;

    const nextOption = {
      id: getOptionGroupId(trimmedName, options.length),
      name: trimmedName,
      values: [],
    };

    onOptionsChange([...options, nextOption]);
    openOptionValuesEditorAfterPillEnter(nextOption.id);
  }

  function addOptionValue(optionId: string, value: string) {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;

    onOptionsChange(
      options.map((option) => {
        if (option.id !== optionId) return option;

        if (
          option.values.some(
            (optionValue) =>
              optionValue.toLowerCase() === trimmedValue.toLowerCase(),
          )
        ) {
          return option;
        }

        return {
          ...option,
          values: [...option.values, trimmedValue],
        };
      }),
    );
  }

  function setOptionValues(optionId: string, nextValues: string[]) {
    onOptionsChange(
      options.map((option) =>
        option.id === optionId ? { ...option, values: nextValues } : option,
      ),
    );
  }

  function removeOption(optionId: string) {
    const nextOptions = options.filter((option) => option.id !== optionId);
    onOptionsChange(nextOptions);
  }

  function setOptionValuesOpen(
    option: ProductVariantOptionGroup,
    open: boolean,
  ) {
    if (open) {
      clearPendingEditorTimeout();
      setActiveEditor({ type: 'option-values', optionId: option.id });
      return;
    }

    setActiveEditor(null);

    if (option.values.length === 0) {
      removeOption(option.id);
    }
  }

  function setOptionNameOpen(open: boolean) {
    if (open) {
      clearPendingEditorTimeout();
      setActiveEditor({ type: 'option-name' });
      return;
    }

    setActiveEditor((currentEditor) =>
      currentEditor?.type === 'option-name' ? null : currentEditor,
    );
  }

  return (
    <div className="relative flex w-full items-center gap-1 px-3 py-2 pe-3.5">
      <AnimatePresence initial={false} mode="popLayout">
        {options.length === 0 ? (
          <m.div
            key="empty"
            className="flex-1"
            initial={variantPickerHidden}
            animate={variantPickerActive}
            exit={variantPickerExit}
            transition={variantPickerTransition}
          >
            <OptionNameCombobox
              open={activeEditor?.type === 'option-name'}
              onOpenChange={setOptionNameOpen}
              onOptionAdd={addOption}
              suggestions={optionNameSuggestions}
              trigger={() => (
                <Button
                  onClick={() => {}}
                  type="button"
                  variant="plain"
                  prefix={<Icon name="Plus" />}
                >
                  Add options such as size and color
                </Button>
              )}
            />
          </m.div>
        ) : (
          <m.div
            key="options"
            className="flex flex-1 items-center gap-2"
            initial={variantPickerHidden}
            animate={variantPickerActive}
            exit={variantPickerExit}
            transition={variantPickerTransition}
          >
            {options.map((option) => (
              <OptionPill
                key={option.id}
                option={option}
                open={
                  activeEditor?.type === 'option-values' &&
                  activeEditor.optionId === option.id
                }
                onOpenChange={(open) => setOptionValuesOpen(option, open)}
                onRemoveOption={() => removeOption(option.id)}
                onValueAdd={(value) => addOptionValue(option.id, value)}
                onValuesChange={(value) => setOptionValues(option.id, value)}
                suggestedOptions={suggestedOptions}
              />
            ))}
            {options.length < maxOptionGroups ? (
              <m.div
                initial={variantPickerHidden}
                animate={variantPickerActive}
                exit={variantPickerExit}
                transition={variantPickerTransition}
              >
                <OptionNameCombobox
                  open={activeEditor?.type === 'option-name'}
                  onOpenChange={setOptionNameOpen}
                  onOptionAdd={addOption}
                  suggestions={availableOptionNameSuggestions}
                  trigger={() => (
                    <Button
                      onClick={() => {}}
                      type="button"
                      variant="plain"
                      size="icon"
                      aria-label="Add another option"
                    >
                      <Icon name="Plus" />
                    </Button>
                  )}
                />
              </m.div>
            ) : null}
          </m.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showGroupBySelection ? (
          <m.div
            className="flex shrink-0 items-center gap-1"
            initial={variantPickerHidden}
            animate={variantPickerActive}
            exit={variantPickerExit}
            transition={variantPickerTransition}
          >
            <GroupByPicker
              groupBy={groupBy}
              groupByOptions={groupByOptions}
              onGroupByChange={onGroupByChange}
            />
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function OptionNameCombobox({
  onOpenChange,
  onOptionAdd,
  open,
  suggestions,
  trigger,
}: {
  onOpenChange: (open: boolean) => void;
  onOptionAdd: (value: string) => void;
  open: boolean;
  suggestions: string[];
  trigger: () => ReactElement;
}) {
  return (
    <Combobox
      createOptionLabel={(value) => <span>Create "{value}"</span>}
      multipleSelectionLabel={(count) => `${count} selected`}
      onCreateOption={onOptionAdd}
      open={open}
      onOpenChange={onOpenChange}
      onValueChange={(value) => {
        const selectedValue = value?.[0];
        if (selectedValue) onOptionAdd(selectedValue);
      }}
      options={suggestions.map((suggestion) => ({
        value: suggestion,
        label: suggestion,
      }))}
      searchPlaceholder="Search or create an option"
      selectionMode="single"
      trigger={trigger}
      value={[]}
    />
  );
}

function OptionPill({
  onOpenChange,
  onRemoveOption,
  onValueAdd,
  onValuesChange,
  open,
  option,
  suggestedOptions,
}: {
  onOpenChange: (open: boolean) => void;
  onRemoveOption: () => void;
  onValueAdd: (value: string) => void;
  onValuesChange: (value: string[]) => void;
  open: boolean;
  option: ProductVariantOptionGroup;
  suggestedOptions: ProductVariantOptionSuggestion[];
}) {
  const suggestions = getSuggestedOptionValues(suggestedOptions, option.name);

  return (
    <m.div
      className="max-w-full"
      initial={variantPickerHidden}
      animate={variantPickerActive}
      exit={variantPickerExit}
      transition={variantPickerTransition}
    >
      <Combobox
        createOptionLabel={(value) => <span>Create "{value}"</span>}
        footer={{
          icon: 'Trash',
          label: 'Remove option',
          onClick: onRemoveOption,
        }}
        multipleSelectionLabel={(count) => `${count} selected`}
        onCreateOption={onValueAdd}
        open={open}
        onOpenChange={onOpenChange}
        onValueChange={(value) => onValuesChange(value ?? [])}
        options={suggestions.map((suggestion) => ({
          value: suggestion,
          label: suggestion,
        }))}
        searchPlaceholder={`Add ${option.name.toLowerCase()} values`}
        trigger={() => (
          <Button onClick={() => {}} type="button" variant="elevated">
            <OptionPillContent
              option={option}
              suggestedOptions={suggestedOptions}
            />
          </Button>
        )}
        value={option.values}
      />
    </m.div>
  );
}

function OptionPillContent({
  option,
  suggestedOptions,
}: {
  option: ProductVariantOptionGroup;
  suggestedOptions: ProductVariantOptionSuggestion[];
}) {
  const visibleValues = option.values.slice(0, maxVisibleValueChips);
  const hiddenValueCount = Math.max(
    option.values.length - maxVisibleValueChips,
    0,
  );
  const swatch = isColorOption(option.name);
  const displayedValueCount =
    visibleValues.length + (hiddenValueCount > 0 ? 1 : 0);

  return (
    <span className="-mr-1.5 inline-flex items-center gap-0.5 overflow-hidden">
      <span className="shrink-0 pr-1.5 font-medium text-primary">
        {option.name}
      </span>

      {option.values.length > 0 ? (
        <span
          className={clsx(
            'inline-flex items-center gap-1 overflow-hidden',
            swatch && 'pr-0.5',
          )}
        >
          {visibleValues.map((value, index) => (
            <ValueChip
              key={value}
              swatch={swatch}
              optionName={option.name}
              suggestedOptions={suggestedOptions}
              value={value}
              valueCount={displayedValueCount}
              valueIndex={index}
            />
          ))}
          {hiddenValueCount > 0 ? (
            <ValueCountChip
              count={hiddenValueCount}
              swatch={swatch}
              valueCount={displayedValueCount}
              valueIndex={displayedValueCount - 1}
            />
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

function ValueCountChip({
  count,
  swatch = false,
  valueCount,
  valueIndex,
}: {
  count: number;
  swatch?: boolean;
  valueCount: number;
  valueIndex: number;
}) {
  if (swatch) {
    return <span className="px-2 pl-1.5 text-sm font-medium">+{count}</span>;
  }

  return (
    <span
      className={`${getValueChipRadiusClass(
        valueIndex,
        valueCount,
      )} bg-gray-200 px-2 py-0.25 text-sm font-medium`}
    >
      +{count}
    </span>
  );
}

function ValueChip({
  optionName,
  suggestedOptions,
  swatch = false,
  value,
  valueCount,
  valueIndex,
}: {
  optionName: string;
  suggestedOptions: ProductVariantOptionSuggestion[];
  swatch?: boolean;
  value: string;
  valueCount: number;
  valueIndex: number;
}) {
  const swatchColor = swatch
    ? getSuggestedOptionValueColor(suggestedOptions, optionName, value)
    : undefined;

  if (swatchColor) {
    return (
      <span
        aria-hidden
        className="size-4 rounded-full"
        style={{
          backgroundColor: swatchColor,
          boxShadow: getLightSwatchBoxShadow(swatchColor),
        }}
      />
    );
  }

  return (
    <span
      className={`${getValueChipRadiusClass(
        valueIndex,
        valueCount,
      )} shrink truncate overflow-hidden bg-gray-200 px-2 py-0.25 text-sm font-medium`}
    >
      {value}
    </span>
  );
}

function getValueChipRadiusClass(index: number, count: number) {
  if (count <= 1) return 'rounded-full';
  if (index === 0) return 'rounded-l-full rounded-r-[2px]';
  if (index === count - 1) return 'rounded-l-[2px] rounded-r-full';

  return 'rounded-[2px]';
}

function isColorOption(optionName: string) {
  return optionName.toLowerCase() === 'color';
}

function getLightSwatchBoxShadow(color: string) {
  return isLightSwatchColor(color) ? lightSwatchInsetRing : undefined;
}

function isLightSwatchColor(color: string) {
  const hex = color.trim().replace(/^#/, '');
  const normalizedHex =
    hex.length === 3
      ? hex
          .split('')
          .map((character) => character + character)
          .join('')
      : hex;

  if (!/^[\da-f]{6}$/i.test(normalizedHex)) return false;

  const red = Number.parseInt(normalizedHex.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16) / 255;

  const luminance =
    0.2126 * toLinearRgb(red) +
    0.7152 * toLinearRgb(green) +
    0.0722 * toLinearRgb(blue);

  return luminance > 0.72;
}

function toLinearRgb(channel: number) {
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function GroupByPicker({
  groupBy,
  groupByOptions,
  onGroupByChange,
}: {
  groupBy: ProductVariantGroupBy;
  groupByOptions: string[];
  onGroupByChange: (value: ProductVariantGroupBy) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      popupClassName="bg-background rounded-lg p-1 shadow-lg"
      trigger={
        <Button
          onClick={() => {}}
          type="button"
          variant="plain"
          aria-label="Choose variant grouping"
          prefix={<Icon name="ObjsGroup" />}
          suffix={
            <span className="text-muted-foreground">
              <Icon name="ChevronExpandY" size={14} />
            </span>
          }
        >
          {groupBy !== 'none' ? groupBy : null}
        </Button>
      }
    >
      <div className="flex min-w-36 flex-col">
        <GroupByOption
          selected={groupBy === 'none'}
          value="None"
          onClick={() => {
            onGroupByChange('none');
            setOpen(false);
          }}
        />
        {groupByOptions.map((option) => (
          <GroupByOption
            key={option}
            selected={groupBy === option}
            value={option}
            onClick={() => {
              onGroupByChange(option);
              setOpen(false);
            }}
          />
        ))}
      </div>
    </Popover>
  );
}

function GroupByOption({
  onClick,
  selected,
  value,
}: {
  onClick: () => void;
  selected: boolean;
  value: string;
}) {
  return (
    <button
      type="button"
      className="flex h-control items-center gap-2 rounded-sm px-2 text-left text-base hover:bg-gray-100"
      onClick={onClick}
    >
      <span className="flex size-4 items-center text-muted-foreground">
        {selected ? <Icon name="Check" size={14} /> : null}
      </span>
      <span>{value}</span>
    </button>
  );
}

function getSuggestedOptionValues(
  suggestedOptions: ProductVariantOptionSuggestion[],
  optionName: string,
) {
  return (
    getSuggestedVariantOption(suggestedOptions, optionName)?.values.map(
      (value) => value.label,
    ) ?? []
  );
}

function getSuggestedOptionValueColor(
  suggestedOptions: ProductVariantOptionSuggestion[],
  optionName: string,
  optionValue: string,
) {
  return getSuggestedVariantOption(suggestedOptions, optionName)?.values.find(
    (value) => value.label.toLowerCase() === optionValue.toLowerCase(),
  )?.color;
}

function getSuggestedVariantOption(
  suggestedOptions: ProductVariantOptionSuggestion[],
  optionName: string,
) {
  return suggestedOptions.find(
    (option) => option.name.toLowerCase() === optionName.toLowerCase(),
  );
}
