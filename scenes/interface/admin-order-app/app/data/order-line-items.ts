import type { Order, OrderLineItemWeight } from './orders';
import { products, type Product, type ProductVariantOption } from './products';

export type OrderDetailLineItem = {
  id: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  weight: OrderLineItemWeight;
  variantOptions: ProductVariantOption[];
  variantTitle: string;
  variantOption: string;
  sku?: string;
};

const productsById = new Map(products.map((product) => [product.id, product]));
const giftCardImage = '/images/store-logo/mvse.jpg';

function parseMoney(value: string) {
  return Number(value.replace(/[^0-9.]/g, '')) || 0;
}

export function getOrderLineItems(
  order: Order | undefined,
): OrderDetailLineItem[] {
  return (
    order?.lineItems.map((lineItem, index) => {
      const product = productsById.get(lineItem.productId);
      const variant = product?.variants[index % (product.variants.length || 1)];
      const isGiftCard = order.deliveryMethod === 'Gift card';
      const giftCardValue = order.giftCardValue ?? '$100.00';
      const unitPrice = isGiftCard
        ? parseMoney(giftCardValue)
        : parseMoney(variant?.price ?? '$0');

      return {
        id: `${lineItem.productId}-${index}`,
        product: isGiftCard
          ? product
            ? {
                ...product,
                id: 'gift-card',
                title: 'Gift Card',
                images: [giftCardImage],
              }
            : undefined
          : product,
        quantity: lineItem.quantity,
        unitPrice,
        weight: lineItem.weight,
        variantOptions: variant?.options ?? [],
        variantTitle: isGiftCard ? 'Value' : (variant?.title ?? 'Default'),
        variantOption: isGiftCard
          ? giftCardValue
          : (variant?.option ?? 'Default'),
        sku: isGiftCard ? undefined : variant?.sku,
      };
    }) ?? []
  );
}
