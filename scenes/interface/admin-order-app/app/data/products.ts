import type { IconName, RichTextEditorValue } from '~/ui';
import { catalogs } from './catalogs';
import { productCategories } from './categories';
import { channels } from './channels';
import { tags } from './tags';
export { productCollections } from './collections';

export type ProductCollection = {
  id: string;
  name: string;
};

export type ProductAttributeValue = {
  label: string;
  color?: string;
  tone?: 'default' | 'accent';
};

export type ProductAttribute = {
  name: string;
  values: ProductAttributeValue[];
  visibleValueCount?: number;
};

export type ProductMetafield = ProductAttribute;

export type ProductMetric = {
  title: string;
  metric: number;
  prefix?: string;
  suffix?: string;
  sparkline: {
    data: number[];
    label: number;
    prefix?: string;
    suffix?: string;
    variant?: 'default' | 'positive' | 'negative';
  };
};

export type ProductOpportunity = {
  icon: IconName;
  title: string;
  description: string;
};

export type ProductPurchaseOption = {
  id: string;
  title: string;
};

export type ProductPurchaseOptionGroup = {
  id: string;
  iconName: IconName;
  name: string;
  type: 'Subscriptions' | 'Preorders' | 'Try before you buy';
  options: ProductPurchaseOption[];
};

export type Product = {
  id: string;
  title: string;
  description: RichTextEditorValue;
  images: string[];
  variants: ProductVariant[];
  status: string;
  channelIds: string[];
  catalogIds: string[];
  category: string;
  collectionIds: string[];
  productType: string;
  themeTemplate: string;
  tagIds: string[];
  attributes: ProductAttribute[];
  metafields: ProductMetafield[];
  metrics: ProductMetric[];
  purchaseOptions?: {
    groups: ProductPurchaseOptionGroup[];
    onlySellWithPurchaseOptions: boolean;
  };
};

export type ProductVariant = {
  id: string;
  title: string;
  option: string;
  options: ProductVariantOption[];
  price: string;
  inventory: number;
  sku: string;
  image?: string;
};

export const productOpportunities: ProductOpportunity[] = [
  {
    icon: 'ReplaceObjs',
    title: 'Add variant image mapping',
    description:
      'Map images to the top 3-5 color variants to reduce conversion risk.',
  },
  {
    icon: 'Tag',
    title: 'Add bundle pricing',
    description:
      'Pair this product with related best sellers to lift average order value.',
  },
  {
    icon: 'Megaphone',
    title: 'Promote on Shop',
    description:
      'Feature the product in Shop campaigns while inventory is healthy.',
  },
  {
    icon: 'Eye',
    title: 'Improve product media',
    description:
      'Add a lifestyle image to help shoppers understand fit and scale.',
  },
  {
    icon: 'Hashtag',
    title: 'Add discovery tags',
    description:
      'Use merchandising tags to keep this product eligible for smart collections.',
  },
];

export const productWeightUnitOptions = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
];

export type ProductVariantOption = {
  name: string;
  value: string;
};

export type ProductVariantOptionSuggestion = {
  name: string;
  values: ProductAttributeValue[];
  categories?: string[];
};

type ProductVariantInput = {
  id?: string;
  title?: string;
  option?: string;
  options?: ProductVariantOption[];
  price?: string;
  inventory?: number;
  sku?: string;
  image?: string;
};

export const productTypes = ['Default product', 'Gift card'];

export const productThemeTemplates = [
  'Default product',
  'Featured product',
  'Gift card',
  'Preorder',
];

