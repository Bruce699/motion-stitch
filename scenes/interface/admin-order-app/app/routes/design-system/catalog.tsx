import type * as React from 'react';
import { DataTable, StatusIndicator } from '~/ui';
import { InputButtonPreview } from './catalog-input-button-preview';
import { MetricsBarPreview } from './catalog-metrics-bar-preview';
import { ResourcePreviewCatalogPreview } from './catalog-resource-preview';
import { RichTextEditorPreview } from './catalog-rich-text-editor-preview';
import * as Accordion from '~/ui/components/accordion/accordion';
import * as Aside from '~/ui/components/aside/aside';
import { Avatar } from '~/ui/components/avatar/avatar';
import { Badge } from '~/ui/components/badge/badge';
import { Banner } from '~/ui/components/banner/banner';
import { Button } from '~/ui/components/button/button';
import { Checkbox } from '~/ui/components/checkbox/checkbox';
import * as Collapsible from '~/ui/components/collapsible/collapsible';
import { Combobox } from '~/ui/components/combobox/combobox';
import { Dialog } from '~/ui/components/dialog/dialog';
import { Icon } from '~/ui/components/icon/icon';
import { Image } from '~/ui/components/image/image';
import { Input } from '~/ui/components/input/input';
import { InputCombo } from '~/ui/components/input-combo/input-combo';
import { InputHero } from '~/ui/components/input-hero/input-hero';
import { InputStepper } from '~/ui/components/input-stepper/input-stepper';
import { Intent } from '~/ui/components/intent';
import { Link } from '~/ui/components/link/link';
import { Map } from '~/ui/components/map/map';
import { Menu } from '~/ui/components/menu/menu';
import { AnimatedNumber } from '~/ui/components/animated-number/animated-number';
import { Popover } from '~/ui/components/popover/popover';
import { ProgressiveBlur } from '~/ui/components/progressive-blur/progressive-blur';
import * as Radio from '~/ui/components/radio/radio';
import { SearchBar } from '~/ui/components/search-bar/search-bar';
import { Section } from '~/ui/components/section/section';
import { SegmentedControl } from '~/ui/components/segmented-control/segmented-control';
import { Select } from '~/ui/components/select/select';
import { SettingsActionList } from '~/ui/components/settings-action-list/settings-action-list';
import { ShimmerText } from '~/ui/components/shimmer-text/shimmer-text';
import { SidekickIcon } from '~/ui/components/sidekick-icon/sidekick-icon';
import { ShopifyLogo } from '~/ui/components/shopify-logo/shopify-logo';
import { Sparkline } from '~/ui/components/sparkline/sparkline';
import { Switch } from '~/ui/components/switch/switch';
import * as Table from '~/ui/components/table/table';
import { Toast } from '~/ui/components/toast/toast';
import * as Tooltip from '~/ui/components/tooltip';

const simpleRows = [
  { product: 'Hydrogen hoodie', status: 'Active', sales: '$4,280' },
  { product: 'Admin tote', status: 'Draft', sales: '$840' },
  { product: 'POS card reader', status: 'Active', sales: '$12,460' },
];

const bellIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M5 6a3 3 0 0 1 6 0c0 3 1.5 3.5 1.5 4.5h-9C3.5 9.5 5 9 5 6Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M6.8 12.5h2.4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const catalogToastManager = Toast.createToastManager();

