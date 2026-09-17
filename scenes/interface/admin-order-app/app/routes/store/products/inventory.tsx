import { MainContentLayout } from '../../../components/main-content-layout';
import { InventoryEmptyState } from '~/components/products/inventory-empty-state';
import { InventoryTable } from '~/components/products/inventory-table';
import { InventoryToolbar } from '~/components/products/inventory-toolbar';
import { useProductsData } from '~/data/products';

export default function InventoryPage() {
  const productsData = useProductsData();
  const hasInventory = productsData.length > 0;

  return (
    <>
      <InventoryToolbar hidden={!hasInventory} />
      {hasInventory ? (
        <MainContentLayout variant="fullWidth">
          <InventoryTable />
        </MainContentLayout>
      ) : (
        <InventoryEmptyState />
      )}
    </>
  );
}
