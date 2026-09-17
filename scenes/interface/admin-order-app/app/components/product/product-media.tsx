import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { clsx } from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import { Button, Icon, Image } from '~/ui';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';

const productMediaVisibleImageCount = 3;
const productMediaItemInitial = { opacity: 0, scale: 0.9, y: 16 };
const productMediaItemAnimate = { opacity: 1, scale: 1, y: 0 };
const productMediaItemTransition = {
  duration: motionDurations.base,
  ease: motionEasings.easeOut,
};
const productMediaItemStagger = 0.02;
type ProductMediaMode = 'compact' | 'expanding' | 'editing' | 'collapsing';
type ProductMediaItem = {
  id: string;
  src: string;
};
type ProductMediaState = {
  productId: string;
  sourceImagesKey: string;
  mode: ProductMediaMode;
  mediaItems: ProductMediaItem[];
};

function createProductMediaState({
  images,
  productId,
  sourceImagesKey,
}: {
  images: string[];
  productId: string;
  sourceImagesKey: string;
}): ProductMediaState {
  return {
    productId,
    sourceImagesKey,
    mode: 'compact',
    mediaItems: images.map((src, index) => ({
      id: `product-media-${index}-${src}`,
      src,
    })),
  };
}

const ProductMediaImageButton = memo(function ProductMediaImageButton({
  src,
  onClick,
  overlay,
  ariaLabel,
}: {
  src: string;
  onClick?: () => void;
  overlay?: ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      draggable={false}
      onClick={onClick}
      onDragStart={(event) => event.preventDefault()}
      className={clsx(
        'relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border-4 border-white shadow-[0_-1px_6px_0_rgba(0,0,0,0.08),0_2px_2px_-1px_rgba(0,0,0,0.05),0_3px_4px_-1.5px_rgba(0,0,0,0.05),0_5px_16px_-2.5px_rgba(0,0,0,0.05)]',
        'cursor-pointer',
      )}
      aria-label={ariaLabel}
    >
      <Image
        src={src}
        alt="Product media"
        size="full"
        className="pointer-events-none aspect-square w-full select-none"
        borderRadius="none"
      />
      {overlay}
    </button>
  );
});

