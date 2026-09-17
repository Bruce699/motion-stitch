type AbandonedCheckoutRecoveryStatus = 'Not Recovered';

export type AbandonedCheckout = {
  id: string;
  checkoutNumber: string;
  placedAt: string;
  customer: string;
  region: string;
  recoveryStatus: AbandonedCheckoutRecoveryStatus;
  total: string;
};

export const abandonedCheckouts: AbandonedCheckout[] = [
  {
    id: '33250727460943',
    checkoutNumber: '#33250727460943',
    placedAt: '6 May at 17:22',
    customer: 'Mika Stone',
    region: 'United States',
    recoveryStatus: 'Not Recovered',
    total: '$36,81',
  },
  {
    id: '33111151247439',
    checkoutNumber: '#33111151247439',
    placedAt: '11 Apr at 5:34',
    customer: 'Iris Reed',
    region: 'United States',
    recoveryStatus: 'Not Recovered',
    total: '$34,00',
  },
  {
    id: '32969993191503',
    checkoutNumber: '#32969993191503',
    placedAt: '19 Mar at 16:55',
    customer: 'Zara Wu',
    region: 'United States',
    recoveryStatus: 'Not Recovered',
    total: '$35,72',
  },
  {
    id: '32953510559823',
    checkoutNumber: '#32953510559823',
    placedAt: '17 Mar at 20:32',
    customer: 'Mika Stone',
    region: 'United States',
    recoveryStatus: 'Not Recovered',
    total: '$479,24',
  },
  {
    id: '32905554329679',
    checkoutNumber: '#32905554329679',
    placedAt: '12 Mar at 9:41',
    customer: 'Evan Atlas',
    region: 'United States',
    recoveryStatus: 'Not Recovered',
    total: '$24,00',
  },
  {
    id: '32873936617551',
    checkoutNumber: '#32873936617551',
    placedAt: '7 Mar at 15:51',
    customer: 'June Avery',
    region: 'United States',
    recoveryStatus: 'Not Recovered',
    total: '$34,00',
  },
  {
    id: '32799929696335',
    checkoutNumber: '#32799929696335',
    placedAt: '22 Feb at 16:19',
    customer: 'Arden McNeil',
    region: 'United States',
    recoveryStatus: 'Not Recovered',
    total: '$34,00',
  },
  {
    id: '32799925174351',
    checkoutNumber: '#32799925174351',
    placedAt: '22 Feb at 16:18',
    customer: 'Arden McNeil',
    region: 'United States',
    recoveryStatus: 'Not Recovered',
    total: '$34,00',
  },
];

export function useAbandonedCheckoutsData() {
  return abandonedCheckouts;
}
