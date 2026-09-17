import type { OrderFulfillmentStatus, OrderPaymentStatus } from '~/data/orders';

export function paymentStatusVariant(status: OrderPaymentStatus) {
  if (status === 'Payment pending') return 'caution';
  if (status === 'Refunded') return 'default';

  return 'default';
}

export function fulfillmentStatusVariant(status: OrderFulfillmentStatus) {
  if (status === 'Partially fulfilled') return 'caution';
  if (status === 'Unfulfilled') return 'caution';
  if (status === 'Ready for pickup') return 'info';

  return 'default';
}
