export type HomeCard = {
  id: string;
  title: string;
  description: string;
  visual: {
    src: string;
    alt: string;
  };
};

const homeCardVisuals: HomeCard['visual'][] = [
  {
    src: '/images/home/home-1.jpg',
    alt: 'Illustration of international shipping routes',
  },
  {
    src: '/images/home/home-2.jpg',
    alt: 'Illustration of payment cards',
  },
  {
    src: '/images/home/home-3.jpg',
    alt: 'Illustration of sales planning objects',
  },
  {
    src: '/images/home/home-4.jpg',
    alt: 'Illustration of products and storefront tools',
  },
];

const homeCardEntries: Omit<HomeCard, 'visual'>[] = [
  {
    id: 'eu-shipping-rates',
    title: 'Set up shipping rates for the EU',
    description:
      'Help customers across the EU see clear delivery options before checkout.',
  },
  {
    id: 'payments-setup',
    title: 'Get paid from day one',
    description:
      'Set up payments to accept credit cards, wallets, and other local methods so shoppers can buy with fewer interruptions.',
  },
  {
    id: 'first-ten-sales',
    title: 'Get your first 10 sales',
    description: 'Create a focused plan for your first few customers.',
  },
  {
    id: 'apps-visibility',
    title: 'Increase visibility and conversion with apps',
    description:
      'Give your new business a head start with apps that let you find new customers, increase brand loyalty, create marketing campaigns, and offer customer support.',
  },
  {
    id: 'discover-products',
    title: 'Discover products to sell',
    description:
      'Browse trending products from verified suppliers and add promising picks to your store in just a few clicks.',
  },
  {
    id: 'return-patterns',
    title: 'Return patterns',
    description:
      'Spot products with unusual return rates or reasons, especially items where sizing, photography, or product descriptions may be setting the wrong expectation.',
  },
  {
    id: 'checkout-friction',
    title: 'Checkout friction',
    description:
      'Find checkout steps where customers are dropping off, then review whether shipping, payment, or account requirements are getting in the way.',
  },
  {
    id: 'bundle-opportunity',
    title: 'Bundle opportunity',
    description: 'Pair frequently purchased products into a new offer.',
  },
  {
    id: 'inventory-watchlist',
    title: 'Inventory watchlist',
    description:
      'Track items projected to sell out before restock and decide whether to slow promotion, transfer inventory, or prepare a back-in-stock capture campaign.',
  },
  {
    id: 'email-reengagement',
    title: 'Email re-engagement',
    description:
      'Prepare a campaign for customers who skipped BFCM, using their last purchase, preferred categories, and recent browsing signals to shape the message.',
  },
  {
    id: 'vip-customers',
    title: 'VIP customers',
    description:
      'Identify high-value customers who need a personal touch, including customers with recent support interactions or unusually large holiday orders.',
  },
  {
    id: 'channel-performance',
    title: 'Channel performance',
    description: 'Compare sales trends across social, search, and direct.',
  },
  {
    id: 'fraud-review',
    title: 'Fraud review',
    description:
      'Review orders with risk signals before fulfillment and spot patterns that may need a clearer manual review process.',
  },
  {
    id: 'product-feed-health',
    title: 'Product feed health',
    description:
      'Check missing images, weak titles, rejected channel attributes, and products that are live in your store but underperforming in external catalogs.',
  },
  {
    id: 'cart-recovery',
    title: 'Cart recovery',
    description:
      'Tune abandoned cart messaging for high-intent shoppers, then compare offer strength by cart value, product category, and whether the customer has ordered before.',
  },
  {
    id: 'margin-alerts',
    title: 'Margin alerts',
    description: 'Review discounts that may be cutting too deeply.',
  },
  {
    id: 'local-pickup',
    title: 'Local pickup',
    description:
      'Promote pickup availability in regions with fast demand, especially where nearby inventory can shorten delivery promises.',
  },
  {
    id: 'gift-card-push',
    title: 'Gift card push',
    description: 'Highlight gift cards for last-minute shoppers.',
  },
  {
    id: 'subscription-candidates',
    title: 'Subscription candidates',
    description:
      'Find replenishable products ready for subscriptions by looking at repeat purchase windows, reorder consistency, and customers who buy the same item in multiple orders.',
  },
  {
    id: 'search-terms',
    title: 'Search terms',
    description: 'Review searches that returned weak or empty results.',
  },
  {
    id: 'landing-pages',
    title: 'Landing pages',
    description:
      'Improve pages with high traffic but low conversion by checking page speed, offer clarity, merchandising order, and whether the first screen matches campaign intent.',
  },
  {
    id: 'price-testing',
    title: 'Price testing',
    description:
      'Evaluate price sensitivity on top collection pages and compare changes against conversion, average order value, and repeat purchase behavior.',
  },
  {
    id: 'support-themes',
    title: 'Support themes',
    description:
      'Group recent tickets into common customer concerns and turn repeated issues into product page updates, policy clarifications, or proactive customer messages.',
  },
  {
    id: 'review-requests',
    title: 'Review requests',
    description: 'Queue post-purchase review asks for delivered orders.',
  },
  {
    id: 'audience-growth',
    title: 'Audience growth',
    description: 'Track new subscribers by source and campaign.',
  },
  {
    id: 'back-in-stock',
    title: 'Back in stock',
    description:
      'Prepare alerts for products returning to inventory and prioritize customers who viewed, saved, or abandoned carts with those products.',
  },
  {
    id: 'collection-refresh',
    title: 'Collection refresh',
    description:
      'Update merchandising for collections with stale ordering, buried bestsellers, or products that no longer match the campaign bringing shoppers in.',
  },
  {
    id: 'tax-settings',
    title: 'Tax settings',
    description: 'Verify tax rules for regions with recent policy changes.',
  },
  {
    id: 'payment-capture',
    title: 'Payment capture',
    description:
      'Review authorized payments that need capture soon, with special attention to orders waiting on inventory checks or manual fraud review.',
  },
  {
    id: 'store-speed',
    title: 'Store speed',
    description:
      'Identify theme changes that may be slowing key pages before those delays affect checkout intent.',
  },
  {
    id: 'inventory-transfer',
    title: 'Inventory transfer',
    description: 'Suggest stock transfers between busy locations.',
  },
  {
    id: 'market-expansion',
    title: 'Market expansion',
    description:
      'Compare international traffic with conversion readiness, including shipping coverage, duties messaging, localized payment options, and collection availability.',
  },
  {
    id: 'discount-cleanup',
    title: 'Discount cleanup',
    description:
      'Archive expired discounts, overlapping promotions, and codes that still appear in customer-facing campaigns.',
  },
  {
    id: 'creator-campaigns',
    title: 'Creator campaigns',
    description: 'Measure creator links against new customer revenue.',
  },
  {
    id: 'wholesale-leads',
    title: 'Wholesale leads',
    description:
      'Review company accounts showing repeat bulk interest and prepare the next outreach with order history already in view.',
  },
  {
    id: 'fulfillment-batches',
    title: 'Fulfillment batches',
    description:
      'Group orders that can be packed and shipped together by destination, product type, package size, and fulfillment location to reduce handling time.',
  },
  {
    id: 'customer-tags',
    title: 'Customer tags',
    description: 'Suggest useful tags from recent behavior.',
  },
  {
    id: 'low-stock-ads',
    title: 'Low-stock ads',
    description:
      'Pause campaigns sending traffic to nearly sold-out items, then shift spend toward products with healthier inventory.',
  },
  {
    id: 'exchange-flow',
    title: 'Exchange flow',
    description:
      'Improve exchange options for common return scenarios by suggesting alternate sizes, replacement colors, or store credit before customers request a refund.',
  },
  {
    id: 'post-purchase-upsell',
    title: 'Post-purchase upsell',
    description: 'Recommend products that fit recent orders.',
  },
  {
    id: 'catalog-errors',
    title: 'Catalog errors',
    description:
      'Fix products rejected by external sales channels and catch recurring feed issues before the next sync.',
  },
  {
    id: 'policy-updates',
    title: 'Policy updates',
    description: 'Review policy pages that need clearer customer language.',
  },
  {
    id: 'customer-cohorts',
    title: 'Customer cohorts',
    description:
      'Compare retention by acquisition month and channel, then flag cohorts where repeat purchase behavior changed after a promotion, shipping delay, or product launch.',
  },
  {
    id: 'refund-queue',
    title: 'Refund queue',
    description: 'Prioritize refunds waiting on manual review.',
  },
  {
    id: 'forecast-demand',
    title: 'Forecast demand',
    description:
      'Project demand for hero products over the next month using recent traffic, conversion, reorder timing, and inventory movement.',
  },
  {
    id: 'holiday-calendar',
    title: 'Holiday calendar',
    description:
      'Plan campaign timing around upcoming retail moments and note the inventory, creative, and discount decisions each one needs.',
  },
  {
    id: 'app-cleanup',
    title: 'App cleanup',
    description:
      'Review installed apps with overlapping functionality, unused storefront scripts, or slow-loading embeds that may be adding cost without clear impact.',
  },
  {
    id: 'order-tags',
    title: 'Order tags',
    description: 'Apply suggested tags to improve fulfillment workflows.',
  },
  {
    id: 'customer-privacy',
    title: 'Customer privacy',
    description:
      'Check privacy settings and consent collection status before expanding into new channels or regions.',
  },
  {
    id: 'profit-drivers',
    title: 'Profit drivers',
    description:
      'Rank products contributing most to net profit this week, factoring in discounts, shipping costs, return risk, and channel fees.',
  },
  {
    id: 'gift-guide',
    title: 'Gift guide',
    description: 'Build a guided collection from trending products.',
  },
];

export const homeCards: HomeCard[] = homeCardEntries.map((card, index) => ({
  ...card,
  visual: homeCardVisuals[index % homeCardVisuals.length],
}));