export const components: {
  name: string;
  slug: string;
  tier: 'Modern';
  category: string;
  summary: string;
  preview: React.ReactNode;
}[] = [
  {
    name: 'Accordion',
    slug: 'accordion',
    tier: 'Modern',
    category: 'Disclosure',
    summary: 'Collapsible sections powered by Base UI.',
    preview: (
      <Accordion.Root defaultValue={['details']} className="w-full max-w-md">
        <Accordion.Item value="details">
          <Accordion.Header>
            <Accordion.Trigger>Store details</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <div className="p-3">
              Review shop profile, markets, and default currency.
            </div>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="billing">
          <Accordion.Header>
            <Accordion.Trigger>Billing</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <div className="p-3">
              Plan, payment method, and invoice history.
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ),
  },
  {
    name: 'Aside',
    slug: 'aside',
    tier: 'Modern',
    category: 'Layout',
    summary: 'Right-rail summary, controls, metrics, and opportunities.',
    preview: (
      <div className="w-70">
        <Aside.Root>
          <Aside.Group>
            <Aside.Item
              type="status"
              status="active"
              value="active"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
              ]}
            />
            <Aside.Item
              type="combobox"
              label="Channels"
              icon="ConnectedDots3"
              value={['online', 'pos']}
              options={[
                { value: 'online', label: 'Online Store' },
                { value: 'pos', label: 'Point of Sale' },
                { value: 'draft', label: 'Draft orders' },
              ]}
              multipleSelectionLabel={(count) => `${count} channels`}
            />
          </Aside.Group>
          <Aside.Group heading="Metrics">
            <Aside.Item
              type="metric"
              title="Sales"
              metric={63}
              animated
              sparkline={{
                data: [42, 38, 39, 34, 35, 31, 29],
                label: -4,
                suffix: '%',
                variant: 'negative',
                animated: true,
              }}
            />
            <Aside.Item
              type="metric"
              title="Avg. order value"
              prefix="$"
              metric={84}
              animated
            />
          </Aside.Group>
          <Aside.Group opportunities>
            <Aside.Item
              type="opportunities"
              opportunities={[
                {
                  icon: 'Megaphone',
                  title: 'Share with top customers',
                  description:
                    'Promote this discount with a targeted email campaign.',
                },
                {
                  icon: 'Tag',
                  title: 'Bundle with best sellers',
                  description:
                    'Pair this discount with top products to raise order value.',
                },
              ]}
            />
          </Aside.Group>
        </Aside.Root>
      </div>
    ),
  },
  {
    name: 'Avatar',
    slug: 'avatar',
    tier: 'Modern',
    category: 'Media',
    summary: 'Compact identity marker for people and customers.',
    preview: (
      <div className="flex flex-col gap-3">
        <div className="flex items-end gap-2">
          <Avatar initials="AK" name="Ari Kara" size="sm" />
          <Avatar initials="MS" name="Mina Stone" />
          <Avatar initials="JL" name="Jamie Lee" size="lg" />
          <Avatar
            initials="VIP"
            name="VIP customer"
            size="lg"
            className="bg-gray-950 text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Avatar
            initials="TT"
            name="Tobi Trend"
            rounded
            size="lg"
            src="/images/staff/tobi.jpg"
          />
          <Avatar initials="SD" name="Sam Diaz" rounded />
          <Avatar initials="RW" name="River West" rounded size="sm" />
        </div>
      </div>
    ),
  },
  {
    name: 'Badge',
    slug: 'badge',
    tier: 'Modern',
    category: 'Status',
    summary: 'Compact status and metadata labels.',
    preview: (
      <div className="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="caution">Caution</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="ai">AI</Badge>
      </div>
    ),
  },
  {
    name: 'Banner',
    slug: 'banner',
    tier: 'Modern',
    category: 'Feedback',
    summary: 'Inline notice surface with an optional icon and action.',
    preview: (
      <div className="flex flex-col gap-3">
        <Banner
          icon={<Icon name="CartAlert" />}
          actionLabel="Place test order"
          onActionClick={() => {}}
        >
          Place test orders on checkout without processing real payments
        </Banner>
        <Banner icon={<Icon name="CircleWarning" />}>
          Customer payment details are checked before the order is created
        </Banner>
      </div>
    ),
  },
  {
    name: 'Button',
    slug: 'button',
    tier: 'Modern',
    category: 'Action',
    summary: 'Primary, header, secondary, small, and icon actions.',
    preview: (
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => {}}>Save</Button>
        <Button onClick={() => {}} variant="elevated">
          Preview
        </Button>
        <Button onClick={() => {}} variant="secondary">
          Dismiss
        </Button>
        <Button onClick={() => {}} size="icon" aria-label="Notifications">
          {bellIcon}
        </Button>
      </div>
    ),
  },
  {
    name: 'Checkbox',
    slug: 'checkbox',
    tier: 'Modern',
    category: 'Form',
    summary: 'Boolean checkbox primitive.',
    preview: (
      <div className="flex flex-col gap-2 text-sm">
        <Checkbox defaultChecked label="Track quantity" />
        <Checkbox checked indeterminate label="Select all products" />
      </div>
    ),
  },
  {
    name: 'Collapsible',
    slug: 'collapsible',
    tier: 'Modern',
    category: 'Disclosure',
    summary: 'Expandable panel powered by Base UI.',
    preview: (
      <Collapsible.Root defaultOpen className="w-full max-w-sm">
        <Collapsible.Trigger className="font-medium text-primary">
          Shipping options
        </Collapsible.Trigger>
        <Collapsible.Panel contentClassName="pt-2">
          <p className="text-muted-foreground">
            Offer local delivery, pickup, and standard shipping from one panel.
          </p>
        </Collapsible.Panel>
      </Collapsible.Root>
    ),
  },
  {
    name: 'Combobox',
    slug: 'combobox',
    tier: 'Modern',
    category: 'Form',
    summary: 'Searchable multi-select dropdown.',
    preview: (
      <Combobox
        className="max-w-xs"
        label="Collections"
        value={['shirts', 'skateboards']}
        placeholder="Select collections"
        multipleSelectionLabel={(count) => `${count} collections`}
        options={[
          { value: 'shirts', label: 'Overshirts' },
          { value: 'skateboards', label: 'Skateboards' },
          { value: 'accessories', label: 'Accessories' },
        ]}
      />
    ),
  },
  {
    name: 'DataTable',
    slug: 'data-table',
    tier: 'Modern',
    category: 'Data Display',
    summary: 'Column-configured data table for record lists.',
    preview: (
      <DataTable
        items={simpleRows}
        columns={[
          { header: 'Product', render: (item) => item.product },
          {
            header: 'Status',
            render: (item) => (
              <Badge variant={item.status === 'Active' ? 'success' : 'default'}>
                {item.status}
              </Badge>
            ),
          },
          { header: 'Sales', render: (item) => item.sales, align: 'right' },
        ]}
        rowKey={(item) => item.product}
      />
    ),
  },
  {
    name: 'Dialog',
    slug: 'dialog',
    tier: 'Modern',
    category: 'Overlay',
    summary: 'Modal dialog for focused tasks.',
    preview: (
      <Dialog>
        <Dialog.Trigger>
          <Button onClick={() => {}} variant="secondary">
            Open dialog
          </Button>
        </Dialog.Trigger>
        <Dialog.Content type="dialog">
          <h2 className="-mt-1.5 mb-1 text-lg font-medium">Invite staff</h2>
          <p className="mb-6 text-base text-gray-600">
            Send a collaborator invite to this store.
          </p>
          <Input label="Email address" placeholder="name@example.com" />
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close>
              <Button onClick={() => {}} variant="secondary">
                Cancel
              </Button>
            </Dialog.Close>
            <Dialog.Close>
              <Button onClick={() => {}}>Send invite</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog>
    ),
  },
  {
    name: 'Intent',
    slug: 'intent',
    tier: 'Modern',
    category: 'Overlay',
    summary: 'Scoped task overlay with dialog-compatible behavior.',
    preview: (
      <Intent>
        <Intent.Trigger>
          <Button onClick={() => {}} variant="secondary">
            Open intent
          </Button>
        </Intent.Trigger>
        <Intent.Content type="dialog">
          <h2 className="-mt-1.5 mb-1 text-lg font-medium">Review task</h2>
          <p className="mb-6 text-base text-gray-600">
            Resolve a focused workspace action without leaving the page.
          </p>
          <div className="flex justify-end gap-2">
            <Intent.Close>
              <Button onClick={() => {}} variant="secondary">
                Dismiss
              </Button>
            </Intent.Close>
            <Intent.Close>
              <Button onClick={() => {}}>Done</Button>
            </Intent.Close>
          </div>
        </Intent.Content>
      </Intent>
    ),
  },
  {
    name: 'Icon',
    slug: 'icon',
    tier: 'Modern',
    category: 'Media',
    summary: 'Nucleo icon renderer backed by the icon manifest.',
    preview: (
      <div className="flex items-center gap-3 text-muted-foreground">
        <Icon name="DiscountCode" />
        <Icon name="ConnectedDots3" />
        <Icon name="Hashtag" />
        <Icon name="Megaphone" />
      </div>
    ),
  },
  {
    name: 'Image',
    slug: 'image',
    tier: 'Modern',
    category: 'Media',
    summary: 'Product and collection media with loading and empty states.',
    preview: (
      <div className="flex items-center gap-3">
        <Image
          src="collection/collection-6.jpg"
          alt="Skateboards collection"
          size={64}
          borderRadius="xl"
          shadow="sm"
        />
        <Image size={64} borderRadius="xl" />
      </div>
    ),
  },
  {
    name: 'Input',
    slug: 'input',
    tier: 'Modern',
    category: 'Form',
    summary: 'Input with optional prefix or suffix add-ons.',
    preview: (
      <Input
        className="max-w-xs"
        label="Price"
        placeholder="0.00"
        prefix="$"
        suffix="USD"
      />
    ),
  },
  {
    name: 'InputButton',
    slug: 'input-button',
    tier: 'Modern',
    category: 'Form',
    summary: 'Button-shaped picker, text, switch, and checkbox inputs.',
    preview: <InputButtonPreview />,
  },
  {
    name: 'InputCombo',
    slug: 'input-combo',
    tier: 'Modern',
    category: 'Form',
    summary: 'Combined select and text input with one shared surface.',
    preview: (
      <InputCombo
        className="max-w-sm"
        label="Minimum purchase"
        select={{
          defaultValue: 'amount',
          options: [
            { value: 'amount', label: 'Amount' },
            { value: 'quantity', label: 'Quantity' },
          ],
        }}
        input={{
          defaultValue: '50',
          prefix: '$',
          suffix: 'USD',
        }}
      />
    ),
  },
  {
    name: 'InputHero',
    slug: 'input-hero',
    tier: 'Modern',
    category: 'Form',
    summary: 'Large borderless input for prominent editable values.',
    preview: (
      <InputHero
        className="max-w-sm"
        label="Campaign title"
        defaultValue="Spring sale"
      />
    ),
  },
  {
    name: 'InputStepper',
    slug: 'input-stepper',
    tier: 'Modern',
    category: 'Form',
    summary: 'Compact numeric stepper for small quantity controls.',
    preview: <InputStepper defaultValue={1} min={0} max={12} />,
  },
  {
    name: 'Link',
    slug: 'link',
    tier: 'Modern',
    category: 'Navigation',
    summary: 'React Router link with intent prefetch by default.',
    preview: (
      <Link to="/design-system" className="font-medium underline">
        Open design system
      </Link>
    ),
  },
  {
    name: 'Map',
    slug: 'map',
    tier: 'Modern',
    category: 'Media',
    summary: 'Styled MapLibre location map for a latitude and longitude.',
    preview: (
      <Map
        center={[52.3676, 4.9041]}
        className="h-48 w-full max-w-md rounded-xl shadow-sm"
        aria-label="Amsterdam map"
      />
    ),
  },
  {
    name: 'Menu',
    slug: 'menu',
    tier: 'Modern',
    category: 'Overlay',
    summary: 'Contextual action menu.',
    preview: (
      <Menu
        trigger={
          <Button onClick={() => {}} variant="secondary">
            Actions
          </Button>
        }
        options={[
          { label: 'Duplicate' },
          { label: 'Export' },
          { type: 'separator' },
          { label: 'Archive' },
        ]}
      />
    ),
  },
  {
    name: 'AnimatedNumber',
    slug: 'animated-number',
    tier: 'Modern',
    category: 'Data Display',
    summary: 'Formatted numeric values for KPIs, amounts, and percentages.',
    preview: (
      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Net sales</span>
          <AnimatedNumber
            className="text-3xl font-semibold"
            metric={4280}
            prefix="$"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Conversion</span>
          <AnimatedNumber
            className="text-3xl font-semibold"
            metric={4.8}
            suffix="%"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Orders</span>
          <AnimatedNumber
            className="text-3xl font-semibold"
            metric={128}
            animated
          />
        </div>
      </div>
    ),
  },
  {
    name: 'MetricsBar',
    slug: 'metrics-bar',
    tier: 'Modern',
    category: 'Data Display',
    summary: 'Horizontal KPI summary with optional changes and sparklines.',
    preview: <MetricsBarPreview />,
  },
  {
    name: 'Section',
    slug: 'section',
    tier: 'Modern',
    category: 'Layout',
    summary: 'Titled content section with a rounded surface.',
    preview: (
      <Section title="Campaign settings">
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-medium">Discount configuration</p>
          <p className="text-muted-foreground">
            Group related controls inside a consistent section surface.
          </p>
        </div>
      </Section>
    ),
  },
  {
    name: 'SegmentedControl',
    slug: 'segmented-control',
    tier: 'Modern',
    category: 'Form',
    summary: 'Compact single-choice toggle group with a clipped indicator.',
    preview: (
      <SegmentedControl
        ariaLabel="View mode"
        defaultValue="list"
        segments={[
          { value: 'grid', icon: 'Grid', ariaLabel: 'Grid view' },
          { value: 'list', icon: 'TableRows2', ariaLabel: 'List view' },
        ]}
      />
    ),
  },
  {
    name: 'Popover',
    slug: 'popover',
    tier: 'Modern',
    category: 'Overlay',
    summary: 'Anchored floating content.',
    preview: (
      <Popover
        trigger={
          <Button onClick={() => {}} variant="secondary">
            Open popover
          </Button>
        }
      >
        <Popover.Title>Inventory sync</Popover.Title>
        <Popover.Description>Updated 2 minutes ago.</Popover.Description>
      </Popover>
    ),
  },
  {
    name: 'ProgressiveBlur',
    slug: 'progressive-blur',
    tier: 'Modern',
    category: 'Effect',
    summary: 'Edge blur overlay for clipped or scrollable surfaces.',
    preview: (
      <div className="relative h-32 w-full max-w-sm overflow-hidden rounded-lg border bg-white">
        <div className="flex flex-col gap-2 p-4 text-sm">
          {['Inventory sync', 'Markets updated', 'Rates recalculated'].map(
            (label) => (
              <div key={label} className="rounded-md bg-gray-100 px-3 py-2">
                {label}
              </div>
            ),
          )}
        </div>
        <ProgressiveBlur side="bottom" className="h-14" />
      </div>
    ),
  },
  {
    name: 'ResourcePreview',
    slug: 'resource-preview',
    tier: 'Modern',
    category: 'Overlay',
    summary: 'Hover/focus preview cards for Admin resources.',
    preview: <ResourcePreviewCatalogPreview />,
  },
  {
    name: 'Radio',
    slug: 'radio',
    tier: 'Modern',
    category: 'Form',
    summary: 'Single-choice radio group.',
    preview: (
      <Radio.Group defaultValue="manual">
        {['automatic', 'manual'].map((value) => (
          <Radio.Root
            key={value}
            value={value}
            label={<span className="capitalize">{value}</span>}
          />
        ))}
      </Radio.Group>
    ),
  },
  {
    name: 'RichTextEditor',
    slug: 'rich-text-editor',
    tier: 'Modern',
    category: 'Form',
    summary: 'Paragraph-only Slate editor for compact descriptions.',
    preview: <RichTextEditorPreview />,
  },
  {
    name: 'SearchBar',
    slug: 'search-bar',
    tier: 'Modern',
    category: 'Form',
    summary: 'Search input with a filter action.',
    preview: (
      <SearchBar
        className="w-full max-w-sm"
        placeholder="Search products"
        onFilterClick={() => {}}
      />
    ),
  },
  {
    name: 'Select',
    slug: 'select',
    tier: 'Modern',
    category: 'Form',
    summary: 'Base UI select with trigger, popup, and grouped options.',
    preview: (
      <Select
        defaultValue="online"
        label="Sales channel"
        placeholder="Channel"
        options={[
          { value: 'online', label: 'Online Store' },
          { value: 'pos', label: 'Point of Sale' },
          { value: 'draft', label: 'Draft order' },
        ]}
      />
    ),
  },
  {
    name: 'SettingsActionList',
    slug: 'settings-action-list',
    tier: 'Modern',
    category: 'Settings',
    summary: 'Icon-led settings rows with values, chevrons, and switches.',
    preview: (
      <div className="w-full max-w-md">
        <SettingsActionList
          items={[
            {
              title: 'Customer notifications',
              icon: 'Envelope',
              value: 'Enabled',
            },
            {
              title: 'Auto-capture payments',
              icon: 'CreditCard',
              description: 'Capture payment when orders are fulfilled.',
              control: 'switch',
              defaultChecked: true,
            },
          ]}
        />
      </div>
    ),
  },
  {
    name: 'ShimmerText',
    slug: 'shimmer-text',
    tier: 'Modern',
    category: 'Feedback',
    summary: 'Animated gradient text for subtle in-progress emphasis.',
    preview: <ShimmerText>Generating recommendation</ShimmerText>,
  },
  {
    name: 'SidekickIcon',
    slug: 'sidekick-icon',
    tier: 'Modern',
    category: 'Media',
    summary:
      'Animated Sidekick orb icon with idle, active, and loading states.',
    preview: (
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex items-center gap-2">
          <SidekickIcon />
          <span className="text-sm text-muted-foreground">
            state=&quot;idle&quot;
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SidekickIcon state="active" />
          <span className="text-sm text-muted-foreground">
            state=&quot;active&quot;
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SidekickIcon state="loading" />
          <span className="text-sm text-muted-foreground">
            state=&quot;loading&quot;
          </span>
        </div>
      </div>
    ),
  },
  {
    name: 'ShopifyLogo',
    slug: 'shopify-logo',
    tier: 'Modern',
    category: 'Media',
    summary: 'Inline Shopify brand mark and wordmark SVG.',
    preview: (
      <div className="flex items-center gap-3 rounded-xl bg-gray-900 p-3">
        <ShopifyLogo variant="mark" />
        <ShopifyLogo variant="full" />
      </div>
    ),
  },
  {
    name: 'Sparkline',
    slug: 'sparkline',
    tier: 'Modern',
    category: 'Data Display',
    summary: 'Inline trend chart with optional tooltip.',
    preview: (
      <div className="flex items-center gap-6">
        <Sparkline
          data={[12, 14, 13, 18, 22, 20, 28]}
          variant="positive"
          width={96}
        />
        <Sparkline
          data={[28, 22, 24, 20, 18, 15, 12]}
          variant="negative"
          width={96}
          tooltip
        />
      </div>
    ),
  },
  {
    name: 'StatusIndicator',
    slug: 'status-indicator',
    tier: 'Modern',
    category: 'Status',
    summary: 'Active or inactive availability indicator.',
    preview: (
      <div className="flex flex-col gap-2">
        <StatusIndicator status="active" label="Active" />
        <StatusIndicator status="inactive" label="Inactive" />
      </div>
    ),
  },
  {
    name: 'Switch',
    slug: 'switch',
    tier: 'Modern',
    category: 'Form',
    summary: 'Animated on/off switch.',
    preview: (
      <Switch defaultChecked label="Enabled" onCheckedChange={() => {}} />
    ),
  },
  {
    name: 'Table',
    slug: 'table',
    tier: 'Modern',
    category: 'Data Display',
    summary: 'Composable semantic table primitives.',
    preview: (
      <Table.Root striped>
        <Table.Head>
          <Table.Row>
            <Table.Header>Order</Table.Header>
            <Table.Header>Status</Table.Header>
            <Table.Header className="text-right">Total</Table.Header>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          <Table.Row>
            <Table.Cell>#1001</Table.Cell>
            <Table.Cell>
              <Badge variant="success">Paid</Badge>
            </Table.Cell>
            <Table.Cell className="text-right">$128.00</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>#1002</Table.Cell>
            <Table.Cell>
              <Badge variant="caution">Pending</Badge>
            </Table.Cell>
            <Table.Cell className="text-right">$84.00</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    ),
  },
  {
    name: 'Toast',
    slug: 'toast',
    tier: 'Modern',
    category: 'Feedback',
    summary: 'Transient notifications powered by Base UI.',
    preview: (
      <Toast timeout={6000} toastManager={catalogToastManager}>
        <div className="relative h-44 w-full overflow-hidden rounded-lg border bg-gray-50 p-4">
          <Toast.Trigger>
            <Button onClick={() => {}} variant="secondary">
              Show toast
            </Button>
          </Toast.Trigger>
          <Toast.Content
            label="Hydrogen hoodie is ready for the Online Store."
            actionLabel="Undo"
            onActionClick={() => {
              catalogToastManager.add({
                description: 'The last update was reversed.',
              });
            }}
          />
        </div>
      </Toast>
    ),
  },
  {
    name: 'Tooltip',
    slug: 'tooltip',
    tier: 'Modern',
    category: 'Overlay',
    summary: 'Hover/focus information popup.',
    preview: (
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger aria-label="Revenue info">?</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Net sales after returns.</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    ),
  },
];
