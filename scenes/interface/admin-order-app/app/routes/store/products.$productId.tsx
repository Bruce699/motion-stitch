import React from 'react';
import { useParams } from 'react-router';
import { MainContentLayout } from '~/components/main-content-layout';
import { ProductAside } from '~/components/product/product-aside';
import { ProductAttributes } from '~/components/product/product-attributes';
import { ProductMedia } from '~/components/product/product-media';
import { ProductDetails } from '~/components/product/product-details';
import { ProductToolbar } from '~/components/product/product-toolbar';
import { MetafieldsCard } from '~/components/metafields-card';
import { ProductPurchaseOptions } from '~/components/product/product-purchase-options';
import { ProductSeoListing } from '~/components/product/product-seo-listing';
import { ProductTitleAndDescription } from '~/components/product/product-title-and-description';
import { catalogs as catalogData } from '~/data/catalogs';
import { channels as channelData } from '~/data/channels';
import {
  productCollections,
  productThemeTemplates,
  getProduct,
  type Product,
  type ProductAttribute,
  type ProductMetafield,
} from '~/data/products';
import { tags as tagData } from '~/data/tags';
import type { ProductDetailsFormValues } from '~/components/product/product-details';
import {
  initProductForm,
  initProductFormReducerState,
  productFormReducer,
  richTextEditorValueToText,
} from '~/components/product/product-form-state';
import type { RichTextEditorValue } from '~/ui';

function ProductDetailPageInner() {
  const { productId = '' } = useParams();
  const product = React.useMemo(() => getProduct(productId), [productId]);

  return <ProductDetailResource product={product} productId={productId} />;
}

function ProductDetailResource({
  product,
  productId,
}: {
  product: Product;
  productId: string;
}) {
  const initialFormState = React.useMemo(
    () => initProductForm(product),
    [product],
  );
  const [reducerState, dispatch] = React.useReducer(
    productFormReducer,
    initialFormState,
    (value) => initProductFormReducerState(product.id, value),
  );
  const formState =
    reducerState.productId === product.id
      ? reducerState
      : initProductFormReducerState(product.id, initialFormState);

  React.useEffect(() => {
    if (reducerState.productId === product.id) return;

    dispatch({
      type: 'resetResource',
      productId: product.id,
      value: initialFormState,
    });
  }, [initialFormState, product.id, reducerState.productId]);

  const {
    values: {
      catalogs,
      category,
      channels,
      collections,
      description,
      images,
      attributes,
      metafields,
      productDetails,
      purchaseOptions,
      status,
      tags,
      themeTemplate,
      title,
    },
  } = formState;
  const hasChanges = formState.dirtyFields.size > 0;
  const handleSave = React.useCallback(() => dispatch({ type: 'save' }), []);
  const handleDiscard = React.useCallback(
    () => dispatch({ type: 'reset' }),
    [],
  );
  const handleCategoryChange = React.useCallback(
    (value: string) => dispatch({ type: 'setCategory', value }),
    [],
  );
  const handleCollectionsChange = React.useCallback(
    (value: string[]) => dispatch({ type: 'setCollections', value }),
    [],
  );
  const handleThemeTemplateChange = React.useCallback(
    (value: string) => dispatch({ type: 'setThemeTemplate', value }),
    [],
  );
  const handleStatusChange = React.useCallback(
    (value: string) => dispatch({ type: 'setStatus', value }),
    [],
  );
  const handleTagsChange = React.useCallback(
    (value: string[]) => dispatch({ type: 'setTags', value }),
    [],
  );
  const handleTitleChange = React.useCallback(
    (value: string) => dispatch({ type: 'setTitle', value }),
    [],
  );
  const handleDescriptionChange = React.useCallback(
    (value: RichTextEditorValue) => dispatch({ type: 'setDescription', value }),
    [],
  );
  const handleImagesChange = React.useCallback(
    (value: string[]) => dispatch({ type: 'setImages', value }),
    [],
  );
  const handleProductDetailsChange = React.useCallback(
    (value: ProductDetailsFormValues) =>
      dispatch({ type: 'setProductDetails', value }),
    [],
  );
  const handleAttributesChange = React.useCallback(
    (value: ProductAttribute[]) => dispatch({ type: 'setAttributes', value }),
    [],
  );
  const handleMetafieldsChange = React.useCallback(
    (value: ProductMetafield[]) => dispatch({ type: 'setMetafields', value }),
    [],
  );
  const handleOnlySellWithPurchaseOptionsChange = React.useCallback(
    (value: boolean) =>
      dispatch({ type: 'setOnlySellWithPurchaseOptions', value }),
    [],
  );
  const handlePublishingChange = React.useCallback((value: string[]) => {
    const nextChannels: string[] = [];
    const nextCatalogs: string[] = [];

    for (const item of value) {
      if (item.startsWith('channel:')) {
        nextChannels.push(item.replace('channel:', ''));
      } else if (item.startsWith('catalog:')) {
        nextCatalogs.push(item.replace('catalog:', ''));
      }
    }

    dispatch({
      type: 'setChannels',
      value: nextChannels,
    });
    dispatch({
      type: 'setCatalogs',
      value: nextCatalogs,
    });
  }, []);
  return (
    <>
      <ProductToolbar
        product={product}
        productId={productId}
        title={title}
        hasChanges={hasChanges}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
      <MainContentLayout
        aside={
          <ProductAside
            catalogs={catalogData}
            channels={channelData}
            collections={productCollections}
            metrics={product.metrics}
            productThemeTemplates={productThemeTemplates}
            selectedCatalogs={catalogs}
            selectedChannels={channels}
            selectedCollections={collections}
            selectedTags={tags}
            status={status}
            tags={tagData}
            category={category}
            themeTemplate={themeTemplate}
            onCategoryChange={handleCategoryChange}
            onCollectionsChange={handleCollectionsChange}
            onThemeTemplateChange={handleThemeTemplateChange}
            onPublishingChange={handlePublishingChange}
            onStatusChange={handleStatusChange}
            onTagsChange={handleTagsChange}
          />
        }
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-8">
            <ProductMedia
              images={images}
              productId={product.id}
              onImagesChange={handleImagesChange}
            />
            <ProductTitleAndDescription
              title={title}
              description={description}
              onTitleChange={handleTitleChange}
              onDescriptionChange={handleDescriptionChange}
            />
            <ProductDetails
              category={category}
              keyScope={product.id}
              variants={product.variants}
              values={productDetails}
              onChange={handleProductDetailsChange}
            />
            {purchaseOptions ? (
              <ProductPurchaseOptions
                groups={purchaseOptions.groups}
                onlySellWithPurchaseOptions={
                  purchaseOptions.onlySellWithPurchaseOptions
                }
                onOnlySellWithPurchaseOptionsChange={
                  handleOnlySellWithPurchaseOptionsChange
                }
              />
            ) : null}
            <ProductAttributes
              attributes={attributes}
              onAttributesChange={handleAttributesChange}
            />
            <MetafieldsCard
              metafields={metafields}
              onMetafieldsChange={handleMetafieldsChange}
            />
            <ProductSeoListing
              site="mvse.com"
              title={title}
              image={images[0] ?? ''}
              description={richTextEditorValueToText(description)}
            />
          </div>
        </div>
      </MainContentLayout>
    </>
  );
}

export default function ProductDetailPage() {
  return <ProductDetailPageInner />;
}