export function ProductMedia({
  images,
  onImagesChange,
  productId,
}: {
  images: string[];
  onImagesChange: (images: string[]) => void;
  productId: string;
}) {
  const sourceImagesKey = images.join('\u0000');
  const [mediaState, setMediaState] = useState(() =>
    createProductMediaState({ images, productId, sourceImagesKey }),
  );
  const [hoveredMediaItemId, setHoveredMediaItemId] = useState<string | null>(
    null,
  );
  const resetMediaState = useMemo(
    () => createProductMediaState({ images, productId, sourceImagesKey }),
    [images, productId, sourceImagesKey],
  );

  const isMediaStateCurrent =
    mediaState.productId === productId &&
    mediaState.sourceImagesKey === sourceImagesKey;

  if (!isMediaStateCurrent) {
    setMediaState(resetMediaState);
  }

  const currentMediaState = isMediaStateCurrent ? mediaState : resetMediaState;
  const mediaItems = currentMediaState.mediaItems;
  const mediaMode = currentMediaState.mode;
  const showExpandedImages =
    mediaMode === 'expanding' || mediaMode === 'editing';
  const canOpenEditing = mediaMode === 'compact' && mediaItems.length > 0;
  const showCompactAddTile = mediaMode === 'compact';
  const showEditingAddTile = mediaMode === 'editing';
  const summaryImageCount = mediaItems.length - productMediaVisibleImageCount;
  const showSummaryTile = mediaMode === 'compact' && summaryImageCount > 0;
  const renderedMediaItems = showExpandedImages
    ? mediaItems
    : mediaItems.slice(0, productMediaVisibleImageCount);
  const summaryMediaItem = showSummaryTile
    ? mediaItems[productMediaVisibleImageCount]
    : null;
  const summaryOverlay = useMemo(
    () => (
      <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/15 text-xl font-medium text-white backdrop-blur-[3px]">
        +{summaryImageCount}
      </span>
    ),
    [summaryImageCount],
  );
  const openEditing = useCallback(() => {
    if (!canOpenEditing) return;

    setMediaState((state) => ({
      ...state,
      productId,
      sourceImagesKey,
      mode: 'expanding',
      mediaItems,
    }));
  }, [canOpenEditing, mediaItems, productId, sourceImagesKey]);
  const closeEditing = useCallback(() => {
    setMediaState((state) => ({
      ...state,
      productId,
      sourceImagesKey,
      mode: 'collapsing',
      mediaItems,
    }));
  }, [mediaItems, productId, sourceImagesKey]);
  const deleteMediaItem = useCallback(
    (mediaItemId: string) => {
      const nextMediaItems = mediaItems.filter(
        (mediaItem) => mediaItem.id !== mediaItemId,
      );
      const nextImages = nextMediaItems.map((mediaItem) => mediaItem.src);

      setMediaState((state) => ({
        ...state,
        productId,
        sourceImagesKey: nextImages.join('\u0000'),
        mediaItems: nextMediaItems,
      }));
      setHoveredMediaItemId(null);
      onImagesChange(nextImages);
    },
    [mediaItems, onImagesChange, productId],
  );
  useEffect(() => {
    if (mediaMode !== 'expanding') return;

    const timeoutId = window.setTimeout(
      () => {
        setMediaState((state) => {
          if (
            state.productId !== productId ||
            state.sourceImagesKey !== sourceImagesKey ||
            state.mode !== 'expanding'
          ) {
            return state;
          }

          return { ...state, mode: 'editing' };
        });
      },
      (Math.max(0, mediaItems.length - 1) * productMediaItemStagger +
        motionDurations.base) *
        1000,
    );

    return () => window.clearTimeout(timeoutId);
  }, [mediaItems.length, mediaMode, productId, sourceImagesKey]);
  const finishMediaTransition = useCallback(() => {
    setMediaState((state) => {
      if (state.productId !== productId) return state;

      if (state.mode === 'collapsing') {
        return { ...state, mode: 'compact' };
      }

      return state;
    });
  }, [productId]);

  return (
    <div
      className={clsx(
        'relative isolate grid shrink-0 grid-cols-5 gap-5',
        canOpenEditing && 'cursor-pointer',
      )}
    >
      <AnimatePresence
        initial={false}
        mode="popLayout"
        onExitComplete={finishMediaTransition}
      >
        {showExpandedImages ? (
          <m.div
            key="product-media-editing-toolbar"
            layout
            className="col-span-5 -mb-2 flex items-center justify-between py-1"
            initial={{ opacity: 0, y: -24, filter: 'blur(2px)' }}
            animate={{
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              transition: productMediaItemTransition,
            }}
            exit={{
              opacity: 0,
              y: -24,
              transition: productMediaItemTransition,
            }}
            transition={{ layout: productMediaItemTransition }}
          >
            <span className="text-lg font-medium">
              Editing {mediaItems.length} images
            </span>
            <Button
              type="button"
              variant="secondary"
              aria-label="Finish editing product media"
              onClick={closeEditing}
            >
              Done
            </Button>
          </m.div>
        ) : null}
        {renderedMediaItems.map((mediaItem, position) => {
          const { src } = mediaItem;
          const imageEnterDelay =
            mediaMode === 'expanding' ? position * productMediaItemStagger : 0;

          return (
            <m.div
              key={mediaItem.id}
              layout
              className="relative z-2 aspect-square w-full"
              onFocusCapture={() => setHoveredMediaItemId(mediaItem.id)}
              onBlurCapture={() => setHoveredMediaItemId(null)}
              onMouseEnter={() => setHoveredMediaItemId(mediaItem.id)}
              onMouseLeave={() => setHoveredMediaItemId(null)}
              initial={productMediaItemInitial}
              animate={{
                ...productMediaItemAnimate,
                transition: {
                  ...productMediaItemTransition,
                  delay: imageEnterDelay,
                },
              }}
              exit={{
                ...productMediaItemInitial,
                transition: productMediaItemTransition,
              }}
              transition={{ layout: productMediaItemTransition }}
            >
              <ProductMediaImageButton
                src={src}
                ariaLabel="View product media"
                onClick={mediaMode === 'compact' ? openEditing : undefined}
              />
              {mediaMode === 'editing' ? (
                <div
                  className={clsx(
                    'absolute! top-2 right-2 transition-opacity ease-out',
                    hoveredMediaItemId === mediaItem.id
                      ? 'pointer-events-auto opacity-100'
                      : 'pointer-events-none opacity-0',
                  )}
                >
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm-icon"
                    aria-label="Delete product media"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteMediaItem(mediaItem.id);
                    }}
                  >
                    <Icon name="Trash" />
                  </Button>
                </div>
              ) : null}
            </m.div>
          );
        })}
        {summaryMediaItem ? (
          <m.div
            key="product-media-summary"
            className="z-2 aspect-square w-full"
            initial={productMediaItemInitial}
            animate={{
              ...productMediaItemAnimate,
              transition: productMediaItemTransition,
            }}
            exit={{
              ...productMediaItemInitial,
              transition: productMediaItemTransition,
            }}
          >
            <ProductMediaImageButton
              src={summaryMediaItem.src}
              ariaLabel={`View all ${mediaItems.length} product media items`}
              onClick={openEditing}
              overlay={summaryOverlay}
            />
          </m.div>
        ) : null}
        {showCompactAddTile || showEditingAddTile ? (
          <m.div
            key={
              showEditingAddTile
                ? 'add-product-media-editing'
                : 'add-product-media-compact'
            }
            className="z-1 aspect-square w-full"
            onClick={(event) => event.stopPropagation()}
            initial={productMediaItemInitial}
            animate={{
              ...productMediaItemAnimate,
              transition: {
                ...productMediaItemTransition,
              },
            }}
            exit={{
              ...productMediaItemInitial,
              transition: productMediaItemTransition,
            }}
          >
            <button
              type="button"
              className="relative flex aspect-square w-full cursor-pointer items-center justify-center rounded-3xl border-2 border-dashed border-border text-muted-foreground transition-colors ease-out hover:border-gray-300 hover:text-primary"
              aria-label="Add product media"
            >
              <Icon name="Plus" size={20} />
            </button>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
