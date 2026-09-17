import React from 'react';
import { useParams } from 'react-router';
import { MainContentLayout } from '~/components/main-content-layout';
import { CombinationsSection } from '~/components/discounts/combinations-section';
import { DiscountToolbar } from '~/components/discounts/discount-toolbar';
import { DiscountDetailsSection } from '~/components/discounts/discount-details-section';
import { DiscountsAside } from '~/components/discounts/discounts-aside';
import { UsageSection } from '~/components/discounts/usage-section';
import { channels as channelData } from '~/data/channels';
import { collections as collectionData } from '~/data/collections';
import { discounts as discountData } from '~/data/discounts';
import { tags as tagData } from '~/data/tags';
import { Button, Icon, InputHero, Menu } from '~/ui';

type DiscountFormState = {
  title: string;
  status: string;
  discountMethod: string;
  customerSegments: string[];
  discountValueType: string;
  discountValueAmount: string;
  appliesTo: string[];
  purchaseType: string;
  totalUses: string;
  totalUsesAmount: string;
  minPurchaseType: string;
  minPurchaseAmount: string;
  oncePerCustomer: boolean;
  channels: string[];
  tags: string[];
};

type DiscountFormReducerState = {
  discountId: string;
  values: DiscountFormState;
  baseline: DiscountFormState;
  dirtyFields: Set<DiscountFormField>;
};

type DiscountFormField = keyof DiscountFormState;

type DiscountFormAction =
  | { type: 'setTitle'; value: string }
  | { type: 'setStatus'; value: string }
  | { type: 'setDiscountMethod'; value: string }
  | { type: 'setCustomerSegments'; value: string[] }
  | { type: 'setDiscountValueType'; value: string }
  | { type: 'setDiscountValueAmount'; value: string }
  | { type: 'setAppliesTo'; value: string[] }
  | { type: 'setPurchaseType'; value: string }
  | { type: 'setTotalUses'; value: string }
  | { type: 'setTotalUsesAmount'; value: string }
  | { type: 'setMinPurchaseType'; value: string }
  | { type: 'setMinPurchaseAmount'; value: string }
  | { type: 'setOncePerCustomer'; value: boolean }
  | { type: 'setChannels'; value: string[] }
  | { type: 'setTags'; value: string[] }
  | { type: 'resetResource'; discountId: string; value: DiscountFormState }
  | { type: 'save' }
  | { type: 'reset' };

function discountFormReducer(
  state: DiscountFormReducerState,
  action: DiscountFormAction,
): DiscountFormReducerState {
  switch (action.type) {
    case 'setTitle':
      return setDiscountFormField(state, 'title', action.value);
    case 'setStatus':
      return setDiscountFormField(state, 'status', action.value);
    case 'setDiscountMethod':
      return setDiscountFormField(state, 'discountMethod', action.value);
    case 'setCustomerSegments':
      return setDiscountFormField(state, 'customerSegments', action.value);
    case 'setDiscountValueType':
      return setDiscountFormField(state, 'discountValueType', action.value);
    case 'setDiscountValueAmount':
      return setDiscountFormField(state, 'discountValueAmount', action.value);
    case 'setAppliesTo':
      return setDiscountFormField(state, 'appliesTo', action.value);
    case 'setPurchaseType':
      return setDiscountFormField(state, 'purchaseType', action.value);
    case 'setTotalUses':
      return setDiscountFormField(state, 'totalUses', action.value);
    case 'setTotalUsesAmount':
      return setDiscountFormField(state, 'totalUsesAmount', action.value);
    case 'setMinPurchaseType':
      return setDiscountFormField(state, 'minPurchaseType', action.value);
    case 'setMinPurchaseAmount':
      return setDiscountFormField(state, 'minPurchaseAmount', action.value);
    case 'setOncePerCustomer':
      return setDiscountFormField(state, 'oncePerCustomer', action.value);
    case 'setChannels':
      return setDiscountFormField(state, 'channels', action.value);
    case 'setTags':
      return setDiscountFormField(state, 'tags', action.value);
    case 'resetResource':
      return initDiscountFormReducerState(action.discountId, action.value);
    case 'save':
      return {
        ...state,
        baseline: state.values,
        dirtyFields: new Set<DiscountFormField>(),
      };
    case 'reset':
      return {
        ...state,
        values: state.baseline,
        dirtyFields: new Set<DiscountFormField>(),
      };
  }
}

