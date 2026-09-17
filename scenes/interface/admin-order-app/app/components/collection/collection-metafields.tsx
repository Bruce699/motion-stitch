import { MetafieldsCard } from '~/components/metafields-card';
import type { ProductMetafield } from '~/data/products';

function CollectionMetafields({
  metafields,
  onMetafieldsChange,
}: {
  metafields: ProductMetafield[];
  onMetafieldsChange: (metafields: ProductMetafield[]) => void;
}) {
  return (
    <MetafieldsCard
      metafields={metafields}
      onMetafieldsChange={onMetafieldsChange}
    />
  );
}

export { CollectionMetafields };
