import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
} from 'react';
import { Icon, type IconName } from '~/ui/components/icon/icon';
import { clsx } from 'clsx';

type ImageBorderRadius =
  | 'none'
  | 'base'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl';

type ImageShadow = 'none' | 'sm' | 'md';
type ImageObjectFit = 'cover' | 'contain';

type ImageProps = Omit<ComponentProps<'div'>, 'children' | 'onLoad'> & {
  src?: string;
  alt?: string;
  decoding?: ComponentProps<'img'>['decoding'];
  loading?: ComponentProps<'img'>['loading'];
  onLoad?: () => void;
  shadow?: ImageShadow;
  size?: number | string;
  borderRadius?: ImageBorderRadius;
  pillIcon?: IconName;
  pillLabel?: number | string;
  withBorder?: boolean;
  objectFit?: ImageObjectFit;
};

const imageBorderRadiusValues: Record<ImageBorderRadius, string> = {
  none: '0px',
  base: 'var(--radius)',
  xs: 'var(--radius-xs)',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  '2xl': 'var(--radius-2xl)',
  '3xl': 'var(--radius-3xl)',
};

const imageRootBaseClasses = 'relative isolate';
const imageRootSizeClasses = {
  fixed: 'size-[var(--image-size)]',
  full: 'w-full',
  intrinsic: 'inline-block',
};
const imageClasses =
  'relative z-2 rounded-[var(--image-border-radius)] transition-opacity duration-[var(--image-crossfade-duration)] linear';
const imagePreviousClasses =
  'absolute inset-0 z-1 rounded-[var(--image-border-radius)] transition-opacity duration-[var(--image-crossfade-duration)] linear';
const imageObjectFitClasses: Record<ImageObjectFit, string> = {
  cover: 'object-cover',
  contain: 'object-contain',
};
const imagePlaceholderClasses =
  'ease-out absolute inset-0 z-0 rounded-[var(--image-border-radius)] bg-muted transition-opacity';
const imageBaseShadowClasses = 'shadow-sm';
const imageMediumShadowClasses =
  'shadow-[0_-1px_6px_0_rgba(0,0,0,0.08),0_2px_2px_-1px_rgba(0,0,0,0.05),0_3px_4px_-1.5px_rgba(0,0,0,0.05),0_5px_16px_-2.5px_rgba(0,0,0,0.05)]';
const imageBorderClasses = 'border-4 border-white';
const imageEmptyClasses =
  'flex size-full items-center justify-center rounded-[var(--image-border-radius)] bg-background shadow-xs';
const imagePillClasses =
  'absolute right-2.5 bottom-2.5 z-2 inline-flex items-center justify-center gap-0.5 rounded-full bg-white/90 px-1.5 shadow-[0_0_2px_1px_rgba(0,0,0,0.04),0_1px_2px_-0.5px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.06),0_4px_8px_-2px_rgba(0,0,0,0.06)] backdrop-blur-lg';
const imageCrossfadeDurationMs = 500;

function resolveImageSize(size: number | string) {
  return typeof size === 'number' ? `${size}px` : size;
}