export const suggestedProductVariantOptions: ProductVariantOptionSuggestion[] =
  [
    {
      name: 'Size',
      categories: ['T-shirts', 'Hoodies', 'Shirts', 'Beanies'],
      values: [
        { label: 'XS' },
        { label: 'S' },
        { label: 'M' },
        { label: 'L' },
        { label: 'XL' },
      ],
    },
    {
      name: 'Color',
      categories: [
        'T-shirts',
        'Hoodies',
        'Sneakers',
        'Shirts',
        'Beanies',
        'Skateboard Decks',
      ],
      values: [
        { label: 'Black', color: '#111111' },
        { label: 'Blue', color: '#2470a0' },
        { label: 'Brown', color: '#4a2f23' },
        { label: 'Camo', color: '#5f8fa6' },
        { label: 'Cream', color: '#d7d9cb' },
        { label: 'Green', color: '#8dcb65' },
        { label: 'Gradient', color: '#4b5b77' },
        { label: 'Ice', color: '#b7d9dc' },
        { label: 'Lichen', color: '#bacf82' },
        { label: 'Lime', color: '#d8ff61' },
        { label: 'Natural', color: '#e8e9dc' },
        { label: 'Navy', color: '#18345a' },
        { label: 'Olive', color: '#6e725b' },
        { label: 'Plum', color: '#3f243f' },
        { label: 'Rose', color: '#f5a5b3' },
        { label: 'Sage', color: '#8fa39a' },
        { label: 'Sand', color: '#d3bd92' },
        { label: 'Teal', color: '#70b8b2' },
        { label: 'White', color: '#f8f8f1' },
      ],
    },
    {
      name: 'Material',
      categories: [
        'T-shirts',
        'Hoodies',
        'Sneakers',
        'Shirts',
        'Beanies',
        'Skateboard Decks',
      ],
      values: [
        { label: 'Cotton' },
        { label: 'Wool' },
        { label: 'Leather' },
        { label: 'Canvas' },
        { label: '7-ply maple' },
      ],
    },
    {
      name: 'Style',
      categories: ['T-shirts', 'Hoodies', 'Sneakers', 'Shirts', 'Beanies'],
      values: [
        { label: 'Classic' },
        { label: 'Cropped' },
        { label: 'Oversized' },
        { label: 'Slim' },
      ],
    },
    {
      name: 'Title',
      values: [{ label: 'Default' }],
    },
    {
      name: 'Artwork',
      categories: ['Skateboard Decks'],
      values: [
        { label: 'Blue' },
        { label: 'Gradient' },
        { label: 'White' },
        { label: 'Floral' },
        { label: 'Type' },
      ],
    },
    {
      name: 'Shoe size',
      categories: ['Sneakers'],
      values: [
        { label: '7' },
        { label: '8' },
        { label: '9' },
        { label: '10' },
        { label: '11' },
        { label: '12' },
      ],
    },
    {
      name: 'Deck width',
      categories: ['Skateboard Decks'],
      values: [
        { label: '8.0 in' },
        { label: '8.125 in' },
        { label: '8.25 in' },
        { label: '8.375 in' },
      ],
    },
  ];

function getSuggestedProductVariantOptions(category: string) {
  return suggestedProductVariantOptions.filter(
    (option) => !option.categories || option.categories.includes(category),
  );
}

const salesChannelIds = channels.map((channel) => channel.id);

const defaultCatalogIds = catalogs.map((catalog) => catalog.id);

const defaultTagIds = tags.map((tag) => tag.id);

function productDescription(text: string): RichTextEditorValue {
  return [
    {
      type: 'paragraph',
      children: [{ text }],
    },
  ];
}

function getFixtureSeed(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1000;
  }

  return hash;
}

function selectFixtureIds(ids: string[], seed: number, count: number) {
  if (ids.length === 0) return [];

  const selectedIds: string[] = [];
  const targetCount = Math.min(count, ids.length);

  for (let offset = 0; selectedIds.length < targetCount; offset += 1) {
    const id = ids[(seed + offset * 2) % ids.length];

    if (!selectedIds.includes(id)) {
      selectedIds.push(id);
    }
  }

  return selectedIds;
}

function parsePrice(value: string) {
  return Number(value.replace(/[^0-9.]/g, '')) || 0;
}

function sparklineData(seed: number, base: number) {
  return Array.from({ length: 5 }, (_, index) =>
    Math.max(4, Math.round(base + ((seed + index * 7) % 18) - 9)),
  );
}

function nonZeroChange(value: number) {
  return value === 0 ? 1 : value;
}

