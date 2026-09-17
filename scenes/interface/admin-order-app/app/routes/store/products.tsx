import { MainContentLayout } from '../../components/main-content-layout';
import { ProductsEmptyState } from '../../components/products/products-empty-state';
import { ProductsToolbar } from '~/components/products/products-toolbar';
import { ProductsTable } from '~/components/products/products-table';
import { useProductsData } from '~/data/products';
import { useMainContent } from '~/components/main-content/hooks/use-main-content';

export default function ProductsPage() {
  const productsData = useProductsData();
  const hasProducts = productsData.length > 0;

  useMainContent({ showBottomScrim: hasProducts });

  return (
    <>
      <ProductsToolbar hasProducts={hasProducts} />
      {hasProducts ? (
        <MainContentLayout variant="fullWidth">
          <ProductsTable />
        </MainContentLayout>
      ) : (
        <MainContentLayout variant="bleed">
          <ProductsEmptyState />
        </MainContentLayout>
      )}
    </>
  );
}
