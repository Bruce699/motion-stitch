import { packages } from '~/data/packages';
import type {
  Product,
  ProductAttribute,
  ProductMetafield,
  ProductVariant,
} from '~/data/products';
import type { RichTextEditorValue } from '~/ui';
import type {
  ProductDetailsFormValues,
  ProductVariantDetailsValues,
} from './product-details';
import { getVariantOptionGroups } from './product-variant-options';

export type ProductFormState = {
  title: string;
  description: RichTextEditorValue;
  images: string[];
  status: string;
  channels: string[];
  catalogs: string[];
  category: string;
  collections: string[];
  productType: string;
  themeTemplate: string;
  tags: string[];
  productDetails: ProductDetailsFormValues;
  attributes: ProductAttribute[];
  metafields: ProductMetafield[];
  purchaseOptions: Product['purchaseOptions'];
};

type ProductFormReducerState = {
  productId: string;
  values: ProductFormState;
  baseline: ProductFormState;
  dirtyFields: Set<ProductFormField>;
};

type ProductFormField = keyof ProductFormState;

type ProductFormAction =
  | { type: 'setTitle'; value: string }
  | { type: 'setDescription'; value: RichTextEditorValue }
  | { type: 'setImages'; value: string[] }
  | { type: 'setStatus'; value: string }
  | { type: 'setChannels'; value: string[] }
  | { type: 'setCatalogs'; value: string[] }
  | { type: 'setCategory'; value: string }
  | { type: 'setCollections'; value: string[] }
  | { type: 'setProductType'; value: string }
  | { type: 'setThemeTemplate'; value: string }
  | { type: 'setTags'; value: string[] }
  | { type: 'setProductDetails'; value: ProductDetailsFormValues }
  | { type: 'setAttributes'; value: ProductAttribute[] }
  | { type: 'setMetafields'; value: ProductMetafield[] }
  | { type: 'setOnlySellWithPurchaseOptions'; value: boolean }
  | { type: 'resetResource'; productId: string; value: ProductFormState }
  | { type: 'save' }
  | { type: 'reset' };

function productFormReducer(
  state: ProductFormReducerState,
  action: ProductFormAction,
): ProductFormReducerState {
  switch (action.type) {
    case 'setTitle':
      return setProductFormField(state, 'title', action.value);
    case 'setDescription':
      return setProductFormField(state, 'description', action.value);
    case 'setImages':
      return setProductFormField(state, 'images', action.value);
    case 'setStatus':
      return setProductFormField(state, 'status', action.value);
    case 'setChannels':
      return setProductFormField(state, 'channels', action.value);
    case 'setCatalogs':
      return setProductFormField(state, 'catalogs', action.value);
    case 'setCategory':
      return setProductFormField(state, 'category', action.value);
    case 'setCollections':
      return setProductFormField(state, 'collections', action.value);
    case 'setProductType':
      return setProductFormField(state, 'productType', action.value);
    case 'setThemeTemplate':
      return setProductFormField(state, 'themeTemplate', action.value);
    case 'setTags':
      return setProductFormField(state, 'tags', action.value);
    case 'setProductDetails':
      return setProductFormField(state, 'productDetails', action.value);
    case 'setAttributes':
      return setProductFormField(state, 'attributes', action.value);
    case 'setMetafields':
      return setProductFormField(state, 'metafields', action.value);
    case 'setOnlySellWithPurchaseOptions':
      if (!state.values.purchaseOptions) return state;

      return setProductFormField(state, 'purchaseOptions', {
        ...state.values.purchaseOptions,
        onlySellWithPurchaseOptions: action.value,
      });
    case 'resetResource':
      return initProductFormReducerState(action.productId, action.value);
    case 'save':
      return {
        ...state,
        baseline: state.values,
        dirtyFields: new Set<ProductFormField>(),
      };
    case 'reset':
      return {
        ...state,
        values: state.baseline,
        dirtyFields: new Set<ProductFormField>(),
      };
  }
}

function initProductFormReducerState(
  productId: string,
  value: ProductFormState,
): ProductFormReducerState {
  return {
    productId,
    values: value,
    baseline: value,
    dirtyFields: new Set<ProductFormField>(),
  };
}

function setProductFormField<K extends ProductFormField>(
  state: ProductFormReducerState,
  field: K,
  value: ProductFormState[K],
): ProductFormReducerState {
  const values = { ...state.values, [field]: value };
  const dirtyFields = new Set(state.dirtyFields);

  if (isProductFormFieldEqual(field, value, state.baseline[field])) {
    dirtyFields.delete(field);
  } else {
    dirtyFields.add(field);
  }

  return { ...state, values, dirtyFields };
}

function isProductFormFieldEqual<K extends ProductFormField>(
  field: K,
  value: ProductFormState[K],
  baselineValue: ProductFormState[K],
) {
  switch (field) {
    case 'channels':
    case 'catalogs':
    case 'collections':
    case 'images':
    case 'tags':
      return areStringArraysEqual(value as string[], baselineValue as string[]);
    case 'description':
    case 'attributes':
    case 'metafields':
    case 'purchaseOptions':
      return areJsonEqual(value, baselineValue);
    case 'productDetails':
      return areProductDetailsEqual(
        value as ProductDetailsFormValues,
        baselineValue as ProductDetailsFormValues,
      );
    default:
      return Object.is(value, baselineValue);
  }
}

