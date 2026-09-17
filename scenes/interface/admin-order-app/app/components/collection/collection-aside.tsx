import type { Catalog } from '~/data/catalogs';
import type { Channel } from '~/data/channels';
import {
  collectionOpportunities,
  type CollectionMetric,
} from '~/data/collections';
import type { Tag } from '~/data/tags';
import { Aside } from '~/ui';

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

function CollectionAside({
  catalogs,
  channels,
  collectionThemeTemplates,
  metrics,
  selectedCatalogs,
  selectedChannels,
  selectedTags,
  status,
  tags,
  themeTemplate,
  onPublishingChange,
  onStatusChange,
  onTagsChange,
  onThemeTemplateChange,
}: {
  catalogs: Catalog[];
  channels: Channel[];
  collectionThemeTemplates: string[];
  metrics: CollectionMetric[];
  selectedCatalogs: string[];
  selectedChannels: string[];
  selectedTags: string[];
  status: string;
  tags: Tag[];
  themeTemplate: string;
  onPublishingChange: (value: string[]) => void;
  onStatusChange: (value: string) => void;
  onTagsChange: (value: string[]) => void;
  onThemeTemplateChange: (value: string) => void;
}) {
  const publishingOptions = [
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
  ];
  const publishingValue = [
    ...selectedChannels.map((channel) => `channel:${channel}`),
    ...selectedCatalogs.map((catalog) => `catalog:${catalog}`),
  ];

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
          label="Theme template"
          icon="RectLayoutGrid"
          value={themeTemplate}
          options={collectionThemeTemplates.map((template) => ({
            value: template,
            label: template,
          }))}
          onValueChange={(value) => {
            if (typeof value === 'string') onThemeTemplateChange(value);
          }}
        />
        <Aside.Item
          type="combobox"
          label="Tags"
          icon="Hashtag"
          value={selectedTags}
          options={tags.map((tag) => ({
            value: tag.id,
            label: tag.name,
          }))}
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
            animated
            sparkline={{ ...metric.sparkline, animated: true }}
          />
        ))}
      </Aside.Group>
      <Aside.Group opportunities>
        <Aside.Item
          type="opportunities"
          opportunities={collectionOpportunities}
        />
      </Aside.Group>
    </Aside.Root>
  );
}

export { CollectionAside };
