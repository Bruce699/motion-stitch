import type { IconName, RichTextEditorValue } from '~/ui';
import { catalogs } from './catalogs';
import { channels } from './channels';
import { tags } from './tags';
import type { ProductMetafield } from './products';

export type CollectionMetric = {
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

export type CollectionOpportunity = {
  icon: IconName;
  title: string;
  description: string;
};

export type CollectionRuleMatch = 'all' | 'any';

export type CollectionRuleCondition = {
  id: string;
  field: string;
  operator: string;
  match?: CollectionRuleMatch;
  value?: string | number;
  values?: string[];
  unit?: string;
};

export type CollectionPositioningRule = {
  id: string;
  productIds: string[];
};

export type CollectionRuleSet = {
  id: string;
  resource: 'products';
  match: CollectionRuleMatch;
  inclusions: CollectionRuleCondition[];
  exclusions: CollectionRuleCondition[];
  manualProductIds: string[];
  limit?: number;
  positioning: CollectionPositioningRule[];
};

export type Collection = {
  id: string;
  title: string;
  description: RichTextEditorValue;
  status: string;
  channelIds: string[];
  catalogIds: string[];
  themeTemplate: string;
  tagIds: string[];
  metafields: ProductMetafield[];
  metrics: CollectionMetric[];
  productCount: number;
  productIds: string[];
  ruleSets: CollectionRuleSet[];
  image: string;
};

export const collectionThemeTemplates = [
  'Default collection',
  'Featured collection',
  'Lookbook collection',
  'Sale collection',
];

export const collectionOpportunities: CollectionOpportunity[] = [
  {
    icon: 'ReplaceObjs',
    title: 'Move best-selling items to top',
    description:
      'This collection is converting well, move the top 3 best-selling items to the first row.',
  },
  {
    icon: 'Tag',
    title: 'Add discovery tags',
    description:
      'Use collection tags to improve merchandising and campaign targeting.',
  },
  {
    icon: 'Megaphone',
    title: 'Promote collection',
    description:
      'Feature this collection in Shop campaigns while demand is up.',
  },
];

const channelIds = channels.map((channel) => channel.id);
const catalogIds = catalogs.map((catalog) => catalog.id);
const tagIds = tags.map((tag) => tag.id);

function collectionDescription(title: string): RichTextEditorValue {
  const descriptions: Record<string, string> = {
    Overshirts:
      'A practical edit of overshirts designed to sit between shirting and lightweight outerwear. These pieces add structure over tees, layer comfortably under coats, and bring enough pocketing and fabric weight to carry a full day of movement. Merchandised for customers who want an easy top layer that feels polished without becoming formal.',
    Skateboards:
      'A diverse range of premium boards built for every style of riding, from street spots and park lines to cruising, collecting, and wall display. The assortment balances graphic-forward artwork with dependable 7-ply maple construction, giving each deck the right mix of visual impact and daily utility. Widths and artwork options vary across the collection so riders can choose the shape, stance, and personality that fits their setup.',
    Hoodies:
      'A focused hoodie collection built around soft fleece, relaxed proportions, and colorways that work across seasons. These styles are comfortable enough for everyday wear but detailed enough to anchor a full outfit, with artwork and tones that pair naturally with denim, canvas, and technical layers. Use this collection for customers looking for warmth, ease, and a casual MVSE point of view.',
    Sneakers:
      'A compact sneaker assortment centered on low-profile shapes, mixed materials, and grounded color palettes. The collection is easy to merchandise with apparel because the silhouettes stay clean while still offering enough texture and color to feel intentional. Ideal for customers who want casual footwear that can move from weekend walks to store shifts without feeling overbuilt.',
    Sweatshirts:
      'A casual fleece collection for customers who want softness, warmth, and a relaxed fit without committing to heavier outerwear. These pieces are designed for layering through transitional weather, pairing easily with overshirts, beanies, and everyday bottoms. The assortment keeps comfort at the center while leaving room for graphic details and seasonal color stories.',
    Shirts:
      'A curated shirt collection covering graphic tees, button downs, and easy layering pieces with a relaxed MVSE sensibility. The assortment is built for everyday styling: wear the tees as base layers, use the button downs as light overshirts, or combine both for a more textured product story. Strong for seasonal merchandising, outfit building, and storefront discovery.',
    Beanies:
      'A cold-weather accessories collection built around texture, color, and small branded details. The assortment includes simple ribbed knits and more expressive patterned options, making it easy for customers to choose between a quiet everyday staple and a stronger finishing piece. Merchandise alongside hoodies, overshirts, and outerwear to round out complete seasonal looks.',
  };

  const description =
    descriptions[title] ??
    `A curated collection of ${title.toLowerCase()} selected for seasonal merchandising, outfit building, and storefront discovery. The assortment brings together complementary products with a clear point of view, helping customers browse by mood, use case, and styling intent rather than individual item type alone.`;

  return [
    {
      type: 'paragraph',
      children: [{ text: description }],
    },
  ];
}

function collectionMetafields(title: string): ProductMetafield[] {
  return title === 'Skateboards'
    ? [
        {
          name: 'Activity type',
          values: [{ label: 'Skateboarding' }, { label: 'Casual' }],
        },
        {
          name: 'Performance features',
          values: [
            { label: 'Quick dry' },
            { label: 'UV protection' },
            { label: 'Anti-odor' },
          ],
        },
      ]
    : [
        {
          name: 'Activity type',
          values: [{ label: title }, { label: 'Casual' }],
        },
        {
          name: 'Performance features',
          values: [{ label: 'Online exclusive' }, { label: 'Seasonal edit' }],
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

function sparklineData(seed: number, base: number) {
  return Array.from({ length: 5 }, (_, index) =>
    Math.max(4, Math.round(base + ((seed + index * 5) % 20) - 10)),
  );
}

function nonZeroChange(value: number) {
  return value === 0 ? 1 : value;
}

function collectionMetrics(
  id: string,
  productCount: number,
): CollectionMetric[] {
  const seed = getFixtureSeed(id);

  return [
    {
      title: 'Sales',
      metric: 420 + productCount * 180 + (seed % 1200),
      sparkline: {
        data: sparklineData(seed, 54),
        label: nonZeroChange((seed % 11) - 5),
        suffix: '%',
      },
    },
    {
      title: 'Conversion',
      metric: Number((2.8 + (seed % 32) / 10).toFixed(1)),
      suffix: '%',
      sparkline: {
        data: sparklineData(seed + 17, 22),
        label: 1 + (seed % 6),
        prefix: '+',
        suffix: '%',
        variant: 'positive',
      },
    },
    {
      title: 'Returns',
      metric: 24 + (seed % 115),
      sparkline: {
        data: sparklineData(seed + 31, 18),
        label: -1 * (1 + (seed % 5)),
        suffix: '%',
        variant: 'positive',
      },
    },
  ];
}

function collectionRuleSets({
  id,
  productIds,
  title,
}: {
  id: string;
  productIds: string[];
  title: string;
}): CollectionRuleSet[] {
  if (id === 'skateboards') {
    return [
      {
        id: `${id}:products`,
        resource: 'products',
        match: 'all',
        inclusions: [
          {
            id: `${id}:category`,
            field: 'category',
            operator: 'equals',
            values: ['Skateboard Decks', 'Sneakers'],
          },
          {
            id: `${id}:price`,
            field: 'price',
            operator: 'is less than',
            value: 300,
          },
        ],
        exclusions: [],
        manualProductIds: productIds.slice(0, 2),
        positioning: [
          {
            id: `${id}:positioning`,
            productIds: productIds.slice(0, 5),
          },
        ],
      },
    ];
  }

  return [
    {
      id: `${id}:products`,
      resource: 'products',
      match: 'all',
      inclusions: [
        {
          id: `${id}:category`,
          field: 'category',
          operator: 'equals',
          values: [getDefaultCollectionCategory(title)],
        },
      ],
      exclusions: [],
      manualProductIds: [],
      positioning: [],
    },
  ];
}

function getDefaultCollectionCategory(title: string) {
  const categoryByCollectionTitle: Record<string, string> = {
    Overshirts: 'Shirts',
    Sweatshirts: 'Hoodies',
  };

  return categoryByCollectionTitle[title] ?? title;
}

function createCollection({
  id,
  image,
  productIds,
  status,
  title,
}: {
  id: string;
  image: string;
  productIds: string[];
  status?: string;
  title: string;
}): Collection {
  const seed = getFixtureSeed(id);
  const productCount = productIds.length;

  return {
    id,
    title,
    description: collectionDescription(title),
    status: status ?? (seed % 4 === 0 ? 'draft' : 'active'),
    channelIds: selectFixtureIds(channelIds, seed, 2 + (seed % 3)),
    catalogIds: selectFixtureIds(catalogIds, seed, 1 + (seed % 3)),
    themeTemplate:
      collectionThemeTemplates[seed % collectionThemeTemplates.length],
    tagIds: selectFixtureIds(tagIds, seed, 1 + (seed % 3)),
    metafields: collectionMetafields(title),
    metrics: collectionMetrics(id, productCount),
    productCount,
    productIds,
    ruleSets: collectionRuleSets({ id, productIds, title }),
    image,
  };
}

export const collections: Collection[] = [
  createCollection({
    id: 'overshirts',
    title: 'Overshirts',
    productIds: ['fioranti-button-down'],
    image: 'collection/collection-1.jpg',
  }),
  createCollection({
    id: 'skateboards',
    title: 'Skateboards',
    productIds: [
      'buonaglitci-skateboard-deck',
      'bosquet-skateboard-deck',
      'bosquet-inverse-skateboard-deck',
      'marcella-skateboard-deck',
      'riflessione-skateboard-deck',
      'parterre-skateboard-deck',
      'repose-skateboard-deck',
      'piscine-skateboard-deck',
      'clandestino-skateboard-deck',
    ],
    image: 'collection/collection-6.jpg',
  }),
  createCollection({
    id: 'hoodies',
    title: 'Hoodies',
    productIds: ['heartside-hoodie'],
    image: 'collection/collection-5.jpg',
  }),
  createCollection({
    id: 'sneakers',
    title: 'Sneakers',
    productIds: ['flora-sneakers'],
    image: 'collection/collection-7.jpg',
  }),
  createCollection({
    id: 'sweatshirts',
    title: 'Sweatshirts',
    productIds: ['heartside-hoodie'],
    image: 'collection/collection-3.jpg',
  }),
  createCollection({
    id: 'shirts',
    title: 'Shirts',
    productIds: ['mvse-libertee', 'fioranti-button-down'],
    image: 'collection/collection-2.jpg',
  }),
  createCollection({
    id: 'beanies',
    title: 'Beanies',
    productIds: ['mvse-vergier-beanie', 'mvse-knit-beanie'],
    image: 'collection/collection-4.jpg',
  }),
];

export const productCollections = collections.map(({ id, title }) => ({
  id,
  name: title,
}));

export function useCollectionsData() {
  return collections;
}