function Image({
  alt = '',
  borderRadius = '2xl',
  className,
  decoding,
  loading,
  onLoad,
  objectFit = 'cover',
  pillIcon,
  pillLabel,
  shadow = 'none',
  size,
  src,
  style,
  withBorder = false,
  ...props
}: ImageProps) {
  const isFullSize = size === 'full';
  const hasFixedSize = size !== undefined && !isFullSize;
  const imageRef = useRef<HTMLImageElement | null>(null);
  const loadedSrcRef = useRef<string | undefined>(undefined);
  const onLoadRef = useRef(onLoad);
  const visibleSrcRef = useRef<string | undefined>(undefined);
  const loadAnimationFrameRef = useRef<number | null>(null);
  const previousImageTimeoutRef = useRef<number | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | undefined>(undefined);
  const [previousImageSrc, setPreviousImageSrc] = useState<string | undefined>(
    undefined,
  );
  const isImageLoaded = src !== undefined && loadedSrc === src;
  const imageStyle = {
    ...style,
    ...(hasFixedSize ? { '--image-size': resolveImageSize(size) } : {}),
    '--image-border-radius': imageBorderRadiusValues[borderRadius],
    '--image-crossfade-duration': `${imageCrossfadeDurationMs}ms`,
  } as CSSProperties;
  const completeImageLoad = useCallback(() => {
    if (loadAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(loadAnimationFrameRef.current);
    }

    loadAnimationFrameRef.current = window.requestAnimationFrame(() => {
      loadAnimationFrameRef.current = null;
      visibleSrcRef.current = src;
      setLoadedSrc(src);
      onLoadRef.current?.();

      if (previousImageTimeoutRef.current !== null) {
        window.clearTimeout(previousImageTimeoutRef.current);
      }

      previousImageTimeoutRef.current = window.setTimeout(() => {
        previousImageTimeoutRef.current = null;
        setPreviousImageSrc(undefined);
      }, imageCrossfadeDurationMs);
    });
  }, [src]);
  const handleImageLoad = useCallback(() => {
    if (loadedSrcRef.current === src) return;

    loadedSrcRef.current = src;
    completeImageLoad();
  }, [completeImageLoad, src]);
  const setImageElement = useCallback(
    (element: HTMLImageElement | null) => {
      imageRef.current = element;

      if (element?.complete && element.naturalWidth > 0) {
        handleImageLoad();
      }
    },
    [handleImageLoad],
  );
  const cancelPendingImageWork = useCallback(() => {
    if (loadAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(loadAnimationFrameRef.current);
      loadAnimationFrameRef.current = null;
    }

    if (previousImageTimeoutRef.current !== null) {
      window.clearTimeout(previousImageTimeoutRef.current);
      previousImageTimeoutRef.current = null;
    }
  }, []);

  useLayoutEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  useLayoutEffect(() => {
    if (loadAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(loadAnimationFrameRef.current);
      loadAnimationFrameRef.current = null;
    }

    loadedSrcRef.current = undefined;
    if (visibleSrcRef.current && visibleSrcRef.current !== src) {
      if (previousImageTimeoutRef.current !== null) {
        window.clearTimeout(previousImageTimeoutRef.current);
        previousImageTimeoutRef.current = null;
      }

      setPreviousImageSrc(visibleSrcRef.current);
    }

    if (imageRef.current?.complete && imageRef.current.naturalWidth > 0) {
      handleImageLoad();
    }
  }, [handleImageLoad, src]);

  useEffect(() => {
    return cancelPendingImageWork;
  }, [cancelPendingImageWork]);

  return (
    <div
      className={clsx(
        imageRootBaseClasses,
        isFullSize
          ? imageRootSizeClasses.full
          : hasFixedSize
            ? imageRootSizeClasses.fixed
            : imageRootSizeClasses.intrinsic,
        className,
      )}
      style={imageStyle}
      {...props}
    >
      {src ? (
        <>
          <div
            aria-hidden
            className={clsx(
              imagePlaceholderClasses,
              isImageLoaded ? 'opacity-0' : 'opacity-100',
            )}
          />
          <img
            key={src}
            ref={setImageElement}
            className={clsx(
              imageClasses,
              size === undefined ? 'h-auto max-w-full' : 'size-full',
              imageObjectFitClasses[objectFit],
              isImageLoaded ? 'opacity-100' : 'opacity-0',
              withBorder && imageBorderClasses,
              shadow === 'sm' && imageBaseShadowClasses,
              shadow === 'md' && imageMediumShadowClasses,
            )}
            src={src}
            alt={alt}
            loading={loading}
            decoding={decoding}
            onLoad={handleImageLoad}
          />
          {previousImageSrc ? (
            <img
              aria-hidden
              className={clsx(
                imagePreviousClasses,
                'size-full',
                imageObjectFitClasses[objectFit],
                isImageLoaded ? 'opacity-0' : 'opacity-100',
                withBorder && imageBorderClasses,
                shadow === 'sm' && imageBaseShadowClasses,
                shadow === 'md' && imageMediumShadowClasses,
              )}
              src={previousImageSrc}
              alt=""
              loading={loading}
              decoding={decoding}
            />
          ) : null}
        </>
      ) : (
        <div className={imageEmptyClasses}>
          <span className="text-muted-foreground">
            <Icon name="Image" />
          </span>
        </div>
      )}
      {pillIcon && pillLabel !== undefined ? (
        <div className={imagePillClasses}>
          <span className="text-muted-foreground">
            <Icon name={pillIcon} size={12} strokeWidth={2} />
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {pillLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export { Image };
export type { ImageBorderRadius, ImageProps, ImageShadow };