function productMetrics(productId: string, price: string): ProductMetric[] {
  const seed = getFixtureSeed(productId);
  const basePrice = parsePrice(price);
  const sales = Math.round(basePrice * (18 + (seed % 45)));
  const conversion = Number((2.5 + (seed % 36) / 10).toFixed(1));
  const returns = 18 + (seed % 140);

  return [
    {
      title: 'Sales',
      metric: sales,
      sparkline: {
        data: sparklineData(seed, 48),
        label: nonZeroChange((seed % 9) - 4),
        suffix: '%',
      },
    },
    {
      title: 'Conversion',
      metric: conversion,
      suffix: '%',
      sparkline: {
        data: sparklineData(seed + 13, 24),
        label: 1 + (seed % 7),
        prefix: '+',
        suffix: '%',
        variant: 'positive',
      },
    },
    {
      title: 'Returns',
      metric: returns,
      sparkline: {
        data: sparklineData(seed + 29, 18),
        label: -1 * (1 + (seed % 5)),
        suffix: '%',
        variant: 'positive',
      },
    },
  ];
}

function productVariants({
  productId,
  price,
  images,
  attributes,
  variants,
}: {
  productId: string;
  price: string;
  images: string[];
  attributes: ProductAttribute[];
  variants?: ProductVariantInput[];
}): ProductVariant[] {
  const variantAttribute = getVariantAttribute(attributes);

  if (variants) {
    return variants.map((variant, index) => {
      const title = variant.title ?? getVariantTitle(variantAttribute);
      const options = variant.options ?? [
        { name: title, value: variant.option ?? 'Default' },
      ];

      return {
        id: variant.id ?? `${productId}-${index + 1}`,
        title,
        option: variant.option ?? getVariantOptionLabel(options),
        options,
        price: variant.price ?? price,
        inventory: variant.inventory ?? 24 + index * 11,
        sku: variant.sku ?? getVariantSku(productId, index),
        image: variant.image,
      };
    });
  }

  return [
    {
      id: `${productId}-default`,
      title: 'Default title',
      option: 'Default',
      options: [{ name: 'Default title', value: 'Default' }],
      price,
      inventory: 24 + (getFixtureSeed(productId) % 48),
      sku: getVariantSku(productId, 0),
      image: images[0],
    },
  ];
}

function getVariantAttribute(attributes: ProductAttribute[]) {
  return (
    attributes.find((attribute) => /size/i.test(attribute.name)) ??
    attributes.find((attribute) => attribute.name === 'Deck width') ??
    attributes.find(
      (attribute) => !['Material', 'Pattern'].includes(attribute.name),
    )
  );
}

function getVariantTitle(attribute: ProductAttribute | undefined) {
  if (!attribute) return 'Option';
  if (/size/i.test(attribute.name)) return 'Size';

  return attribute.name;
}

function getVariantOptionLabel(options: ProductVariantOption[]) {
  return options.map((option) => option.value).join(' / ');
}

function getVariantSku(productId: string, index: number) {
  const hash = getFixtureSeed(productId) * 7919;

  return String(1000 + ((hash + index * 7919) % 9000));
}

function productAttributes(attributes: ProductAttribute[]): ProductAttribute[] {
  return attributes;
}

const apparelSizes: ProductAttribute = {
  name: 'Size',
  values: [
    { label: 'XS' },
    { label: 'S' },
    { label: 'M' },
    { label: 'L' },
    { label: 'XL' },
  ],
};

const liberteeVariantColors = [
  { label: 'Black', image: '/images/product/mvse-libertee-black.png' },
  { label: 'Green', image: '/images/product/mvse-libertee-green.png' },
  { label: 'Lime', image: '/images/product/mvse-libertee-lime.png' },
  { label: 'Natural', image: '/images/product/mvse-libertee-natural.png' },
  { label: 'Navy', image: '/images/product/mvse-libertee-navy.png' },
  { label: 'Plum', image: '/images/product/mvse-libertee-plum.png' },
  { label: 'Rose', image: '/images/product/mvse-libertee-rose.png' },
  { label: 'Sage', image: '/images/product/mvse-libertee-sage.png' },
  {
    label: 'White',
    image: '/images/product/mvse-libertee-transparent-white.png',
  },
];

function liberteeVariants(): ProductVariantInput[] {
  return liberteeVariantColors.flatMap((color, colorIndex) =>
    apparelSizes.values.map((size, sizeIndex) => ({
      title: 'Options',
      options: [
        { name: 'Color', value: color.label },
        { name: 'Size', value: size.label },
      ],
      inventory: 12 + ((colorIndex * 31 + sizeIndex * 17 + 133) % 151),
      image: color.image,
    })),
  );
}

