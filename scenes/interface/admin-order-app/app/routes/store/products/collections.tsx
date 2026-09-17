import { MainContentLayout } from '../../../components/main-content-layout';
import { CollectionsTable } from '~/components/products/collections-table';
import { CollectionsToolbar } from '~/components/products/collections-toolbar';
import { CollectionsEmptyState } from '~/components/products/collections-empty-state';
import { useCollectionsData } from '~/data/collections';

export default function CollectionsPage() {
  const collectionsData = useCollectionsData();
  const hasCollections = collectionsData.length > 0;

  return (
    <>
      <CollectionsToolbar hidden={!hasCollections} />
      {hasCollections ? (
        <MainContentLayout variant="fullWidth">
          <CollectionsTable />
        </MainContentLayout>
      ) : (
        <CollectionsEmptyState />
      )}
    </>
  );
}
