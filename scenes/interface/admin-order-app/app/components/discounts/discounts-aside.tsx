import { Aside } from '~/ui';
import type { Channel } from '~/data/channels';
import { discountAsideMetrics, discountOpportunities } from '~/data/discounts';
import type { Tag } from '~/data/tags';

export function DiscountsAside({
  channels,
  status,
  tags,
  selectedChannels,
  selectedTags,
  onChannelsChange,
  onStatusChange,
  onTagsChange,
}: {
  channels: Channel[];
  status: string;
  tags: Tag[];
  selectedChannels: string[];
  selectedTags: string[];
  onChannelsChange: (value: string[]) => void;
  onStatusChange: (value: string) => void;
  onTagsChange: (value: string[]) => void;
}) {
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
          type="combobox"
          label="Channels"
          icon="ConnectedDots3"
          value={selectedChannels}
          options={channels.map((channel) => ({
            value: channel.id,
            label: channel.name,
          }))}
          onValueChange={onChannelsChange}
          multipleSelectionLabel={(count) => `${count} channels`}
          placeholder="Select channels"
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
        {discountAsideMetrics.map((metric) => (
          <Aside.Item
            key={metric.title}
            type="metric"
            title={metric.title}
            metric={metric.metric}
            prefix={metric.prefix}
            animated
            sparkline={
              metric.sparkline
                ? { ...metric.sparkline, animated: true }
                : undefined
            }
          />
        ))}
      </Aside.Group>
      <Aside.Group opportunities>
        <Aside.Item
          type="opportunities"
          opportunities={discountOpportunities}
        />
      </Aside.Group>
    </Aside.Root>
  );
}