function initProductForm(product: Product): ProductFormState {
  return {
    title: product.title,
    description: product.description,
    images: product.images,
    status: product.status,
    channels: product.channelIds,
    catalogs: product.catalogIds,
    category: product.category,
    collections: product.collectionIds,
    productType: product.productType,
    themeTemplate: product.themeTemplate,
    tags: product.tagIds,
    productDetails: initProductDetailsForm(product.variants),
    attributes: product.attributes,
    metafields: product.metafields,
    purchaseOptions: product.purchaseOptions,
  };
}

function initProductDetailsForm(
  variants: ProductVariant[],
): ProductDetailsFormValues {
  const options = getVariantOptionGroups(variants);

  return {
    hasMultipleVariants: variants.length > 1,
    options,
    singleVariant: initVariantDetails(variants[0]),
    generatedVariants: variants.length > 1 ? variants : [],
    variants: Object.fromEntries(
      variants.map((variant) => [variant.id, initVariantDetails(variant)]),
    ),
  };
}

function initVariantDetails(
  variant: ProductVariant | undefined,
): ProductVariantDetailsValues {
  return {
    price: getPriceValue(variant?.price ?? '48.00'),
    compareAt: '',
    chargeTax: true,
    unitPrice: '',
    trackInventory: true,
    inventoryQuantity: String(variant?.inventory ?? 542),
    sku: variant?.sku ?? '',
    barcode: '',
    sellWhenOutOfStock: true,
    requiresShipping: true,
    selectedPackage: packages[0].id,
    weight: '1.5',
    weightUnit: 'kg',
    origin: 'US',
    hsCode: '',
  };
}

function getPriceValue(price: string) {
  return price.replace(/^\$/, '');
}

function areStringArraysEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function areJsonEqual(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function areProductDetailsEqual(
  a: ProductDetailsFormValues,
  b: ProductDetailsFormValues,
) {
  return (
    a.hasMultipleVariants === b.hasMultipleVariants &&
    areVariantOptionGroupsEqual(a.options, b.options) &&
    areVariantDetailsEqual(a.singleVariant, b.singleVariant) &&
    areProductVariantsEqual(a.generatedVariants, b.generatedVariants) &&
    areVariantDetailsByIdEqual(a.variants, b.variants)
  );
}

function areVariantOptionGroupsEqual(
  a: ProductDetailsFormValues['options'],
  b: ProductDetailsFormValues['options'],
) {
  return (
    a.length === b.length &&
    a.every(
      (option, index) =>
        option.id === b[index].id &&
        option.name === b[index].name &&
        areStringArraysEqual(option.values, b[index].values),
    )
  );
}

function areProductVariantsEqual(a: ProductVariant[], b: ProductVariant[]) {
  return (
    a.length === b.length &&
    a.every((variant, index) => {
      const otherVariant = b[index];

      return (
        variant.id === otherVariant.id &&
        variant.title === otherVariant.title &&
        variant.option === otherVariant.option &&
        variant.price === otherVariant.price &&
        variant.inventory === otherVariant.inventory &&
        variant.sku === otherVariant.sku &&
        variant.image === otherVariant.image &&
        variant.options.length === otherVariant.options.length &&
        variant.options.every(
          (option, optionIndex) =>
            option.name === otherVariant.options[optionIndex].name &&
            option.value === otherVariant.options[optionIndex].value,
        )
      );
    })
  );
}

function areVariantDetailsByIdEqual(
  a: Record<string, ProductVariantDetailsValues>,
  b: Record<string, ProductVariantDetailsValues>,
) {
  const aKeys = Object.keys(a);

  return (
    aKeys.length === Object.keys(b).length &&
    aKeys.every((key) => {
      const aValue = a[key];
      const bValue = b[key];

      return bValue ? areVariantDetailsEqual(aValue, bValue) : false;
    })
  );
}

function areVariantDetailsEqual(
  a: ProductVariantDetailsValues,
  b: ProductVariantDetailsValues,
) {
  return (
    a.price === b.price &&
    a.compareAt === b.compareAt &&
    a.chargeTax === b.chargeTax &&
    a.unitPrice === b.unitPrice &&
    a.trackInventory === b.trackInventory &&
    a.inventoryQuantity === b.inventoryQuantity &&
    a.sku === b.sku &&
    a.barcode === b.barcode &&
    a.sellWhenOutOfStock === b.sellWhenOutOfStock &&
    a.requiresShipping === b.requiresShipping &&
    a.selectedPackage === b.selectedPackage &&
    a.weight === b.weight &&
    a.weightUnit === b.weightUnit &&
    a.origin === b.origin &&
    a.hsCode === b.hsCode
  );
}

function richTextEditorValueToText(value: RichTextEditorValue) {
  return value
    .map((element) => element.children.map((child) => child.text).join(''))
    .join('\n');
}

export {
  initProductForm,
  initProductFormReducerState,
  productFormReducer,
  richTextEditorValueToText,
};
export type { ProductFormAction, ProductFormReducerState };
