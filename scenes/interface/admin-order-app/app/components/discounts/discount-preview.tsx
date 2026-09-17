import { AnimatePresence, m } from 'motion/react';
import { useEffect, useRef } from 'react';
import type { Collection } from '~/data/collections';
import { useLoadedImages } from '~/hooks/use-loaded-images';
import { Image } from '~/ui';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';

export function DiscountPreview({
  collections,
}: {
  collections: Collection[];
}) {
  const hasPlayedInitialAnimationRef = useRef(false);
  const collectionImageSrcs = collections.map(
    (collection) => `/images/${collection.image}`,
  );
  const { allImagesLoaded, handleImageLoad } =
    useLoadedImages(collectionImageSrcs);

  useEffect(() => {
    hasPlayedInitialAnimationRef.current = true;
  }, []);

  return (
    <div className="flex min-h-[190px] items-center overflow-hidden py-5 ps-5 pt-6">
      <AnimatePresence>
        {collections.map((collection, index) => {
          const imageSrc = `/images/${collection.image}`;

          return (
            <m.div
              key={collection.image}
              className="shrink-0"
              initial={
                hasPlayedInitialAnimationRef.current
                  ? { marginRight: 0, opacity: 0, scale: 0.92, width: 0, y: 16 }
                  : {
                      marginRight: 16,
                      opacity: 0,
                      scale: 0.92,
                      width: 120,
                      y: 16,
                    }
              }
              animate={
                allImagesLoaded
                  ? {
                      marginRight: 16,
                      opacity: 1,
                      scale: 1,
                      width: 120,
                      y: 0,
                    }
                  : {
                      marginRight: 16,
                      opacity: 0,
                      scale: 0.92,
                      width: 120,
                      y: 16,
                    }
              }
              exit={{
                marginRight: 0,
                opacity: 0,
                scale: 0.92,
                width: 0,
                y: 16,
              }}
              transition={{
                delay: index * 0.06,
                duration: motionDurations.slow,
                ease: motionEasings.easeOut,
              }}
            >
              <div className="group flex w-[120px] cursor-pointer flex-col gap-2">
                <div className="transition-transform ease-out group-hover:scale-103 group-hover:rotate-1 group-active:scale-[0.975]">
                  <Image
                    src={imageSrc}
                    size={120}
                    withBorder
                    shadow="md"
                    pillIcon="Tag"
                    pillLabel={collection.productCount}
                    onLoad={() => handleImageLoad(imageSrc)}
                  />
                </div>
                <h2 className="text-center text-sm font-medium text-muted-foreground transition-colors ease-out group-hover:text-primary">
                  {collection.title}
                </h2>
              </div>
            </m.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
