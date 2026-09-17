import { memo, useMemo } from 'react';
import { Aside } from '~/ui';
import type { Catalog } from '~/data/catalogs';
import { productCategories } from '~/data/categories';
import type { Channel } from '~/data/channels';
import {
  productOpportunities,
  type ProductCollection,
  type ProductMetric,
} from '~/data/products';
import type { Tag } from '~/data/tags';

const productCategoryOptions = productCategories.map((categoryOption) => ({
  value: categoryOption,
  label: categoryOption,
}));

function getPublishingLabel({
  catalogCount,
  channelCount,
}: {
  catalogCount: number;
  channelCount: number;
}) {
  const channelLabel = `${channelCount} ${channelCount === 1 ? 'channel' : 'channels'}`;
  const catalogLabel = `${catalogCount} ${catalogCount === 1 ? 'catalog' : 'catalogs'}`;

  return `${channelLabel}, ${catalogLabel}`;
}

const ProductAside = memo(function ProductAside({
  animateMetrics = true,
  catalogs,
  channels,
  collections,
  metrics,
  productThemeTemplates,
  selectedCatalogs,
  selectedChannels,
  selectedCollections,
  selectedTags,
  status,
  tags,
  category,
  themeTemplate,
  onCategoryChange,
  onCollectionsChange,
  onThemeTemplateChange,
  onPublishingChange,
  onStatusChange,
  onTagsChange,
}: {
  animateMetrics?: boolean;
  catalogs: Catalog[];
  channels: Channel[];
  collections: ProductCollection[];
  metrics: ProductMetric[];
  productThemeTemplates: string[];
  selectedCatalogs: string[];
  selectedChannels: string[];
  selectedCollections: string[];
  selectedTags: string[];
  status: string;
  tags: Tag[];
  category: string;
  themeTemplate: string;
  onCategoryChange: (value: string) => void;
  onCollectionsChange: (value: string[]) => void;
  onThemeTemplateChange: (value: string) => void;
  onPublishingChange: (value: string[]) => void;
  onStatusChange: (value: string) => void;
  onTagsChange: (value: string[]) => void;
}) {
  const publishingOptions = useMemo(
    () => [
      ...channels.map((channel) => ({
        value: `channel:${channel.id}`,
        label: channel.name,
        heading: 'Channels',
      })),
      ...catalogs.map((catalog) => ({
        value: `catalog:${catalog.id}`,
        label: catalog.name,
        heading: 'Catalogs',
      })),
    ],
    [catalogs, channels],
  );
  const publishingValue = useMemo(
    () => [
      ...selectedChannels.map((channel) => `channel:${channel}`),
      ...selectedCatalogs.map((catalog) => `catalog:${catalog}`),
    ],
    [selectedCatalogs, selectedChannels],
  );
  const collectionNamesById = useMemo(
    () =>
      new Map(
        collections.map((collection) => [collection.id, collection.name]),
      ),
    [collections],
  );
  const collectionOptions = useMemo(
    () =>
      collections.map((collection) => ({
        value: collection.id,
        label: collection.name,
      })),
    [collections],
  );
  const themeTemplateOptions = useMemo(
    () =>
      productThemeTemplates.map((template) => ({
        value: template,
        label: template,
      })),
    [productThemeTemplates],
  );
  const tagOptions = useMemo(
    () =>
      tags.map((tag) => ({
        value: tag.id,
        label: tag.name,
      })),
    [tags],
  );
  const selectedCollectionLabels: string[] = [];

  for (const collectionId of selectedCollections) {
    const collectionName = collectionNamesById.get(collectionId);
    if (collectionName) selectedCollectionLabels.push(collectionName);
  }

  const selectedCollectionLabel = selectedCollectionLabels.join(', ');

  return (
    <Aside.Root>
      <Aside.Group>
        <Aside.Item
          type="status"
          label="Status"
          status={status === 'active' ? 'active' : 'inactive'}
          value={status}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'draft', label: 'Draft' },
          ]}
          onValueChange={(value) => {
            if (typeof value === 'string') onStatusChange(value);
          }}
        />
        <Aside.Item
          type="menu"
          label="Publishing"
          icon="ConnectedDots3"
          value={publishingValue}
          options={publishingOptions}
          optionIndicator="switch"
          onValueChange={onPublishingChange}
          multipleSelectionLabel={() =>
            getPublishingLabel({
              channelCount: selectedChannels.length,
              catalogCount: selectedCatalogs.length,
            })
          }
          placeholder="Select publishing"
        />
        <Aside.Item
          type="select"
          label="Category"
          icon="Album"
          value={category}
          options={productCategoryOptions}
          onValueChange={(value) => {
            if (typeof value === 'string') onCategoryChange(value);
          }}
        />
        <Aside.Item
          type="combobox"
          label="Collections"
          icon="Tags"
          value={selectedCollections}
          options={collectionOptions}
          onValueChange={onCollectionsChange}
          multipleSelectionLabel={(count) =>
            selectedCollectionLabel || `${count} collections`
          }
          popupMaxWidth="17.5rem"
          placeholder="Add collections"
        />
        <Aside.Item
          type="select"
          label="Theme template"
          icon="RectLayoutGrid"
          value={themeTemplate}
          options={themeTemplateOptions}
          onValueChange={(value) => {
            if (typeof value === 'string') onThemeTemplateChange(value);
          }}
        />
        <Aside.Item
          type="combobox"
          label="Tags"
          icon="Hashtag"
          value={selectedTags}
          options={tagOptions}
          onValueChange={onTagsChange}
          multipleSelectionLabel={(count) => `${count} tags`}
          placeholder="Add tags"
        />
      </Aside.Group>
      <Aside.Group heading="Metrics">
        {metrics.map((metric) => (
          <Aside.Item
            key={metric.title}
            type="metric"
            title={metric.title}
            metric={metric.metric}
            prefix={metric.prefix}
            suffix={metric.suffix}
            animated={animateMetrics}
            sparkline={{ ...metric.sparkline, animated: animateMetrics }}
          />
        ))}
      </Aside.Group>
      <Aside.Group opportunities>
        <Aside.Item type="opportunities" opportunities={productOpportunities} />
      </Aside.Group>
    </Aside.Root>
  );
});

export { ProductAside };
