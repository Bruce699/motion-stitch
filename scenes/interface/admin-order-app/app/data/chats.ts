export type ChatThread = {
  id: string;
  title: string;
  turns: Array<{
    id: string;
    user: 'sidekick' | 'merchant';
    message: string;
    revealed?: boolean;
  }>;
};

export type DemoResponseScript = {
  matches: Array<string>;
  toolCalls: Array<string>;
  answer: string;
};

export const fallbackDemoResponseScript: DemoResponseScript = {
  matches: [],
  toolCalls: [
    'Searching knowledge base...',
    'Reading store context...',
    'Checking recent activity...',
    'Generating response...',
  ],
  answer:
    'I can help with that in context here. For small edits, I will keep the answer compact and stay in this mini chat.',
};

export const demoResponseScripts: Array<DemoResponseScript> = [
  {
    matches: ['how are sales today', 'sales today', 'today sales', 'sales'],
    toolCalls: [
      "Reading today's sales...",
      'Comparing conversion rate...',
      'Checking top products...',
      'Summarizing store performance...',
    ],
    answer:
      'Sales are slightly ahead of pace today. Revenue is up 8% compared with the same time yesterday, mostly from repeat customers and two higher-value orders. The useful next move is to keep the current campaign running, but watch checkout conversion because sessions are growing faster than completed orders.',
  },
  {
    matches: [
      'which products need attention',
      'products need attention',
      'product attention',
      'products',
    ],
    toolCalls: [
      'Reviewing product performance...',
      'Checking inventory levels...',
      'Comparing sell-through...',
      'Finding unusual movement...',
      'Summarizing product risks...',
    ],
    answer:
      'Three products are worth checking. The Bosquet Skateboard Deck is getting steady traffic but lower add-to-cart rate than similar items, so the page may need clearer product details. The Signature Hoodie is selling fastest and could run low if the current pace continues through the weekend. The Everyday Tote has healthy inventory, but views are down compared with last week, which usually means it needs better placement or a stronger collection entry point.',
  },
  {
    matches: [
      'what changed with customers this week',
      'customers this week',
      'customer behavior',
      'customers',
    ],
    toolCalls: [
      'Reading customer cohorts...',
      'Checking repeat purchase rate...',
      'Comparing average order value...',
      'Summarizing customer changes...',
    ],
    answer:
      'Customer behavior looks a little more intentional this week. Returning customers are placing fewer orders, but their average order value is higher, which suggests they are buying with more confidence. New customers are browsing more products before checkout, so discovery is working, but the path to purchase may be slightly longer. I would watch whether that extra browsing turns into bundles or starts creating checkout drop-off.',
  },
  {
    matches: ['orders', 'order status', 'latest orders', 'recent orders'],
    toolCalls: [
      'Reading recent orders...',
      'Checking fulfillment status...',
      'Looking for payment issues...',
      'Summarizing order activity...',
    ],
    answer:
      'Recent orders look healthy overall. Most paid orders are moving through fulfillment normally, and there are no obvious payment spikes or cancellation clusters. The main thing I would check is the small set of unfulfilled orders that are older than the usual handling window. Those are the ones most likely to create support tickets if they sit much longer.',
  },
  {
    matches: ['discount', 'discounts', 'promotion', 'promo code', 'coupon'],
    toolCalls: [
      'Reviewing active discounts...',
      'Checking usage by order...',
      'Comparing discount conversion...',
      'Looking for margin impact...',
    ],
    answer:
      'The discount setup looks useful, but I would keep it targeted. Broad percentage discounts are easy for customers to understand, but they can quietly eat margin when they apply to products that would have sold anyway. A better test is to keep the current offer visible to new customers or hesitant checkout sessions, then compare conversion lift against the average discount amount. If conversion does not move enough to cover the margin tradeoff, I would narrow the audience or switch the offer to a bundle threshold.',
  },
  {
    matches: ['inventory', 'stock', 'low stock', 'out of stock'],
    toolCalls: [
      'Checking inventory levels...',
      'Comparing sell-through rate...',
      'Finding low stock products...',
    ],
    answer:
      'A few products are getting close to the point where they deserve attention. Fast sellers with low available inventory should be prioritized first, especially if they are also showing up in active campaigns or collections. For slower products, I would avoid reordering until placement improves or demand becomes more consistent.',
  },
  {
    matches: ['shipping', 'fulfillment', 'delivery'],
    toolCalls: [
      'Reading fulfillment settings...',
      'Checking delivery promises...',
      'Reviewing unfulfilled orders...',
    ],
    answer:
      'Shipping looks like a place where clearer expectations could help. If delivery estimates are too broad, customers may hesitate before checkout; if they are too optimistic, support volume can climb after purchase. I would make sure the shipping promise shown before checkout matches the actual fulfillment pace, then watch whether support questions about delivery timing go down.',
  },
  {
    matches: [
      'conversion',
      'checkout conversion',
      'conversion down',
      'why is conversion down',
    ],
    toolCalls: [
      'Reading session trends...',
      'Comparing add-to-cart rate...',
      'Checking checkout starts...',
      'Reviewing completed orders...',
      'Looking for funnel drop-off...',
    ],
    answer:
      'Conversion looks like it may be softening in the middle of the funnel rather than only at checkout. Sessions are still arriving, but fewer visitors are turning product interest into checkout intent. That usually points to product-page confidence signals: unclear sizing, thin descriptions, weak product imagery, missing delivery expectations, or price hesitation. I would start by looking at high-traffic products with lower add-to-cart rates than the rest of the catalog, because improving those pages can lift conversion without needing more traffic.',
  },
  {
    matches: ['product page', 'description', 'product description', 'pdp'],
    toolCalls: [
      'Reviewing product content...',
      'Checking merchandising signals...',
      'Comparing similar products...',
    ],
    answer:
      'For the product page, I would make the first screen answer three questions quickly: what is it, why is it worth the price, and what should the customer feel confident about before buying. The details can stay compact, but they should remove hesitation. Stronger materials, fit, dimensions, delivery expectations, and a clearer primary image often do more than another paragraph of marketing copy.',
  },
  {
    matches: ['email', 'campaign', 'marketing campaign', 'newsletter'],
    toolCalls: [
      'Reviewing recent campaigns...',
      'Checking click performance...',
      'Comparing order attribution...',
      'Finding follow-up opportunities...',
    ],
    answer:
      'The next campaign should probably be more specific than a general store update. Pick one clear customer intent, like restocking a popular item, introducing a small collection, or giving returning customers a reason to complete a second purchase. A focused campaign is easier to evaluate because the click and conversion signals tell you whether the message worked, not just whether people opened the email.',
  },
  {
    matches: ['hello', 'hi'],
    toolCalls: [],
    answer:
      "Hi friend! I'm here to help you get your business to the next level. What can I do for you today?",
  },
  {
    matches: ['what can you do', 'help', 'how can you help'],
    toolCalls: [],
    answer:
      'I can help inspect store performance, spot product or order issues, draft next steps, and explain what changed in plain language. Ask me about sales, products, customers, orders, discounts, inventory, shipping, or conversion.',
  },
  {
    matches: ['thank you', 'thanks'],
    toolCalls: [],
    answer: 'You got it.',
  },
];

