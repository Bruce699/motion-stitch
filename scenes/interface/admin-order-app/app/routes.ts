import { index, route, type RouteConfig } from '@react-router/dev/routes';

const isTauriSpaBuild = process.env.TAURI_SPA === 'true';
const homeRoute = isTauriSpaBuild
  ? 'routes/home-redirect.spa.tsx'
  : 'routes/home-redirect.ssr.tsx';

export default [
  index(homeRoute),
  route('login', 'routes/login.tsx'),
  route('design-system', 'routes/design-system.tsx'),
  route('store', 'routes/app-shell.tsx', [
    index('routes/store/home.tsx'),
    route('chats', 'routes/store/chats.tsx'),
    route('chats/:threadId', 'routes/store/chats-thread.tsx'),
    route('orders', 'routes/store/orders.tsx'),
    route('orders/:orderId', 'routes/store/orders.$orderId.tsx'),
    route(
      'orders/:orderId/create-shipping-label',
      'routes/store/orders.$orderId.create-shipping-label.tsx',
    ),
    route('orders/drafts', 'routes/store/orders/drafts.tsx'),
    route('orders/shipping-labels', 'routes/store/orders/shipping-labels.tsx'),
    route(
      'orders/abandoned-checkouts',
      'routes/store/orders/abandoned-checkouts.tsx',
    ),
    route('products', 'routes/store/products.tsx'),
    route('products/:productId', 'routes/store/products.$productId.tsx'),
    route('products/collections', 'routes/store/products/collections.tsx'),
    route(
      'products/collections/:collectionId',
      'routes/store/products/collections.$collectionId.tsx',
    ),
    route('products/inventory', 'routes/store/products/inventory.tsx'),
    route(
      'products/purchase-orders',
      'routes/store/products/purchase-orders.tsx',
    ),
    route('products/transfers', 'routes/store/products/transfers.tsx'),
    route('products/discounts', 'routes/store/products/discounts.tsx'),
    route(
      'products/discounts/:discountId',
      'routes/store/products/discounts.$discountId.tsx',
    ),
    route('products/gift-cards', 'routes/store/products/gift-cards.tsx'),
    route('customers', 'routes/store/customers.tsx'),
    route('customers/segments', 'routes/store/customers/segments.tsx'),
    route('customers/companies', 'routes/store/customers/companies.tsx'),
    route('customers/:customerId', 'routes/store/customers.$customerId.tsx'),
    route('growth', 'routes/store/growth.tsx'),
    route('growth/campaigns', 'routes/store/growth/campaigns.tsx'),
    route('growth/attribution', 'routes/store/growth/attribution.tsx'),
    route('growth/reports', 'routes/store/growth/reports.tsx'),
    route('growth/live-view', 'routes/store/growth/live-view.tsx'),
    route('payments', 'routes/store/payments.tsx'),
    route(
      'payments/risk-management',
      'routes/store/payments/risk-management.tsx',
    ),
    route('payments/sales-tax', 'routes/store/payments/sales-tax.tsx'),
    route('content', 'routes/store/content.tsx'),
    route('content/metaobjects', 'routes/store/content/metaobjects.tsx'),
    route('content/files', 'routes/store/content/files.tsx'),
    route('content/menus', 'routes/store/content/menus.tsx'),
    route('content/blog-posts', 'routes/store/content/blog-posts.tsx'),
    route('markets', 'routes/store/markets.tsx'),
    route('markets/catalogs', 'routes/store/markets/catalogs.tsx'),
    route('online-store', 'routes/store/online-store.tsx'),
    route('inbox', 'routes/store/inbox.tsx'),
    route('dev-ui', 'routes/store/dev-ui-redirect.tsx'),
    route('settings', 'routes/store/settings.tsx'),
    route('settings/general', 'routes/store/settings/general.tsx'),
    route('settings/plan', 'routes/store/settings/plan.tsx'),
    route('settings/billing', 'routes/store/settings/billing.tsx'),
    route('settings/users', 'routes/store/settings/users.tsx'),
    route('settings/payments', 'routes/store/settings/payments.tsx'),
    route(
      'settings/payments/methods',
      'routes/store/settings/payments.methods.tsx',
    ),
    route(
      'settings/payments/payouts',
      'routes/store/settings/payments.payouts.tsx',
    ),
    route(
      'settings/payments/more-ways-to-pay',
      'routes/store/settings/payments.more-ways-to-pay.tsx',
    ),
    route('settings/checkout', 'routes/store/settings/checkout.tsx'),
    route(
      'settings/customer-accounts',
      'routes/store/settings/customer-accounts.tsx',
    ),
    route(
      'settings/shipping-and-delivery',
      'routes/store/settings/shipping-and-delivery.tsx',
    ),
    route(
      'settings/taxes-and-duties',
      'routes/store/settings/taxes-and-duties.tsx',
    ),
    route('settings/locations', 'routes/store/settings/locations.tsx'),
    route(
      'settings/apps-and-sales-channels',
      'routes/store/settings/apps-and-sales-channels.tsx',
    ),
    route('settings/domains', 'routes/store/settings/domains.tsx'),
    route(
      'settings/customer-events',
      'routes/store/settings/customer-events.tsx',
    ),
    route('settings/notifications', 'routes/store/settings/notifications.tsx'),
    route('settings/metaobjects', 'routes/store/settings/metaobjects.tsx'),
    route('settings/languages', 'routes/store/settings/languages.tsx'),
    route(
      'settings/customer-privacy',
      'routes/store/settings/customer-privacy.tsx',
    ),
    route('settings/policies', 'routes/store/settings/policies.tsx'),
    route('settings/dev-ui', 'routes/store/dev-ui.tsx'),
  ]),
] satisfies RouteConfig;
