import { ValueListCard } from '~/components/metafields-card';
import type { ProductAttribute } from '~/data/products';

function ProductAttributes({
  attributes,
  onAttributesChange,
}: {
  attributes: ProductAttribute[];
  onAttributesChange: (attributes: ProductAttribute[]) => void;
}) {
  return (
    <ValueListCard
      title="Attributes"
      lists={attributes}
      onListsChange={onAttributesChange}
    />
  );
}

export { ProductAttributes };
