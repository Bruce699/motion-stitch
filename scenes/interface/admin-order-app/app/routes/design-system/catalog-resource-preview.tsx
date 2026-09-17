import { collections } from '~/data/collections';
import { customers } from '~/data/customers';
import { discounts } from '~/data/discounts';
import { orders } from '~/data/orders';
import { products } from '~/data/products';
import { Button, ResourcePreview } from '~/ui';

function ResourcePreviewCatalogPreview() {
  return (
    <div className="flex max-w-xl flex-wrap gap-2">
      <ResourcePreview
        type="customer"
        resource={customers[0]}
        trigger={
          <Button onClick={() => {}} variant="secondary">
            Customer
          </Button>
        }
      />
      <ResourcePreview
        type="order"
        resource={orders[0]}
        trigger={
          <Button onClick={() => {}} variant="secondary">
            Order
          </Button>
        }
      />
      <ResourcePreview
        type="product"
        resource={products[0]}
        trigger={
          <Button onClick={() => {}} variant="secondary">
            Product
          </Button>
        }
      />
      <ResourcePreview
        type="collection"
        resource={collections[0]}
        trigger={
          <Button onClick={() => {}} variant="secondary">
            Collection
          </Button>
        }
      />
      <ResourcePreview
        type="discount"
        resource={discounts[0]}
        trigger={
          <Button onClick={() => {}} variant="secondary">
            Discount
          </Button>
        }
      />
    </div>
  );
}

export { ResourcePreviewCatalogPreview };