export const initialChatThreads: Array<ChatThread> = [
  {
    id: 'c1',
    title: 'How are sales today?',
    turns: [
      {
        id: 'c1-merchant-1',
        user: 'merchant',
        message: 'How are sales today?',
      },
      {
        id: 'c1-sidekick-1',
        user: 'sidekick',
        revealed: true,
        message:
          'Sales are slightly ahead of pace today. Revenue is up 8% compared with the same time yesterday, mostly from repeat customers and two higher-value orders. Keep the current campaign running, but watch checkout conversion because sessions are growing faster than completed orders.',
      },
    ],
  },
  {
    id: 'c2',
    title: 'Products that need attention',
    turns: [
      {
        id: 'c2-merchant-1',
        user: 'merchant',
        message: 'Which products need attention?',
      },
      {
        id: 'c2-sidekick-1',
        user: 'sidekick',
        revealed: true,
        message:
          'Three products are worth checking. The Bosquet Skateboard Deck is getting steady traffic but lower add-to-cart rate than similar items. The Signature Hoodie is selling fastest and could run low if the current pace continues. The Everyday Tote has healthy inventory, but views are down compared with last week.',
      },
    ],
  },
  {
    id: 'c3',
    title: 'Customer behavior this week',
    turns: [
      {
        id: 'c3-merchant-1',
        user: 'merchant',
        message: 'What changed with customers this week?',
      },
      {
        id: 'c3-sidekick-1',
        user: 'sidekick',
        revealed: true,
        message:
          'Customer behavior looks a little more intentional this week. Returning customers are placing fewer orders, but their average order value is higher. New customers are browsing more products before checkout, so discovery is working, but the path to purchase may be slightly longer.',
      },
    ],
  },
  {
    id: 'c4',
    title: 'Recent order health',
    turns: [
      {
        id: 'c4-merchant-1',
        user: 'merchant',
        message: 'How do recent orders look?',
      },
      {
        id: 'c4-sidekick-1',
        user: 'sidekick',
        revealed: true,
        message:
          'Recent orders look healthy overall. Most paid orders are moving through fulfillment normally, and there are no obvious payment spikes or cancellation clusters. The main thing to check is the small set of unfulfilled orders older than the usual handling window.',
      },
    ],
  },
  {
    id: 'c5',
    title: 'Conversion soft spots',
    turns: [
      {
        id: 'c5-merchant-1',
        user: 'merchant',
        message: 'Why is conversion softening?',
      },
      {
        id: 'c5-sidekick-1',
        user: 'sidekick',
        revealed: true,
        message:
          'Conversion looks like it may be softening in the middle of the funnel rather than only at checkout. Sessions are still arriving, but fewer visitors are turning product interest into checkout intent. Start with high-traffic products that have lower add-to-cart rates than the rest of the catalog.',
      },
    ],
  },
];