function initDiscountFormReducerState(
  discountId: string,
  value: DiscountFormState,
): DiscountFormReducerState {
  return {
    discountId,
    values: value,
    baseline: value,
    dirtyFields: new Set<DiscountFormField>(),
  };
}

function setDiscountFormField<K extends DiscountFormField>(
  state: DiscountFormReducerState,
  field: K,
  value: DiscountFormState[K],
): DiscountFormReducerState {
  const values = { ...state.values, [field]: value };
  const dirtyFields = new Set(state.dirtyFields);

  if (isDiscountFormFieldEqual(field, value, state.baseline[field])) {
    dirtyFields.delete(field);
  } else {
    dirtyFields.add(field);
  }

  return { ...state, values, dirtyFields };
}

function isDiscountFormFieldEqual<K extends DiscountFormField>(
  field: K,
  value: DiscountFormState[K],
  baselineValue: DiscountFormState[K],
) {
  switch (field) {
    case 'customerSegments':
    case 'appliesTo':
    case 'channels':
    case 'tags':
      return areStringArraysEqual(value as string[], baselineValue as string[]);
    default:
      return Object.is(value, baselineValue);
  }
}

function initDiscountForm(discountId: string): DiscountFormState {
  const discount = discountData.find((item) => item.id === discountId);
  const collectionImagesById = new Map(
    collectionData.map((collection) => [collection.id, collection.image]),
  );
  const appliesTo =
    discount?.collectionIds.reduce<string[]>((images, collectionId) => {
      const image = collectionImagesById.get(collectionId);
      if (image) images.push(image);
      return images;
    }, []) ?? collectionData.map((collection) => collection.image);

  return {
    title: discountId,
    status: 'active',
    discountMethod: 'Discount code',
    customerSegments: ['top-customers'],
    discountValueType: 'Percentage',
    discountValueAmount: '10',
    appliesTo,
    purchaseType: 'One-time purchase',
    totalUses: 'No limit',
    totalUsesAmount: '',
    minPurchaseType: 'None',
    minPurchaseAmount: '',
    oncePerCustomer: true,
    channels: channelData.map((channel) => channel.id),
    tags: [],
  };
}

function areStringArraysEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function DiscountDetailPageInner() {
  const { discountId = '' } = useParams();
  const initialFormState = React.useMemo(
    () => initDiscountForm(discountId),
    [discountId],
  );
  const [reducerState, dispatch] = React.useReducer(
    discountFormReducer,
    initialFormState,
    (value) => initDiscountFormReducerState(discountId, value),
  );
  const formState =
    reducerState.discountId === discountId
      ? reducerState
      : initDiscountFormReducerState(discountId, initialFormState);

  React.useEffect(() => {
    if (reducerState.discountId === discountId) return;

    dispatch({
      type: 'resetResource',
      discountId,
      value: initialFormState,
    });
  }, [discountId, initialFormState, reducerState.discountId]);

  const {
    values: {
      appliesTo,
      channels,
      customerSegments,
      discountMethod,
      discountValueAmount,
      discountValueType,
      minPurchaseAmount,
      minPurchaseType,
      oncePerCustomer,
      purchaseType,
      title,
      totalUses,
      totalUsesAmount,
      status,
      tags,
    },
  } = formState;
  const hasChanges = formState.dirtyFields.size > 0;
  const handleSave = React.useCallback(() => dispatch({ type: 'save' }), []);
  const handleDiscard = React.useCallback(
    () => dispatch({ type: 'reset' }),
    [],
  );
  const handleChannelsChange = React.useCallback(
    (value: string[]) => dispatch({ type: 'setChannels', value }),
    [],
  );
  const handleStatusChange = React.useCallback(
    (value: string) => dispatch({ type: 'setStatus', value }),
    [],
  );
  const handleTagsChange = React.useCallback(
    (value: string[]) => dispatch({ type: 'setTags', value }),
    [],
  );
  const handleTitleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      dispatch({
        type: 'setTitle',
        value: event.currentTarget.value,
      }),
    [],
  );
  const handleDiscountMethodChange = React.useCallback((value: string) => {
    dispatch({ type: 'setDiscountMethod', value });
  }, []);
  const handleCustomerSegmentsChange = React.useCallback(
    (value: string[]) => dispatch({ type: 'setCustomerSegments', value }),
    [],
  );
  const handleDiscountValueTypeChange = React.useCallback(
    (value: string) => dispatch({ type: 'setDiscountValueType', value }),
    [],
  );
  const handleDiscountValueAmountChange = React.useCallback(
    (value: string) => dispatch({ type: 'setDiscountValueAmount', value }),
    [],
  );
  const handleAppliesToChange = React.useCallback(
    (value: string[]) => dispatch({ type: 'setAppliesTo', value }),
    [],
  );
  const handleOncePerCustomerChange = React.useCallback(
    (value: boolean) => dispatch({ type: 'setOncePerCustomer', value }),
    [],
  );
  const handlePurchaseTypeChange = React.useCallback(
    (value: string) => dispatch({ type: 'setPurchaseType', value }),
    [],
  );
  const handleTotalUsesChange = React.useCallback(
    (value: string) => dispatch({ type: 'setTotalUses', value }),
    [],
  );
  const handleTotalUsesAmountChange = React.useCallback(
    (value: string) => dispatch({ type: 'setTotalUsesAmount', value }),
    [],
  );
  const handleMinPurchaseTypeChange = React.useCallback(
    (value: string) => dispatch({ type: 'setMinPurchaseType', value }),
    [],
  );
  const handleMinPurchaseAmountChange = React.useCallback(
    (value: string) => dispatch({ type: 'setMinPurchaseAmount', value }),
    [],
  );

  return (
    <>
      <DiscountToolbar
        discountId={discountId}
        title={title}
        hasChanges={hasChanges}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
      <MainContentLayout
        aside={
          <DiscountsAside
            channels={channelData}
            status={status}
            tags={tagData}
            selectedChannels={channels}
            selectedTags={tags}
            onChannelsChange={handleChannelsChange}
            onStatusChange={handleStatusChange}
            onTagsChange={handleTagsChange}
          />
        }
      >
        <div className="flex flex-col gap-8">
          <div className="flex gap-4">
            <div data-breadcrumb-title-target className="flex-1">
              <InputHero
                label="Discount name"
                placeholder="Discount name"
                value={title}
                onChange={handleTitleChange}
              />
            </div>
            <Menu
              trigger={
                <Button
                  onClick={() => {}}
                  variant="secondary"
                  suffix={
                    <span className="text-muted-foreground">
                      <Icon name="ChevronExpandY" size={14} />
                    </span>
                  }
                  prefix={
                    <Icon
                      name={
                        discountMethod === 'Discount code'
                          ? 'DiscountCode'
                          : 'DiscountTag'
                      }
                    />
                  }
                >
                  {discountMethod}
                </Button>
              }
              options={[
                {
                  label: 'Discount code',
                  onSelect: () => handleDiscountMethodChange('Discount code'),
                },
                {
                  label: 'Automatic discount',
                  onSelect: () =>
                    handleDiscountMethodChange('Automatic discount'),
                },
              ]}
            />
          </div>
          <DiscountDetailsSection
            collections={collectionData}
            customerSegments={customerSegments}
            discountValueType={discountValueType}
            discountValueAmount={discountValueAmount}
            appliesTo={appliesTo}
            onCustomerSegmentsChange={handleCustomerSegmentsChange}
            onDiscountValueTypeChange={handleDiscountValueTypeChange}
            onDiscountValueAmountChange={handleDiscountValueAmountChange}
            onAppliesToChange={handleAppliesToChange}
          />
          <UsageSection
            oncePerCustomer={oncePerCustomer}
            purchaseType={purchaseType}
            totalUses={totalUses}
            totalUsesAmount={totalUsesAmount}
            minPurchaseType={minPurchaseType}
            minPurchaseAmount={minPurchaseAmount}
            onOncePerCustomerChange={handleOncePerCustomerChange}
            onPurchaseTypeChange={handlePurchaseTypeChange}
            onTotalUsesChange={handleTotalUsesChange}
            onTotalUsesAmountChange={handleTotalUsesAmountChange}
            onMinPurchaseTypeChange={handleMinPurchaseTypeChange}
            onMinPurchaseAmountChange={handleMinPurchaseAmountChange}
          />
          <CombinationsSection />
        </div>
      </MainContentLayout>
    </>
  );
}

export default function DiscountDetailPage() {
  return <DiscountDetailPageInner />;
}
