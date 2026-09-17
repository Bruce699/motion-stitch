import { useCallback, useEffect, useMemo, useState } from 'react';

function getUniqueImageSrcs(imageSrcs: string[]) {
  return [...new Set(imageSrcs.filter(Boolean))];
}

function hasLoadedAllImages(currentSrcs: Set<string>, imageSrcs: string[]) {
  if (currentSrcs.size !== imageSrcs.length) return false;

  return imageSrcs.every((imageSrc) => currentSrcs.has(imageSrc));
}

function pruneLoadedImages(currentSrcs: Set<string>, imageSrcs: string[]) {
  const nextImageSrcs = new Set(imageSrcs);

  if ([...currentSrcs].every((imageSrc) => nextImageSrcs.has(imageSrc))) {
    return currentSrcs;
  }

  return new Set(
    [...currentSrcs].filter((imageSrc) => nextImageSrcs.has(imageSrc)),
  );
}

export function useLoadedImages(imageSrcs: string[]) {
  const [loadedImageSrcs, setLoadedImageSrcs] = useState(
    () => new Set<string>(),
  );
  const imageSrcKey = imageSrcs.join('\0');
  const uniqueImageSrcs = useMemo(
    () => getUniqueImageSrcs(imageSrcs),
    [imageSrcKey],
  );
  const allImagesLoaded = hasLoadedAllImages(loadedImageSrcs, uniqueImageSrcs);
  const handleImageLoad = useCallback((imageSrc: string) => {
    if (!imageSrc) return;

    setLoadedImageSrcs((currentSrcs) => {
      if (currentSrcs.has(imageSrc)) return currentSrcs;

      const nextSrcs = new Set(currentSrcs);
      nextSrcs.add(imageSrc);
      return nextSrcs;
    });
  }, []);

  useEffect(() => {
    setLoadedImageSrcs((currentSrcs) =>
      pruneLoadedImages(currentSrcs, uniqueImageSrcs),
    );
  }, [uniqueImageSrcs]);

  return { allImagesLoaded, handleImageLoad };
}