const standardMetafields: ProductMetafield[] = [
  {
    name: 'Care & maintenance',
    values: [{ label: 'Care instructions' }, { label: 'Wash temperature' }],
  },
  {
    name: 'Performance features',
    values: [{ label: 'Online exclusive' }, { label: 'Limited run' }],
  },
];

function createProduct({
  catalogIds,
  channelIds,
  id,
  title,
  description,
  images,
  price,
  status = 'active',
  category,
  collectionIds,
  attributes,
  productType,
  tagIds,
  themeTemplate,
  variants,
  purchaseOptions,
}: {
  catalogIds?: string[];
  channelIds?: string[];
  id: string;
  title: string;
  description: string;
  images: string[];
  price: string;
  status?: string;
  category: string;
  collectionIds: string[];
  attributes: ProductAttribute[];
  productType?: string;
  tagIds?: string[];
  themeTemplate?: string;
  variants?: ProductVariantInput[];
  purchaseOptions?: Product['purchaseOptions'];
}): Product {
  const seed = getFixtureSeed(id);

  return {
    id,
    title,
    description: productDescription(description),
    images,
    variants: productVariants({
      productId: id,
      price,
      images,
      attributes,
      variants,
    }),
    status,
    channelIds:
      channelIds ?? selectFixtureIds(salesChannelIds, seed, 2 + (seed % 3)),
    catalogIds:
      catalogIds ?? selectFixtureIds(defaultCatalogIds, seed, 1 + (seed % 3)),
    category,
    collectionIds,
    productType: productType ?? productTypes[seed % productTypes.length],
    themeTemplate:
      themeTemplate ??
      productThemeTemplates[seed % productThemeTemplates.length],
    tagIds: tagIds ?? selectFixtureIds(defaultTagIds, seed, 1 + (seed % 3)),
    attributes,
    metafields: standardMetafields,
    metrics: productMetrics(id, price),
    purchaseOptions,
  };
}

