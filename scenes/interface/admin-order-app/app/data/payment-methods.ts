export type PaymentMethod = {
  id: string;
  name: string;
  online: string;
  inPerson: string;
  icon: string;
};

export type MoreWayToPayMethod = {
  name: string;
  category: string;
  icon: string;
};

const otherWaysToPayAssetPath = '/images/payment-settings/other-ways-to-pay';

export const paymentMethods: PaymentMethod[] = [
  {
    id: 'visa',
    name: 'Visa',
    online: '2.0% + $0.30',
    inPerson: '2.0% + $0.00',
    icon: '/images/payment-settings/small-cards/visa.svg',
  },
  {
    id: 'mastercard',
    name: 'Mastercard',
    online: '2.0% + $0.30',
    inPerson: '2.0% + $0.00',
    icon: '/images/payment-settings/small-cards/mastercard.svg',
  },
  {
    id: 'amex',
    name: 'American Express',
    online: '2.0% + $0.30',
    inPerson: '2.0% + $0.00',
    icon: '/images/payment-settings/small-cards/amex.svg',
  },
  {
    id: 'discover',
    name: 'Discover',
    online: '2.0% + $0.30',
    inPerson: '2.0% + $0.00',
    icon: '/images/payment-settings/small-cards/discover.svg',
  },
  {
    id: 'interac',
    name: 'Interac',
    online: '-',
    inPerson: '0% + $0.15',
    icon: '/images/payment-settings/small-cards/interac.svg',
  },
  {
    id: 'shop-pay',
    name: 'Shop Pay',
    online: '2.0% + $0.30',
    inPerson: '2.0% + $0.30',
    icon: '/images/payment-settings/small-cards/shop-pay.svg',
  },
  {
    id: 'apple-pay',
    name: 'Apple Pay',
    online: '2.0% + $0.30',
    inPerson: '2.0% + $0.00',
    icon: '/images/payment-settings/small-cards/apple-pay.svg',
  },
  {
    id: 'google-pay',
    name: 'Google Pay',
    online: '2.0% + $0.30',
    inPerson: '2.0% + $0.00',
    icon: '/images/payment-settings/small-cards/google-pay.svg',
  },
];

export const moreWaysToPayMethods: MoreWayToPayMethod[] = [
  {
    name: 'Affirm',
    category: 'Other',
    icon: `${otherWaysToPayAssetPath}/affirm.svg`,
  },
  {
    name: 'Afterpay',
    category: 'Other',
    icon: `${otherWaysToPayAssetPath}/afterpay.svg`,
  },
  {
    name: 'Amazon Pay',
    category: 'Other',
    icon: `${otherWaysToPayAssetPath}/amazon.svg`,
  },
  {
    name: 'Bitcoin Cash',
    category: 'Cryptocurrency',
    icon: `${otherWaysToPayAssetPath}/bitcoin-cash.svg`,
  },
  {
    name: 'Binance USD',
    category: 'Cryptocurrency',
    icon: `${otherWaysToPayAssetPath}/binance-usd.svg`,
  },
  {
    name: 'Cash App Pay',
    category: 'Other',
    icon: `${otherWaysToPayAssetPath}/cash-app-pay.svg`,
  },
  {
    name: 'Dogecoin',
    category: 'Cryptocurrency',
    icon: `${otherWaysToPayAssetPath}/dogecoin.svg`,
  },
  {
    name: 'Ethereum',
    category: 'Cryptocurrency',
    icon: `${otherWaysToPayAssetPath}/ethereum.svg`,
  },
  {
    name: 'Hana Card',
    category: 'Other',
    icon: `${otherWaysToPayAssetPath}/hana-card.svg`,
  },
  {
    name: 'Interac',
    category: 'Debit card',
    icon: `${otherWaysToPayAssetPath}/interac.svg`,
  },
  {
    name: 'Kakao Pay',
    category: 'Other',
    icon: `${otherWaysToPayAssetPath}/kakao-pay.svg`,
  },
  {
    name: 'Lydia',
    category: 'Other',
    icon: `${otherWaysToPayAssetPath}/lydia.svg`,
  },
  {
    name: 'Seven Eleven',
    category: 'Other',
    icon: `${otherWaysToPayAssetPath}/seven-eleven.svg`,
  },
  {
    name: 'Sezzle',
    category: 'Other',
    icon: `${otherWaysToPayAssetPath}/sezzle.svg`,
  },
  {
    name: 'Venti',
    category: 'Other',
    icon: `${otherWaysToPayAssetPath}/venti.svg`,
  },
];