const products: Product[] = [
  createProduct({
    id: 'mvse-libertee',
    title: 'MVSE Libertee',
    description:
      'An oversized boxy tee cut from heavyweight cotton with a soft, broken-in handfeel from the first wear. The cropped skate silhouette sits cleanly over wider pants, while the vintage MVSE graphic gives the piece the look of a well-loved shop find. Built for daily rotation, late sessions, and easy layering under overshirts or hoodies.',
    images: [
      '/images/product/mvse-libertee-1.jpg',
      '/images/product/mvse-libertee-2.jpg',
      '/images/product/mvse-libertee-3.jpg',
      '/images/product/mvse-libertee-black.png',
      '/images/product/mvse-libertee-green.png',
      '/images/product/mvse-libertee-lime.png',
      '/images/product/mvse-libertee-natural.png',
      '/images/product/mvse-libertee-navy.png',
      '/images/product/mvse-libertee-plum.png',
      '/images/product/mvse-libertee-rose.png',
      '/images/product/mvse-libertee-sage.png',
    ],
    price: '$48',
    category: productCategories[0],
    collectionIds: ['shirts'],
    purchaseOptions: {
      groups: [
        {
          id: 'fit-check-trial',
          iconName: 'CircleHalfDottedClock',
          name: 'Fit check trial',
          type: 'Try before you buy',
          options: [
            {
              id: 'trial-window',
              title: 'Try up to 3 sizes for 14 days before payment',
            },
            {
              id: 'authorization',
              title: 'Authorize now, capture payment only after the trial',
            },
          ],
        },
      ],
      onlySellWithPurchaseOptions: false,
    },
    attributes: productAttributes([
      apparelSizes,
      {
        name: 'Color',
        visibleValueCount: 4,
        values: [
          { label: 'Lime', color: '#d8ff61' },
          { label: 'Rose', color: '#f5a5b3' },
          { label: 'Navy', color: '#18345a' },
          { label: 'Sage', color: '#8fa39a' },
          { label: 'Natural', color: '#e8e9dc' },
          { label: 'Green', color: '#8dcb65' },
          { label: 'Black', color: '#111111' },
          { label: 'Plum', color: '#3f243f' },
          { label: 'White', color: '#f8f8f1' },
        ],
      },
      { name: 'Material', values: [{ label: 'Cotton', tone: 'accent' }] },
    ]),
    variants: liberteeVariants(),
  }),
  createProduct({
    id: 'heartside-hoodie',
    title: 'Heartside Hoodie',
    description:
      'A soft fleece hoodie with relaxed proportions, dropped shoulders, and MVSE artwork that feels graphic without overpowering the rest of the fit. The midweight body adds warmth without bulk, making it easy to layer under jackets or wear on its own through shifting weather. Each colorway is chosen to pair naturally with denim, canvas, and washed cotton basics.',
    images: [
      '/images/product/heartside-hoodie-sage.png',
      '/images/product/heartside-hoodie-gradient.png',
      '/images/product/heartside-hoodie-camo.png',
    ],
    price: '$86',
    category: productCategories[1],
    collectionIds: ['hoodies', 'sweatshirts'],
    attributes: productAttributes([
      apparelSizes,
      {
        name: 'Color',
        values: [
          { label: 'Sage', color: '#b7b7a5' },
          { label: 'Gradient', color: '#4b5b77' },
          { label: 'Camo', color: '#5f8fa6' },
        ],
      },
    ]),
    variants: [
      {
        title: 'Color',
        option: 'Sage',
        inventory: 28,
        image: '/images/product/heartside-hoodie-sage.png',
      },
      {
        title: 'Color',
        option: 'Gradient',
        inventory: 16,
        image: '/images/product/heartside-hoodie-gradient.png',
      },
      {
        title: 'Color',
        option: 'Camo',
        inventory: 21,
        image: '/images/product/heartside-hoodie-camo.png',
      },
    ],
  }),
  createProduct({
    id: 'flora-sneakers',
    title: 'Flora Sneakers',
    description:
      'Low-profile canvas sneakers finished with suede overlays, gum soles, and muted garden-inspired palettes. The shape is simple enough for everyday wear, but the mixed materials give the shoe a more considered, textured feel up close. A lightly cushioned footbed and flexible sole make them comfortable for long walks, market days, and casual shop-floor wear.',
    images: [
      '/images/product/flora-sneakers-teal.png',
      '/images/product/flora-sneakers-olive.png',
      '/images/product/flora-sneakers-sand.png',
    ],
    price: '$74',
    status: 'draft',
    category: productCategories[2],
    collectionIds: ['sneakers'],
    purchaseOptions: {
      groups: [
        {
          id: 'home-fit-trial',
          iconName: 'CircleHalfDottedClock',
          name: 'Home fit trial',
          type: 'Try before you buy',
          options: [
            {
              id: 'trial-pairs',
              title: 'Try two sizes at home for 10 days',
            },
            {
              id: 'pay-after-fit',
              title: 'Pay only for the pair you keep',
            },
          ],
        },
      ],
      onlySellWithPurchaseOptions: false,
    },
    attributes: productAttributes([
      {
        name: 'Shoe size',
        values: [
          { label: '7' },
          { label: '8' },
          { label: '9' },
          { label: '10' },
          { label: '11' },
        ],
      },
      {
        name: 'Color',
        values: [
          { label: 'Teal', color: '#70b8b2' },
          { label: 'Olive', color: '#6e725b' },
          { label: 'Sand', color: '#d3bd92' },
        ],
      },
    ]),
    variants: [
      {
        option: '7',
        inventory: 13,
        image: '/images/product/flora-sneakers-teal.png',
      },
      {
        option: '8',
        inventory: 19,
        image: '/images/product/flora-sneakers-teal.png',
      },
      {
        option: '9',
        inventory: 24,
        image: '/images/product/flora-sneakers-olive.png',
      },
      {
        option: '10',
        inventory: 18,
        image: '/images/product/flora-sneakers-olive.png',
      },
      {
        option: '11',
        inventory: 11,
        image: '/images/product/flora-sneakers-sand.png',
      },
    ],
  }),
  createProduct({
    id: 'fioranti-button-down',
    title: 'Fioranti Button Down',
    description:
      'A color-blocked button down with oversized utility pockets, a slightly boxy cut, and enough structure to work as either a shirt or light overshirt. The panels are balanced for a subtle statement rather than a loud patchwork effect, so it layers easily over tees and under outerwear. Wear it open for a relaxed shop look or buttoned for a cleaner weekday uniform.',
    images: [
      '/images/product/fioranti-button-down-brown.png',
      '/images/product/fioranti-button-down-blue.png',
      '/images/product/fioranti-button-down-navy.png',
    ],
    price: '$68',
    category: productCategories[3],
    collectionIds: ['overshirts', 'shirts'],
    attributes: productAttributes([
      apparelSizes,
      {
        name: 'Color',
        values: [
          { label: 'Brown', color: '#4a2f23' },
          { label: 'Blue', color: '#2470a0' },
          { label: 'Navy', color: '#202738' },
        ],
      },
    ]),
  }),
  createProduct({
    id: 'mvse-vergier-beanie',
    title: 'MVSE Vergier Beanie',
    description:
      'A patterned cold-weather beanie with a dense garden print that adds color and texture without losing its everyday utility. The knit holds a close, comfortable shape around the head, while the compact MVSE label keeps the front clean. Designed for colder mornings, late-night rides, and finishing simple outerwear with a more expressive detail.',
    images: ['/images/product/mvse-vergier-beanie.png'],
    price: '$32',
    category: productCategories[4],
    collectionIds: ['beanies'],
    attributes: productAttributes([
      {
        name: 'Size',
        values: [{ label: 'One size' }],
      },
      {
        name: 'Pattern',
        values: [{ label: 'Vergier floral', tone: 'accent' }],
      },
    ]),
  }),
  createProduct({
    id: 'mvse-knit-beanie',
    title: 'MVSE Knit Beanie',
    description:
      'A ribbed knit beanie with a cuffed fit, soft stretch, and a small woven MVSE front label. The shape is snug without feeling tight, holding its form through repeated wear while staying easy to pack in a tote or jacket pocket. Offered in grounded neutrals and seasonal colors, it is the kind of accessory that quietly works with nearly everything.',
    images: [
      '/images/product/mvse-knit-beanie-cream.png',
      '/images/product/mvse-knit-beanie-lichen.png',
      '/images/product/mvse-knit-beanie-ice.png',
      '/images/product/mvse-knit-beanie-black.png',
      '/images/product/mvse-knit-beanie-plum.png',
      '/images/product/mvse-knit-beanie-blue.png',
    ],
    price: '$28',
    category: productCategories[4],
    collectionIds: ['beanies'],
    attributes: productAttributes([
      {
        name: 'Size',
        values: [{ label: 'One size' }],
      },
      {
        name: 'Color',
        visibleValueCount: 4,
        values: [
          { label: 'Cream', color: '#d7d9cb' },
          { label: 'Lichen', color: '#bacf82' },
          { label: 'Ice', color: '#b7d9dc' },
          { label: 'Black', color: '#151515' },
          { label: 'Plum', color: '#6f4268' },
          { label: 'Blue', color: '#31587f' },
        ],
      },
    ]),
    variants: [
      {
        title: 'Color',
        option: 'Cream',
        inventory: 41,
        image: '/images/product/mvse-knit-beanie-cream.png',
      },
      {
        title: 'Color',
        option: 'Lichen',
        inventory: 35,
        image: '/images/product/mvse-knit-beanie-lichen.png',
      },
      {
        title: 'Color',
        option: 'Ice',
        inventory: 29,
        image: '/images/product/mvse-knit-beanie-ice.png',
      },
      {
        title: 'Color',
        option: 'Black',
        inventory: 48,
        image: '/images/product/mvse-knit-beanie-black.png',
      },
      {
        title: 'Color',
        option: 'Plum',
        inventory: 22,
        image: '/images/product/mvse-knit-beanie-plum.png',
      },
      {
        title: 'Color',
        option: 'Blue',
        inventory: 26,
        image: '/images/product/mvse-knit-beanie-blue.png',
      },
    ],
  }),
  createProduct({
    id: 'buonaglitci-skateboard-deck',
    title: 'Buonaglitci Skateboard Deck',
    description:
      'A graphic maple skateboard deck built around statue artwork, bold framing, and bright gallery-poster colorways. The 7-ply construction gives the board reliable pop and a familiar street feel, while the artwork keeps the underside visually sharp when it is on the wall or in motion. A strong option for riders who want a collectible graphic without giving up daily skate utility.',
    images: [
      '/images/product/buonaglitci-skateboard-deck-green.png',
      '/images/product/buonaglitci-skateboard-deck-red.png',
      '/images/product/buonaglitci-skateboard-deck-white.png',
    ],
    price: '$64',
    status: 'draft',
    category: productCategories[5],
    collectionIds: ['skateboards'],
    attributes: productAttributes([
      { name: 'Deck width', values: [{ label: '8.25 in' }] },
      { name: 'Material', values: [{ label: '7-ply maple', tone: 'accent' }] },
    ]),
  }),
  createProduct({
    id: 'bosquet-skateboard-deck',
    title: 'Bosquet Skateboard Deck',
    description:
      'A typographic deck with bold vertical artwork set against a natural wood base. The restrained palette lets the letterforms and grain do most of the work, giving the board a clean studio-made quality. Pressed from 7-ply maple, it is ready for regular sessions while still feeling refined enough for customers who collect deck graphics as design objects.',
    images: [
      '/images/product/bosquet-skateboard-deck-white.png',
      '/images/product/bosquet-skateboard-deck-wood.png',
    ],
    price: '$62',
    status: 'draft',
    category: productCategories[5],
    collectionIds: ['skateboards'],
    attributes: productAttributes([
      { name: 'Deck width', values: [{ label: '8.0 in' }] },
      { name: 'Material', values: [{ label: '7-ply maple', tone: 'accent' }] },
    ]),
  }),
  createProduct({
    id: 'bosquet-inverse-skateboard-deck',
    title: 'Bosquet Inverse Skateboard Deck',
    description:
      'An inverse take on the Bosquet deck with repeating collage artwork and a denser visual rhythm. The graphic reads quickly from a distance, then reveals more texture and layered detail up close. It shares the same dependable 7-ply maple construction as the original, making it a natural companion piece for riders who like matched series and contrasting display walls.',
    images: [
      '/images/product/bosquet-inverse-skateboard-deck-collage.png',
      '/images/product/bosquet-inverse-skateboard-deck-type.png',
    ],
    price: '$62',
    status: 'draft',
    category: productCategories[5],
    collectionIds: ['skateboards'],
    attributes: productAttributes([
      { name: 'Deck width', values: [{ label: '8.0 in' }] },
      { name: 'Material', values: [{ label: '7-ply maple', tone: 'accent' }] },
    ]),
  }),
  createProduct({
    id: 'marcella-skateboard-deck',
    title: 'Marcella Skateboard Deck',
    description:
      'A purple graphic deck with striped monochrome artwork, crisp contrast, and a tail treatment that keeps the composition energetic. The shape works well for technical street skating and all-around park use, with a width that feels stable without becoming sluggish. It brings an art-print sensibility to a board that is still meant to be set up and ridden.',
    images: ['/images/product/marcella-skateboard-deck.png'],
    price: '$60',
    category: productCategories[5],
    collectionIds: ['skateboards'],
    attributes: productAttributes([
      { name: 'Deck width', values: [{ label: '8.125 in' }] },
      { name: 'Material', values: [{ label: '7-ply maple', tone: 'accent' }] },
    ]),
  }),
  createProduct({
    id: 'riflessione-skateboard-deck',
    title: 'Riflessione Skateboard Deck',
    description:
      'A reflective, dark-toned deck series built around abstract light, shadow, and landscape graphics. The artwork has a cinematic quality, moving between night-sky texture and quiet horizon lines depending on the selected variant. Pressed in 7-ply maple with a familiar concave, it is designed for customers who want a limited-feeling deck with real rideability.',
    images: [
      '/images/product/riflessione-skateboard-deck-galaxy.png',
      '/images/product/riflessione-skateboard-deck-black.png',
    ],
    price: '$64',
    category: productCategories[5],
    collectionIds: ['skateboards'],
    purchaseOptions: {
      groups: [
        {
          id: 'limited-deck-drop',
          iconName: 'CartShopping',
          name: 'Limited deck drop',
          type: 'Preorders',
          options: [
            {
              id: 'ships-later',
              title: 'Reserve from the next press run, ships July 12',
            },
            {
              id: 'checkout-charge',
              title: 'Collect 50% at checkout, balance before fulfillment',
            },
          ],
        },
      ],
      onlySellWithPurchaseOptions: true,
    },
    attributes: productAttributes([
      { name: 'Deck width', values: [{ label: '8.25 in' }] },
      { name: 'Material', values: [{ label: '7-ply maple', tone: 'accent' }] },
    ]),
  }),
  createProduct({
    id: 'parterre-skateboard-deck',
    title: 'Parterre Skateboard Deck',
    description:
      'A floral deck with layered botanical artwork, rich color, and a gallery-print finish that stands apart from traditional skate graphics. The wide 8.375 inch shape gives riders a little more platform for cruising, transition, and confident landings. It is expressive on the wall, but the maple construction and durable finish keep it ready for full setup duty.',
    images: ['/images/product/parterre-skateboard-deck.png'],
    price: '$64',
    category: productCategories[5],
    collectionIds: ['skateboards'],
    attributes: productAttributes([
      { name: 'Deck width', values: [{ label: '8.375 in' }] },
      { name: 'Material', values: [{ label: '7-ply maple', tone: 'accent' }] },
    ]),
  }),
  createProduct({
    id: 'repose-skateboard-deck',
    title: 'Repose Skateboard Deck',
    description:
      'A quiet white-base deck with horizon graphics, soft architectural lines, and a calm resort-poster palette. The design brings a slower, more contemplative mood to the skate wall while keeping the shape practical for everyday riding. Its 8.125 inch width makes it approachable for street tricks, campus cruising, and riders who prefer a balanced, responsive setup.',
    images: [
      '/images/product/repose-skateboard-deck-sunset.png',
      '/images/product/repose-skateboard-deck-window.png',
    ],
    price: '$60',
    category: productCategories[5],
    collectionIds: ['skateboards'],
    attributes: productAttributes([
      { name: 'Deck width', values: [{ label: '8.125 in' }] },
      { name: 'Material', values: [{ label: '7-ply maple', tone: 'accent' }] },
    ]),
  }),
  createProduct({
    id: 'piscine-skateboard-deck',
    title: 'Piscine Skateboard Deck',
    description:
      'A pool-inspired deck series with blue gradients, water textures, and bright graphic treatments that feel made for summer sessions. Each artwork option has its own energy, from clean aquatic tones to higher-contrast poster color. The 8.25 inch maple shape offers a dependable middle ground for street, park, and transition riders who want one board to cover a lot of ground.',
    images: [
      '/images/product/piscine-skateboard-deck-blue.png',
      '/images/product/piscine-skateboard-deck-gradient.png',
      '/images/product/piscine-skateboard-deck-white.png',
    ],
    price: '$64',
    category: productCategories[5],
    collectionIds: ['skateboards'],
    attributes: productAttributes([
      { name: 'Deck width', values: [{ label: '8.25 in' }] },
      { name: 'Material', values: [{ label: '7-ply maple', tone: 'accent' }] },
    ]),
    variants: [
      {
        title: 'Artwork',
        option: 'Blue',
        inventory: 17,
        image: '/images/product/piscine-skateboard-deck-blue.png',
      },
      {
        title: 'Artwork',
        option: 'Gradient',
        inventory: 12,
        image: '/images/product/piscine-skateboard-deck-gradient.png',
      },
      {
        title: 'Artwork',
        option: 'White',
        inventory: 15,
        image: '/images/product/piscine-skateboard-deck-white.png',
      },
    ],
  }),
  createProduct({
    id: 'clandestino-skateboard-deck',
    title: 'Clandestino Skateboard Deck',
    description:
      'A black-base deck with vivid hidden-garden artwork, deep contrast, and a bold MVSE mark running through the composition. The darker ground makes the color feel more saturated, giving the deck a strong presence in product grids and shop displays. Its wider 8.375 inch profile adds stability for transition lines, cruising, and riders who like a more planted feel underfoot.',
    images: ['/images/product/clandestino-skateboard-deck.png'],
    price: '$64',
    category: productCategories[5],
    collectionIds: ['skateboards'],
    attributes: productAttributes([
      { name: 'Deck width', values: [{ label: '8.375 in' }] },
      { name: 'Material', values: [{ label: '7-ply maple', tone: 'accent' }] },
    ]),
  }),
];

function getProduct(productId: string) {
  return products.find((product) => product.id === productId) ?? products[0];
}

function useProductsData() {
  return products;
}

export {
  getProduct,
  getSuggestedProductVariantOptions,
  products,
  useProductsData,
};
